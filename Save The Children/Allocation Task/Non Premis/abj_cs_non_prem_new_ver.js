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

        var mappingAccountHead = {
            "370": "- National Salaries",
            "376": "- Non salary benefits",
            "470": "- Vehicle & transport costs",
            "492": "- Travel & Lodging",
            "528": "- Premise costs",
            "596": "- Other"
        };
        var mappedTitleTask = mappingAccountHead[accountHead] || "";
        
        var pTaskDea = "";
        var pTaskDrc = "";
        if (mappedTitleTask) {
            var projecttaskSearchObj = search.create({
                type: "projecttask",
                filters: [
                    ["title", "contains", mappedTitleTask], 
                    "AND", 
                    ["job.internalid", "anyof", "4433"]
                ],
                columns: [
                    search.createColumn({name: "cseg_stc_drc_segmen", label: "DRC Segment"}),
                    search.createColumn({name: "cseg_stc_segmentdea", label: "DEA Segment"})
                ]
            });
            
            projecttaskSearchObj.run().each(function(result) {
                pTaskDrc = result.getValue({name: "cseg_stc_drc_segmen"});
                pTaskDea = result.getValue({name: "cseg_stc_segmentdea"});
                return false; 
            });
        }
        // id saved search prod : customsearch1696
        // id saved search sb : customsearch1670
        var deaDrcMap = {};
        var search1696 = search.load({ id: 'customsearch1670' });
        search1696.filters.push(search.createFilter({ 
            name: 'custrecord_stc_account_allocation', 
            operator: search.Operator.ANYOF, 
            values: accountHead 
        }));
        
        search1696.columns.push(search.createColumn({ name: 'custrecord_stc_sof_link' }));
        search1696.columns.push(search.createColumn({ name: 'custrecord_dea_allocation' }));
        search1696.columns.push(search.createColumn({ name: 'custrecord_stc_drc_from_dea' }));

        search1696.run().each(function(res) {
            var sofId = res.getValue({ name: 'custrecord_stc_sof_link' });
            var deaVal = res.getValue({ name: 'custrecord_dea_allocation' });
            var drcVal = res.getValue({ name: 'custrecord_stc_drc_from_dea' });
            if (sofId) {
                deaDrcMap[sofId] = { dea: deaVal, drc: drcVal };
            }
            return true;
        });

        var allDataCredits = [];
        var transactionSearchObj = search.create({
            type: "transaction",
            filters: [
                ["posting","is","T"], "AND", ["amount","greaterthan","0.00"], "AND", 
                ["postingperiod","abs",periodId], "AND",
                ["account.custrecord_stc_account_cam_mapping","anyof",accountHead],
                "AND", 
                [["cseg_stc_sof","anyof","57"],"OR",["line.cseg_stc_sof","anyof","57"]]
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
        
        function parseDateIndo(dateStr) {
            if (!dateStr) return new Date(0);
            var parts = dateStr.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        var startDate = '';
        var endDate = '';

        search.create({
            type: search.Type.ACCOUNTING_PERIOD,
            filters: [['internalid', 'anyof', periodId]],
            columns: ['startdate', 'enddate']
        }).run().each(function(res) {
            startDate = res.getValue('startdate');
            endDate = res.getValue('enddate');
            return false; 
        });

        var budgetRawData = [];
        var projectIds = [];

        var projectbudgetSearchObj = search.create({
            type: "projectbudget",
            filters: [
                ["amounttype", "anyof", "Cost"], "AND", 
                ["amountdate", "within", startDate, endDate]
            ],
            columns: [
                search.createColumn({ name: "project", summary: "GROUP" }),
                search.createColumn({ name: "amountdate", summary: "GROUP" }),
                search.createColumn({ name: "eac", summary: "SUM" })
            ]
        });

        projectbudgetSearchObj.run().each(function(res) {
            var prj = res.getValue({ name: "project", summary: "GROUP" });
            var amtDate = res.getValue({ name: "amountdate", summary: "GROUP" });
            var eac = Number(res.getValue({ name: "eac", summary: "SUM" }) || 0);
            budgetRawData.push({ project: prj, dateStr: amtDate, dateObj: parseDateIndo(amtDate), eac: eac });
            if (projectIds.indexOf(prj) === -1) projectIds.push(prj);
            return true;
        });

        var exchangeRateMap = {}; 
        if (projectIds.length > 0) {
            var exRateSearch = search.create({
                type: "customrecord_stc_exchange_rate_donor_cur",
                filters: [["custrecord_stc_sof_segment", "anyof", projectIds]],
                columns: ["custrecord_stc_sof_segment", "custrecord_stc_exchng_rate", "custrecord_stc_effective_date"]
            });
            exRateSearch.run().each(function(res) {
                var sofId = res.getValue("custrecord_stc_sof_segment");
                var rate = Number(res.getValue("custrecord_stc_exchng_rate") || 0);
                var effDateObj = parseDateIndo(res.getValue("custrecord_stc_effective_date"));
                if (!exchangeRateMap[sofId]) exchangeRateMap[sofId] = [];
                exchangeRateMap[sofId].push({ rate: rate, dateObj: effDateObj });
                return true;
            });
        }

        var finalBudgetMap = {};
        budgetRawData.forEach(function(data) {
            var rates = exchangeRateMap[data.project] || [];
            var validRate = 0, closestDate = new Date(0);
            for (var i = 0; i < rates.length; i++) {
                if (rates[i].dateObj <= data.dateObj && rates[i].dateObj > closestDate) {
                    closestDate = rates[i].dateObj; validRate = rates[i].rate;
                }
            }
            finalBudgetMap[data.project] = (finalBudgetMap[data.project] || 0) + (data.eac * validRate);
        });

        var remainingMap = {};
        var search326 = search.load({ id: 'customsearch326' });
        search326.filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: periodId }));
        search326.run().each(function(res){
            var projectId = res.getValue(res.columns[0]);
            var actual = Number(res.getValue(res.columns[2]) || 0);
            remainingMap[projectId] = Number(finalBudgetMap[projectId] || 0) - actual;
            return true;
        });

        var allValidSOF = []
        var deaAllocSearch = search.create({
            type: "customrecord_stc_dea_allocation",
            filters: [["custrecord_stc_allocation_type","anyof","2"], "AND", ["custrecord_stc_account_allocation","anyof",accountHead]],
            columns: [search.createColumn({name: "cseg_stc_sof", label: "Award Management"})]
        });
        deaAllocSearch.run().each(function(validresult){
            allValidSOF.push(validresult.getValue({name: "cseg_stc_sof"}));
            return true;
        });

        var finalData = [];
        var totalSpendAmt = 0;
        var searchSpend = search.load({ id: 'customsearch331' });
        searchSpend.filters.push(search.createFilter({ name: 'postingperiod', operator: 'ANYOF', values: periodId }));
        
        searchSpend.run().each(function(res){
            var sofCol3Value = res.getValue(res.columns[3]);
            var selectedSofId = sofCol3Value ? sofCol3Value : res.getValue(res.columns[0]);
            var selectedSofText = sofCol3Value ? (res.getText(res.columns[3]) || sofCol3Value) : (res.getText(res.columns[0]) || res.getValue(res.columns[0]));
            var isFromCol3 = !!sofCol3Value;
            var sofCol0Text = res.getText(res.columns[0]) || res.getValue(res.columns[0]);

            if (allValidSOF.includes(selectedSofId)) {
                var amt = Number(res.getValue(res.columns[2]) || 0);
                totalSpendAmt += amt;
                var mappedDeaDrc = deaDrcMap[selectedSofId] || {};

                finalData.push({
                    sof: selectedSofId, sofText: selectedSofText, amtSpend: amt, costCenter: costCenterFromSearch,
                    project: projectCodeFromSearch, amtRemaining: remainingMap[selectedSofId] || 0,
                    drc : mappedDeaDrc.drc || "", dea : mappedDeaDrc.dea || "",
                    isFromCol3: isFromCol3, sofCol0Text: sofCol0Text
                });
            }
            return true;
        });

        var lineCount = rec.getLineCount({ sublistId: 'line' });
        for (var i = lineCount - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: 'line', line: i, ignoreRecalc: true });
        }

        // Jalankan ulang secara rekursif
        prosesJournalRecursive(rec, finalData, allDataCredits, accountHead, cekAmountAllocate, totalSpendAmt, btn, pTaskDea, pTaskDrc);
    }

    // =========================================================================
    // UPDATE: Rekursif Tunggal. Hanya ada 1 SetTimeout per line, memberi waktu
    // Account load, lalu tembak SOF/DRC/DEA secara bersamaan via ignoreFieldChange.
    // =========================================================================
    function prosesJournalRecursive(rec, finalData, allDataCredits, accountHead, cekAmountAllocate, totalSpendAmt, btn, pTaskDea, pTaskDrc) {
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
            var prosent = round2(bobot * 100);
            var prosentText = prosent + ' %';
            var lineMemo = memoBase + (row.isFromCol3 ? ' Receiver from SOF ' + row.sofCol0Text : '');

            if (row.amtRemaining <= 0) { 
                sisa = allocation; 
            } else if (row.amtRemaining >= allocation) { 
                amtDebit = allocation; 
            } else { 
                amtDebit = row.amtRemaining; 
                sisa = round2(allocation - row.amtRemaining); 
            }

            if (sisa > 0) {
                dataSisa.push({ 
                    sisa: sisa, costCenter: row.costCenter, project: row.project, 
                    sofId: row.sof, sofText: row.sofText, prosent: (bobot * 100), 
                    remaining: row.amtRemaining, prosentText : prosentText,
                    dea : row.dea, drc : row.drc, isFromCol3: row.isFromCol3, sofCol0Text: row.sofCol0Text
                });
            }

            if (amtDebit) {
                rec.selectNewLine({ sublistId: 'line' });
                // Set field basic yang butuh load NetSuite
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: amtDebit });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: row.costCenter });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: row.project });
                
                // Jeda 400ms agar account selesai loading
                setTimeout(function(){
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: lineMemo });
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_abj_remaining_budget_sof', value: row.amtRemaining });
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value: prosentText});
                    
                    // Tembak Custom Segments dengan mode PAKSA (tanpa memicu delay tambahan)
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: row.sof, ignoreFieldChange: true });
                    if (row.drc) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: row.drc, ignoreFieldChange: true });
                    if (row.dea) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: row.dea, ignoreFieldChange: true });
                    
                    checkCurrency(rec, headerCurrency);
                    rec.commitLine({ sublistId: 'line' });
                    doFinalData(idx + 1);
                }, 400);
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
            
            setTimeout(function(){
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoBase });
                
                // Tembak Custom Segments
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "57", ignoreFieldChange: true });
                if (pTaskDrc) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: pTaskDrc, ignoreFieldChange: true });
                if (pTaskDea) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: pTaskDea, ignoreFieldChange: true });
                
                checkCurrency(rec, headerCurrency);
                rec.commitLine({ sublistId: 'line' });
                doCredits(idx + 1);
            }, 400);
        }

        function doSisa(idx) {
            if (idx >= dataSisa.length) {
                balanceJournal(rec, memoBase);
                finishProcess(btn);
                return;
            }
            var s = dataSisa[idx];
            var idSof = s.sofId;
            var sofName = "";
            if(idSof){
                var sofSearch = search.lookupFields({ type: "customrecord_cseg_stc_sof", id: idSof, columns: ["name"] });
                sofName = sofSearch.name;
            }
            var memoSet = accountHeadText + " - " + sofName + "- " + round2(s.sisa);
            if (s.isFromCol3) memoSet += ' Receiver from SOF ' + s.sofCol0Text;

            rec.selectNewLine({ sublistId: 'line' });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: round2(s.sisa) });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: s.costCenter });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: s.project });
            
            setTimeout(function(){
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoSet });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value: s.prosentText });
                
                // Tembak Custom Segments
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "615", ignoreFieldChange: true });
                if (s.drc) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: s.drc, ignoreFieldChange: true });
                if (s.dea) rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: s.dea, ignoreFieldChange: true });
                
                checkCurrency(rec, headerCurrency);
                rec.commitLine({ sublistId: 'line' });
                doSisa(idx + 1);
            }, 400);
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