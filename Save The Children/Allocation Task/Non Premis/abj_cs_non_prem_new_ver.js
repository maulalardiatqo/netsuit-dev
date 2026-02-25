/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], 
function (runtime, log, url, currentRecord, currency, record, search, message) {
    
    var processMsg;

    function pageInit(context) {}

    function fieldChanged(context) {
        var rec = context.currentRecord;
        var amountAllocated = rec.getValue('custbody_abj_amount_to_allocate');
        var cForm = rec.getValue('customform');
        
        if (cForm == 141 && context.fieldId == 'custbody_abj_destination_account') {
            var periodId = rec.getValue('postingperiod');
            var accountId = rec.getValue('custbody_abj_destination_account');
            var totalAmt = 0;
            
            var searchAmt = search.load({ id: 'customsearch_abj_premise_allocate_amou_3' });
            var filters = searchAmt.filters;
            filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: periodId }));
            filters.push(search.createFilter({ name: 'custrecord_stc_account_cam_mapping', join: 'account', operator: search.Operator.ANYOF, values: accountId }));
            searchAmt.filters = filters;

            searchAmt.run().each(function(result) {
                totalAmt += Number(result.getValue({ name: 'amount', summary: 'SUM' }) || 0);
                return true;
            });

            rec.setValue({ fieldId: 'custbody_abj_amount_to_allocate', value: totalAmt });
        }

        if (cForm == 141 && context.sublistId == 'line' && context.fieldId == 'custcol_tar_percentage') {
            var percentage = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_tar_percentage' });
            if (percentage) {
                var cekMemo = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'memo' });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: cekMemo + ' ' + percentage + '%' });
                var newAmount = Number(amountAllocated) * (Number(percentage) / 100);
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: newAmount });
            }
        }
    }

    function onClickGenerate() {
        var rec = currentRecord.get();
        var btn = document.getElementById('custpage_btn_generate_sof');
        if (btn) { btn.disabled = true; btn.style.opacity = "0.6"; }

        processMsg = message.create({
            title: "Processing",
            message: "Generating Journal Lines... Please wait.",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            try {
                generate(rec, btn);
            } catch (e) {
                if (processMsg) processMsg.hide();
                alert("Error: " + e.message);
            }
        }, 500);
    }

    function generate(rec, btn) {
        var cekAmountAllocate = rec.getValue('custbody_abj_amount_to_allocate');
        var accountHead = rec.getValue('custbody_abj_destination_account');
        var periodId = rec.getValue('postingperiod');

        if (!cekAmountAllocate || !accountHead) {
            finishProcess(btn, 'Account & Amount To Allocate Cannot Be Empty');
            return;
        }

        var costCenterFromSearch = "";
        var projectCodeFromSearch = "";
        var searchAmt = search.load({ id: 'customsearch_abj_premise_allocate_amou_3' });
        var filtersAmt = searchAmt.filters;
        filtersAmt.push(search.createFilter({ name: 'postingperiod', operator: 'IS', values: periodId }));
        filtersAmt.push(search.createFilter({ name: 'custrecord_stc_account_cam_mapping', join: 'account', operator: 'ANYOF', values: accountHead }));
        searchAmt.filters = filtersAmt;

        searchAmt.run().each(function(result) {
            costCenterFromSearch = result.getValue({ name: "department", summary: "GROUP" });
            projectCodeFromSearch = result.getValue({ name: "class", summary: "GROUP" });
            return false;
        });

        var allDataCredits = [];
        var transactionSearchObj = search.create({
            type: "transaction",
            filters: [
                ["posting","is","T"], "AND", ["amount","greaterthan","0.00"], "AND", 
                ["postingperiod","abs",periodId], "AND",
                ["account.custrecord_stc_account_cam_mapping","anyof",accountHead]
            ],
            columns: [
                {name: "account", summary: "GROUP"},
                {name: "department", summary: "GROUP"},
                {name: "class", summary: "GROUP"},
                {name: "amount", summary: "SUM"},
                {name: "line.cseg_stc_sof", summary: "GROUP"}
            ]
        });

        transactionSearchObj.run().each(function(res){
            allDataCredits.push({
                acc: res.getValue({name: "account", summary: "GROUP"}),
                costCenter: res.getValue({name: "department", summary: "GROUP"}),
                projectCode: res.getValue({name: "class", summary: "GROUP"}),
                amt: Number(res.getValue({name: "amount", summary: "SUM"}) || 0),
                sof: res.getValue({name: "line.cseg_stc_sof", summary: "GROUP"})
            });
            return true;
        });

        var remainingMap = {};
        search.load({ id: 'customsearch326' }).run().each(function(res){
            var budget = Number(res.getValue(res.columns[1]) || 0);
            var actual = Number(res.getValue(res.columns[2]) || 0);
            remainingMap[res.getValue(res.columns[0])] = budget - actual;
            return true;
        });

        var finalData = [];
        var totalSpendAmt = 0;
        var searchSpend = search.load({ id: 'customsearch331' });
        searchSpend.filters.push(search.createFilter({ name: 'postingperiod', operator: 'ANYOF', values: periodId }));
        
        searchSpend.run().each(function(res){
            var amt = Number(res.getValue(res.columns[2]) || 0);
            totalSpendAmt = Number(totalSpendAmt) + Number(amt);
            finalData.push({
                sof: res.getValue(res.columns[0]),
                sofText: res.getText(res.columns[0]),
                amtSpend: amt,
                costCenter: costCenterFromSearch,
                project: projectCodeFromSearch,
                amtRemaining: remainingMap[res.getValue(res.columns[0])] || 0
            });
            
            return true;
        });

        var lineCount = rec.getLineCount({ sublistId: 'line' });
        for (var i = lineCount - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: 'line', line: i, ignoreRecalc: true });
        }

        prosesJournalRecursive(rec, finalData, allDataCredits, accountHead, cekAmountAllocate, totalSpendAmt, btn);
    }

    function prosesJournalRecursive(rec, finalData, allDataCredits, accountHead, cekAmountAllocate, totalSpendAmt, btn) {
        var headerCurrency = rec.getValue('currency');
        var periodIdText = rec.getText('postingperiod');
        var accountHeadText = rec.getText('custbody_abj_destination_account');
        var memoBase = 'Allocation Non Premise ' + accountHeadText + ' ' + periodIdText;
        var dataSisa = [];

        function round2(num) { return Number(Number(num).toFixed(2)); }

        function doFinalData(idx) {
            if (idx >= finalData.length) {
                doCredits(0);
                return;
            }
            var row = finalData[idx];
            var bobot = row.amtSpend / totalSpendAmt;
            var allocation = round2(bobot * Number(cekAmountAllocate));
            var amtDebit = 0;
            var sisa = 0;
            var prosent = round2(bobot * 100)
            var prosentText = prosent + ' %'
            if (row.amtRemaining <= 0) { 
                console.log('masuk kondisi 1', row.amtRemaining)
                sisa = allocation; 
            }else if (row.amtRemaining >= allocation) { 
                console.log('masuk kondisi 2', row.amtRemaining)
                amtDebit = allocation; 
            }else { 
                console.log('masuk kondisi 3', row.amtRemaining)
                amtDebit = row.amtRemaining; sisa = round2(allocation - row.amtRemaining); 
            }

            if (sisa > 0) {
                console.log('masuk sisa', sisa)
                dataSisa.push({ sisa: sisa, costCenter: row.costCenter, project: row.project, sofId: row.sof, sofText: row.sofText, prosent: (bobot * 100), remaining: row.amtRemaining , prosentText : prosentText});
            }

            if (amtDebit) {
                console.log('prosentText', prosentText)
                rec.selectNewLine({ sublistId: 'line' });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: amtDebit });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: row.costCenter });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: row.project });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: row.sof });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_abj_remaining_budget_sof', value: row.amtRemaining });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value:  prosentText});
                
                setTimeout(function(){
                    checkCurrency(rec, headerCurrency);
                    rec.commitLine({ sublistId: 'line' });
                    doFinalData(idx + 1);
                }, 500);
            } else {
                doFinalData(idx + 1);
            }
        }

        function doCredits(idx) {
            if (idx >= allDataCredits.length) {
                doSisa(0);
                return;
            }
            var cr = allDataCredits[idx];
            rec.selectNewLine({ sublistId: 'line' });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: cr.acc });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: round2(cr.amt) });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: cr.costCenter });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: cr.projectCode });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "57" });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoBase });

            setTimeout(function(){
                checkCurrency(rec, headerCurrency);
                rec.commitLine({ sublistId: 'line' });
                doCredits(idx + 1);
            }, 500);
        }

        function doSisa(idx) {
            if (idx >= dataSisa.length) {
                balanceJournal(rec, memoBase);
                finishProcess(btn);
                return;
            }
            
            var s = dataSisa[idx];
            var idSof = s.sofId
            console.log('idSof', idSof)
            sofName = ""
            if(idSof){
                var sofSearch = search.lookupFields({
                    type: "customrecord_cseg_stc_sof",
                    id: idSof,
                    columns: ["name"],
                });
                console.log('sofSearch', sofSearch)
                sofName = sofSearch.name
                console.log('sofName', sofName)
            }
            
            
            var memoSet = accountHeadText + " - " + sofName + "- " + round2(s.sisa)
            rec.selectNewLine({ sublistId: 'line' });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: round2(s.sisa) });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: s.costCenter });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: s.project });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "24" });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoSet });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value: s.prosentText });
            

            setTimeout(function(){
                checkCurrency(rec, headerCurrency);
                rec.commitLine({ sublistId: 'line' });
                doSisa(idx + 1);
            }, 500);
        }

        doFinalData(0);
    }

    function checkCurrency(rec, headCur) {
        var lineCur = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur' });
        if (!lineCur && headCur) {
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur', value: headCur });
        }
    }

    function balanceJournal(rec, memo) {
        var totalD = 0, totalC = 0;
        var count = rec.getLineCount({ sublistId: 'line' });
        for (var i = 0; i < count; i++) {
            totalD += Number(rec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: i }) || 0);
            totalC += Number(rec.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: i }) || 0);
        }
        var diff = Number((totalC - totalD).toFixed(2));
        if (diff !== 0) {
            for (var j = count - 1; j >= 0; j--) {
                if (Number(rec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: j }) || 0) > 0) {
                    rec.selectLine({ sublistId: 'line', line: j });
                    var oldD = Number(rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'debit' }));
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: Number((oldD + diff).toFixed(2)) });
                    rec.commitLine({ sublistId: 'line' });
                    break;
                }
            }
        }
    }

    function finishProcess(btn, msg) {
        if (processMsg) processMsg.hide();
        if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
        if (msg) alert(msg);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onClickGenerate: onClickGenerate
    };
});