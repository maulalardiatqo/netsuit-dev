/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search'], 
function(record, runtime, search) {

    function getInputData() {
        try {
            var scriptObj = runtime.getCurrentScript();
            var transId = scriptObj.getParameter({ name: 'custscript_abj_trans_id' });
            
            if (!transId) {
                return [];
            }
            
            var customTransType = 'customtransaction_abj_auto_cam_premise'; 
            var sourceRec = record.load({
                type: customTransType,
                id: transId
            });
            
            var amountHeader = sourceRec.getValue('custbody_abj_amount_to_allocate'); 
            var sublistId = 'recmachcustrecord_stc_allocation_premise_cam';
            var lineCount = sourceRec.getLineCount({ sublistId: sublistId });
            var groupedData = {};

            for (var i = 0; i < lineCount; i++) {
                var account = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_account_premise_to_alloca', line: i });
                var costCenter = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_cost_center_to_allocate', line: i });
                var period = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_period_to_allocate', line: i });
                var amount = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_amount_to_allocate', line: i });
                var percent = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_percent_to_allocate', line: i });
                var awardList = sourceRec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_stc_award_list_premise', line: i });

                var groupKey = account + '_' + costCenter + '_' + period;

                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        transId: transId,
                        account: account,
                        costCenter: costCenter,
                        period: period,
                        amountHeader: amountHeader,
                        lines: []
                    };
                }

                groupedData[groupKey].lines.push({
                    lineIndex: i,
                    amount: amount,
                    percent: percent,
                    awardList: awardList
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
        try {
            var groupData = JSON.parse(context.value);
            var jeIdPremise = null;
            var jeIdResource = null;
            var errorMsg = '';
            
            try {
                jeIdPremise = createJEPremis(groupData);
                if (jeIdPremise) {
                    try {
                        jeIdResource = createJEResources(groupData);
                    } catch (errRes) {
                        errorMsg = errRes.message;
                    }
                }
            } catch (errPremise) {
                errorMsg = errPremise.message;
            }
            
            var lineIndexes = [];
            for (var i = 0; i < groupData.lines.length; i++) {
                lineIndexes.push(groupData.lines[i].lineIndex);
            }

            context.write({
                key: groupData.transId,
                value: {
                    jeIdPremise: jeIdPremise,
                    jeIdResource: jeIdResource,
                    errorMsg: errorMsg,
                    lineIndexes: lineIndexes
                }
            });
        } catch (e) {
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
                var jeIdPremise = data.jeIdPremise;
                var errorMsg = data.errorMsg;
                var lineIndexes = data.lineIndexes;

                for (var j = 0; j < lineIndexes.length; j++) {
                    var lineIdx = lineIndexes[j];
                    
                    if (jeIdPremise) {
                        sourceRec.setSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_stc_allocate_journal_link',
                            line: lineIdx,
                            value: jeIdPremise
                        });
                    }
                    
                    sourceRec.setSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_error_message',
                        line: lineIdx,
                        value: errorMsg || ''
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

    function summarize(summary) {
    }

    function createJEPremis(data) {
        var jeRec = record.create({
            type: record.Type.JOURNAL_ENTRY,
            isDynamic: true,
            defaultValues: { customform: '140' }
        });
        
        if (data.period) jeRec.setValue({ fieldId: 'postingperiod', value: data.period });
        jeRec.setValue({ fieldId: 'custbody_stc_source_account_allocation', value: data.account });

        var totalAmountToAllocate = 0;
        if (data.account && data.period) {
            var searchAmt = search.load({ id: 'customsearch_abj_premise_allocate_amou_2' });
            var filtersAmt = searchAmt.filters || [];
            
            filtersAmt.push(search.createFilter({ name: 'account', operator: search.Operator.IS, values: data.account }));
            filtersAmt.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: data.period }));
            searchAmt.filters = filtersAmt;

            var resultAmt = searchAmt.run().getRange({ start: 0, end: 1 });
            if (resultAmt && resultAmt.length > 0) {
                totalAmountToAllocate = parseFloat(resultAmt[0].getValue({ name: "amount", summary: "SUM" })) || 0;
            }
            
            jeRec.setValue({ fieldId: 'custbody_abj_amount_to_allocate', value: totalAmountToAllocate });
        }

        var totalDebitAmount = 0;
        var allSOF = [];
        for (var k = 0; k < data.lines.length; k++) {
            var sof = data.lines[k].awardList;
            if (sof && allSOF.indexOf(sof) === -1) {
                allSOF.push(sof);
            }
        }

        var deaBySof = {};
        if (allSOF.length > 0 && data.account) {
            var searchDea = search.load({ id: 'customsearch_mapping_dea_je_premise' });
            var filters = searchDea.filters || [];
            
            filters.push(search.createFilter({ name: 'custrecord_stc_sof_link', operator: search.Operator.ANYOF, values: allSOF }));
            filters.push(search.createFilter({ name: 'custrecord_stc_account_allocation', operator: search.Operator.IS, values: data.account }));
            searchDea.filters = filters;

            searchDea.run().each(function (res) {
                var sId = res.getValue({ name: 'custrecord_stc_sof_link' });
                deaBySof[sId] = {
                    dea: res.getValue({ name: 'custrecord_dea_allocation' }),
                    drc: res.getValue({ name: 'custrecord_stc_drc_from_dea' })
                };
                return true;
            });
        }

        for (var i = 0; i < data.lines.length; i++) {
            var lineItem = data.lines[i];
            
            var amountVal = parseFloat(lineItem.amount) || 0;
            var percentVal = parseFloat(lineItem.percent) || 0;

            if (amountVal === 0 && percentVal > 0) {
                amountVal = totalAmountToAllocate * (percentVal / 100);
            }

            if (amountVal === 0) continue; 

            jeRec.selectNewLine({ sublistId: 'line' });
            if (data.account) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: data.account });
            if (data.costCenter) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: data.costCenter }); 

            if (percentVal > 0) {
                var memoBaru = 'Allocation ' + percentVal + '%';
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoBaru });
            }

            if (lineItem.awardList) {
                jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: lineItem.awardList }); 
                 
                if (deaBySof[lineItem.awardList]) {
                    if (deaBySof[lineItem.awardList].dea) {
                        jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: deaBySof[lineItem.awardList].dea });
                    }
                    if (deaBySof[lineItem.awardList].drc) {
                        jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: deaBySof[lineItem.awardList].drc });
                    }
                }
            }

            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: amountVal });
            jeRec.commitLine({ sublistId: 'line' });

            totalDebitAmount += amountVal;
        }

        if (totalDebitAmount > 0) {
            jeRec.selectNewLine({ sublistId: 'line' });
            if (data.account) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: data.account });
            if (data.costCenter) jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: data.costCenter });
            
            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: totalDebitAmount });
            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 12 }); 
            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: 3763 }); 
            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: '58' }); 
            jeRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: 3 }); 

            jeRec.commitLine({ sublistId: 'line' });

            return jeRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true 
            });
        }
        
        throw new Error("Total Debit Amount is 0"); 
    }

    function createJEResources(data) {
        var period = data.period;
        var accountHeader = data.account;
        var costCenterHead = data.costCenter; 
        var amountHeader = data.amountHeader;

        if (!accountHeader || !period || Number(amountHeader) <= 0 || !costCenterHead) {
            throw new Error("Missing mandatory fields or zero amount");
        }

        var jeRec = record.create({
            type: record.Type.JOURNAL_ENTRY,
            isDynamic: true,
            defaultValues: { customform: '149' }
        });

        jeRec.setValue({ fieldId: 'postingperiod', value: period });
        jeRec.setValue({ fieldId: 'custbody_stc_source_account_allocation', value: accountHeader });
        jeRec.setValue({ fieldId: 'custbody_abj_amount_to_allocate', value: amountHeader });

        var periodFields = search.lookupFields({
            type: record.Type.ACCOUNTING_PERIOD,
            id: period,
            columns: ['periodname', 'startdate', 'enddate']
        });
        var periodText = periodFields.periodname;

        var accFields = search.lookupFields({
            type: record.Type.ACCOUNT,
            id: accountHeader,
            columns: ['name']
        });
        var accountHeaderText = accFields.name;

        var projectCodeValue = "";
        var searchProjectCode = search.load({ id: "customsearch_abj_premise_allocate_amou_2" });
        var fltrs = searchProjectCode.filters || [];
        fltrs.push(search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: accountHeader }));
        fltrs.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: period }));
        searchProjectCode.filters = fltrs;

        var searchResult = searchProjectCode.run().getRange({ start: 0, end: 1 });
        if (searchResult && searchResult.length > 0) {
            var allColumns = searchResult[0].columns;
            if (allColumns.length >= 5) { 
                projectCodeValue = searchResult[0].getValue(allColumns[4]);
            }
        }

        if (!projectCodeValue) {
            throw new Error("Project Code not found");
        }

        var allSofData = [];
        search.load({ id: 'customsearch_sof_resource_timesheet' }).run().each(function (res) {
            allSofData.push({
                id: res.getValue({ name: 'internalid' }),
                projectId: res.getValue({ name: 'custrecord_sof_project' })
            });
            return true;
        });

        if (allSofData.length === 0) {
            throw new Error("No SOF Master data found");
        }

        var allDataMaster = [];
        var search580 = search.load({ id: 'customsearch580' });
        var s580filters = search580.filters || [];
        s580filters.push(search.createFilter({ name: 'startdate', operator: search.Operator.ONORAFTER, values: [periodFields.startdate] }));
        s580filters.push(search.createFilter({ name: 'enddate', operator: search.Operator.ONORBEFORE, values: [periodFields.enddate] }));
        s580filters.push(search.createFilter({
            name: 'department',         
            join: 'employee',           
            operator: search.Operator.ANYOF,
            values: costCenterHead      
        }));
        search580.filters = s580filters;

        var s580cols = search580.columns;
        search580.run().each(function (res) {
            allDataMaster.push({
                numberHour: parseFloat(res.getValue(s580cols[0])) || 0,
                costCenter: res.getValue(s580cols[1]),
                projectCode: res.getValue(s580cols[2]),
                sof: res.getValue(s580cols[3])
            });
            return true;
        });

        var dataValid = [];
        for (var m = 0; m < allDataMaster.length; m++) {
            var row = allDataMaster[m];
            var match = false;
            for (var n = 0; n < allSofData.length; n++) {
                if (allSofData[n].id === row.sof) {
                    match = true;
                    break;
                }
            }
            if (match) dataValid.push(row);
        }

        var totalHourFiltered = 0;
        for(var x = 0; x < dataValid.length; x++) {
            totalHourFiltered += dataValid[x].numberHour;
        }

        if (totalHourFiltered <= 0) {
            throw new Error("Total hours for selected SOFs is zero");
        }

        var dataToProcess = [];
        var runningTotalPct = 0;
        var totalHeaderVal = Number(amountHeader);

        for (var y = 0; y < dataValid.length; y++) {
            var r = dataValid[y];
            var prosentHour = r.numberHour / totalHourFiltered;
            var roundedPct;

            if (y === dataValid.length - 1) {
                roundedPct = 100 - runningTotalPct;
            } else {
                roundedPct = Math.round(prosentHour * 100);
                runningTotalPct += roundedPct;
            }

            r.calculatedPct = roundedPct;
            r.amountDebit = prosentHour * totalHeaderVal;
            r.memo = "Allocation Premis " + accountHeaderText + " " + periodText + " - " + roundedPct + "%";
            
            for (var s = 0; s < allSofData.length; s++) {
                if (allSofData[s].id === r.sof) {
                    r.entityId = allSofData[s].projectId;
                    break;
                }
            }
            dataToProcess.push(r);
        }

        var runningTotalDebit = 0;
        for (var z = 0; z < dataToProcess.length; z++) {
            var d = dataToProcess[z];
            var amountToSet = 0;
            
            if (z === dataToProcess.length - 1) {
                amountToSet = Number((totalHeaderVal - runningTotalDebit).toFixed(2));
            } else {
                amountToSet = Number(Number(d.amountDebit).toFixed(2));
                runningTotalDebit += amountToSet;
            }

            jeRec.selectNewLine({ sublistId: "line" });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: accountHeader });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "debit", value: amountToSet });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: d.costCenter });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "cseg_stc_sof", value: d.sof });
            
            if (d.entityId) {
                jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "entity", value: d.entityId });
            }

            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: projectCodeValue });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "memo", value: d.memo });
            jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tar_percentage", value: d.calculatedPct });

            jeRec.commitLine({ sublistId: "line" });
        }

        jeRec.selectNewLine({ sublistId: "line" });
        jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: accountHeader });
        jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "credit", value: totalHeaderVal });
        jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: 17 });
        jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "cseg_stc_sof", value: 58 });
        jeRec.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: 12 });
        jeRec.commitLine({ sublistId: "line" });

        return jeRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true 
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});