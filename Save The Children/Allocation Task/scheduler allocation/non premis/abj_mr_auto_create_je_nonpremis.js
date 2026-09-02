/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
function (record, search, runtime) {

    function getInputData() {
        try {
            var scriptObj = runtime.getCurrentScript();
            var customTransId = scriptObj.getParameter({ name: 'custscript_abj_source_trans_id' });
            
            if (!customTransId) {
                return [];
            }
            
            var sourceRec = record.load({
                type: 'customtransaction_abj_auto_cam_premise', 
                id: customTransId
            });

            var allocationType = sourceRec.getValue('custbody_abj_allocation_type');
            if (allocationType != 2 && allocationType != '2') {
                return [];
            }

            var sublistId = 'recmachcustrecord_stc_allocation_premise_cam';
            var lineCount = sourceRec.getLineCount({ sublistId: sublistId });
            var groupedData = {};

            for (var i = 0; i < lineCount; i++) {
                var account = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_account_premise_to_alloca', line: i });
                var costCenter = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_cost_center_to_allocate', line: i });
                var period = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_period_to_allocate', line: i });
                
                var groupKey = account + '_' + costCenter + '_' + period;

                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        transId: customTransId,
                        account: account,
                        costCenter: costCenter,
                        period: period,
                        currencyId: sourceRec.getValue('currency'),
                        lines: []
                    };
                }

                groupedData[groupKey].lines.push({
                    lineIndex: i
                });
            }

            var dataToProcess = [];
            for (var key in groupedData) {
                dataToProcess.push(groupedData[key]);
            }

            return dataToProcess;

        } catch (e) {
            return [];
        }
    }

    function map(context) {
        var groupData = JSON.parse(context.value);
        var transId = groupData.transId;
        var periodId = groupData.period;
        var accountHead = groupData.account;
        var costCenterFromSearch = groupData.costCenter;
        var currencyId = groupData.currencyId;

        try {
            if (!periodId || !accountHead) {
                return;
            }

            var periodIdText = search.lookupFields({ type: search.Type.ACCOUNTING_PERIOD, id: periodId, columns: ['periodname'] }).periodname;
            var accountHeadText = search.lookupFields({ type: search.Type.ACCOUNT, id: accountHead, columns: ['name'] }).name;
            var memoBase = 'Allocation Non Premise ' + accountHeadText + ' ' + periodIdText;

            var amountAllocated = 0;
            var projectCodeFromSearch = "";
            
            var searchAmt = search.load({ id: 'customsearch_abj_premise_allocate_amou_3' });
            var filtersAmt = searchAmt.filters || [];
            filtersAmt.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: periodId }));
            filtersAmt.push(search.createFilter({ name: 'custrecord_stc_account_cam_mapping', join: 'account', operator: search.Operator.ANYOF, values: accountHead }));
            searchAmt.filters = filtersAmt;

            searchAmt.run().each(function(result) {
                amountAllocated += Number(result.getValue({ name: 'amount', summary: 'SUM' }) || 0);
                if (!costCenterFromSearch) costCenterFromSearch = result.getValue({ name: "department", summary: "GROUP" });
                if (!projectCodeFromSearch) projectCodeFromSearch = result.getValue({ name: "class", summary: "GROUP" });
                return true;
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
                    amt: Number(res.getValue({name: "amount", summary: "SUM"}) || 0)
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
            var filtersSpend = searchSpend.filters || [];
            filtersSpend.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: periodId }));
            searchSpend.filters = filtersSpend;
            
            searchSpend.run().each(function(res){
                var amt = Number(res.getValue(res.columns[2]) || 0);
                totalSpendAmt += amt;
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

            var jeRec = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
            if (currencyId) jeRec.setValue({ fieldId: 'currency', value: currencyId });
            jeRec.setValue({ fieldId: 'postingperiod', value: periodId });
            jeRec.setValue({ fieldId: 'memo', value: memoBase });
            
            var dataSisa = [];

            for (var i = 0; i < finalData.length; i++) {
                var row = finalData[i];
                var bobot = row.amtSpend / totalSpendAmt;
                var allocation = Number((bobot * amountAllocated).toFixed(2));
                var amtDebit = 0;
                var sisa = 0;
                var prosentText = Number((bobot * 100).toFixed(2)) + ' %';

                if (row.amtRemaining <= 0) { 
                    sisa = allocation; 
                } else if (row.amtRemaining >= allocation) { 
                    amtDebit = allocation; 
                } else { 
                    amtDebit = row.amtRemaining; 
                    sisa = Number((allocation - row.amtRemaining).toFixed(2)); 
                }

                if (sisa > 0) {
                    dataSisa.push({
                        sisa: sisa, costCenter: row.costCenter, project: row.project, 
                        sofId: row.sof, sofText: row.sofText, prosentText: prosentText
                    });
                }

                if (amtDebit > 0) {
                    jeRec.selectNewLine({ sublistId: 'line' });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: amtDebit });
                    if(row.costCenter) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: row.costCenter });
                    if(row.project) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: row.project });
                    if(row.sof) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: row.sof });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_abj_remaining_budget_sof', value: row.amtRemaining });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value: prosentText });
                    jeRec.commitLine({ sublistId: 'line' });
                }
            }

            for (var k = 0; k < allDataCredits.length; k++) {
                var cr = allDataCredits[k];
                if (cr.amt > 0) {
                    jeRec.selectNewLine({ sublistId: 'line' });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: cr.acc });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: Number(cr.amt.toFixed(2)) });
                    if(cr.costCenter) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: cr.costCenter });
                    if(cr.projectCode) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: cr.projectCode });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "57" });
                    jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoBase });
                    jeRec.commitLine({ sublistId: 'line' });
                }
            }

            for (var m = 0; m < dataSisa.length; m++) {
                var s = dataSisa[m];
                var sofName = s.sofText;
                if (!sofName && s.sofId) {
                    try {
                        sofName = search.lookupFields({ type: "customrecord_cseg_stc_sof", id: s.sofId, columns: ["name"] }).name;
                    } catch(e){}
                }

                var memoSet = accountHeadText + " - " + (sofName || '') + " - " + Number(s.sisa.toFixed(2));
                
                jeRec.selectNewLine({ sublistId: 'line' });
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHead });
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: Number(s.sisa.toFixed(2)) });
                if(s.costCenter) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: s.costCenter });
                if(s.project) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: s.project });
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: "24" });
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoSet });
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_stc_percentage_allocation_cam', value: s.prosentText });
                jeRec.commitLine({ sublistId: 'line' });
            }

            var count = jeRec.getLineCount({ sublistId: 'line' });
            var totalD = 0, totalC = 0;
            for (var x = 0; x < count; x++) {
                totalD += Number(jeRec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: x }) || 0);
                totalC += Number(jeRec.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: x }) || 0);
            }
            
            var diff = Number((totalC - totalD).toFixed(2));
            if (diff !== 0) {
                for (var y = count - 1; y >= 0; y--) {
                    var oldD = Number(jeRec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: y }) || 0);
                    if (oldD > 0) {
                        jeRec.selectLine({ sublistId: 'line', line: y });
                        jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: Number((oldD + diff).toFixed(2)) });
                        jeRec.commitLine({ sublistId: 'line' });
                        break; 
                    }
                }
            }

            var newJeId = jeRec.save({ enableSourcing: true, ignoreMandatoryFields: false });

            if (newJeId) {
                var lineIndexes = [];
                for (var z = 0; z < groupData.lines.length; z++) {
                    lineIndexes.push(groupData.lines[z].lineIndex);
                }

                context.write({
                    key: transId,
                    value: {
                        jeId: newJeId,
                        lineIndexes: lineIndexes
                    }
                });
            }

        } catch (err) {
        }
    }

    function reduce(context) {
        try {
            var transId = context.key; 
            var customTransType = 'customtransaction_abj_auto_cam_premise'; 
            var sublistId = 'recmachcustrecord_stc_allocation_premise_cam';

            var sourceRec = record.load({
                type: customTransType,
                id: transId,
                isDynamic: false
            });

            var isUpdated = false;

            for (var i = 0; i < context.values.length; i++) {
                var data = JSON.parse(context.values[i]);
                var jeId = data.jeId;
                var lineIndexes = data.lineIndexes;

                for (var j = 0; j < lineIndexes.length; j++) {
                    var lineIdx = lineIndexes[j];
                    sourceRec.setSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_stc_allocate_journal_link',
                        line: lineIdx,
                        value: jeId
                    });
                    isUpdated = true;
                }
            }

            if (isUpdated) {
                sourceRec.save({ ignoreMandatoryFields: true });
            }

        } catch (e) {
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    };
});