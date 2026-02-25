/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], 
function (runtime, log, url, currentRecord, currency, record, search, message) {

    var processMsg;

    function pageInit(context) {
        log.debug('init masuk');
    }

    function fieldChanged(context) {
        var rec = context.currentRecord;
        var cForm = rec.getValue('customform');
        
        if (cForm == 149 && context.fieldId == 'custbody_stc_source_account_allocation') {
            var cekAccount = rec.getValue('custbody_stc_source_account_allocation');
            var periodId = rec.getValue('postingperiod');

            if (cekAccount && periodId) {
                var searchAmt = search.load({ id: 'customsearch_abj_premise_allocate_amou_2' });
                var filters = searchAmt.filters;
                filters.push(search.createFilter({ name: 'account', operator: search.Operator.IS, values: cekAccount }));
                filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: periodId }));
                searchAmt.filters = filters;

                var result = searchAmt.run().getRange({ start: 0, end: 1 });
                if (result && result.length > 0) {
                    var amount = result[0].getValue({ name: "amount", summary: "SUM" });
                    rec.setValue({ fieldId: 'custbody_abj_amount_to_allocate', value: amount || 0 });
                } else {
                    rec.setValue({ fieldId: 'custbody_abj_amount_to_allocate', value: 0 });
                }
            }
        }
    }

    function onClickGenerate() {
        var rec = currentRecord.get();
        var btn = document.getElementById('custpage_btn_generate_sof');

        if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.6";
        }

        processMsg = message.create({
            title: "Processing",
            message: "Generating Journal Lines... Please wait.",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            generate(rec, btn);
        }, 100);
    }

    async function generate(rec, btn) {
        try {
            var period = rec.getValue('postingperiod');
            var amountHeader = rec.getValue('custbody_abj_amount_to_allocate');
            var accountHeader = rec.getValue('custbody_stc_source_account_allocation');
            var periodText = rec.getText('postingperiod');
            var accountHeaderText = rec.getText('custbody_stc_source_account_allocation');

            if (accountHeader && period && (Number(amountHeader) > 0)) {
                const periodFields = search.lookupFields({
                    type: record.Type.ACCOUNTING_PERIOD,
                    id: period,
                    columns: ['startdate', 'enddate']
                });
                var searchProjectCode = search.load({
                    id: "customsearch_abj_premise_allocate_amou_2"
                });

                var fltrs = searchProjectCode.filters;
                fltrs.push(search.createFilter({ name: 'account', operator: search.Operator.ANYOF, values: accountHeader }));
                fltrs.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: period }));
                searchProjectCode.filters = fltrs;

                var searchResult = searchProjectCode.run().getRange({ start: 0, end: 1 });
                console.log('searchResult', searchResult)
                var projectCodeValue = "";
               if (searchResult && searchResult.length > 0) {
    var result = searchResult[0];
    var allColumns = result.columns;
    if (allColumns.length >= 5) { 
        var targetColumn = allColumns[4]; 
        projectCodeValue = result.getValue(targetColumn);
        
        console.log('Column Index 4 Name:', targetColumn.name);
        console.log('Value:', projectCodeValue);
    } else {
        console.log('Error: Kolom tidak cukup. Total: ' + allColumns.length);
    }
}           console.log('projectCodeValue', projectCodeValue)
                var allSofId = [];
                var searchSof = search.load({ id: 'customsearch_sof_resource_timesheet' });
                searchSof.run().each(function (result) {
                    allSofId.push(result.getValue({ name: 'internalid' }));
                    return true;
                });

                if (allSofId.length > 0) {
                    var allDataMaster = [];
                    var search580 = search.load({ id: 'customsearch580' });
                    var filters = search580.filters;
                    filters.push(search.createFilter({ name: 'startdate', operator: search.Operator.ONORAFTER, values: [periodFields.startdate] }));
                    filters.push(search.createFilter({ name: 'enddate', operator: search.Operator.ONORBEFORE, values: [periodFields.enddate] }));
                    search580.filters = filters;

                    var resultSet = search580.run();
                    var columns = search580.columns;

                    resultSet.each(function (res) {
                        allDataMaster.push({
                            numberHour: parseFloat(res.getValue(columns[0])) || 0,
                            costCenter: res.getValue(columns[1]),
                            projectCode: res.getValue(columns[2]),
                            sof: res.getValue(columns[3])
                        });
                        return true;
                    });

                    var dataValid = allDataMaster.filter(function(row) {
                        return allSofId.indexOf(row.sof) !== -1;
                    });

                    var totalHourFiltered = dataValid.reduce(function(sum, row) {
                        return sum + row.numberHour;
                    }, 0);
                    console.log('totalHourFiltered', totalHourFiltered)
                    console.log('dataValid', dataValid)
                    if (totalHourFiltered > 0) {
                        var dataToProcess = [];
                        var runningTotalPct = 0;

                        dataValid.forEach(function (row, index) {
                            var prosentHour = row.numberHour / totalHourFiltered;
                            var roundedPct;

                            if (index === dataValid.length - 1) {
                                roundedPct = 100 - runningTotalPct;
                            } else {
                                roundedPct = Math.round(prosentHour * 100);
                                runningTotalPct += roundedPct;
                            }

                            row.prosentHour = prosentHour;
                            row.calculatedPct = roundedPct;
                            row.amountDebit = prosentHour * Number(amountHeader);
                            var pct = roundedPct || Math.round(roundedPct * 100);
                            row.memo = "Allocation Premis " + accountHeaderText + " " + periodText + " - " + pct + "%";
                            dataToProcess.push(row);
                        });
                        if(projectCodeValue){
                            prosesJournalRecursive(rec, dataToProcess, accountHeader, btn, amountHeader, projectCodeValue);
                        }else{
                            finishProcess(btn, "Project Code Not Found");
                        }
                        
                    } else {
                        finishProcess(btn, "Total hours for selected SOFs is zero.");
                    }
                } else {
                    finishProcess(btn, "No SOF Master data found.");
                }
            } else {
                finishProcess(btn, "Missing Header Data.");
            }
        } catch (e) {
            finishProcess(btn, "Generate Error: " + e.message);
        }
    }

    function prosesJournalRecursive(rec, dataToProcess, accountHeader, btn, amountHeader, projectCodeValue) {
        console.log('dataToProcess', dataToProcess);
        
        var runningTotalDebit = 0;
        var totalHeader = Number(amountHeader);

        var lineCount = rec.getLineCount({ sublistId: "line" });
        for (var i = lineCount - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: "line", line: i, ignoreRecalc: true });
        }

        var headerCurrency = rec.getValue('currency');

        function doLine(index) {
            if (index >= dataToProcess.length) {
                addCreditLine();
                return;
            }

            var data = dataToProcess[index];
            try {
                console.log("--- Processing Debit Line Index: " + index + " ---");
                rec.selectNewLine({ sublistId: "line" });
                
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: accountHeader });

                var amountToSet = 0;
                if (index === dataToProcess.length - 1) {
                    amountToSet = Number((totalHeader - runningTotalDebit).toFixed(2));
                    console.log("Adjusting last debit line with amount: " + amountToSet);
                } else {
                    amountToSet = Number(Number(data.amountDebit).toFixed(2));
                    runningTotalDebit += amountToSet;
                }

                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "debit", value: amountToSet });
                
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: data.costCenter, ignoreFieldChange: false });
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "cseg_stc_sof", value: data.sof, ignoreFieldChange: false });

                setTimeout(function () {
                    try {
                        var lineCur = rec.getCurrentSublistValue({ sublistId: "line", fieldId: "account_cur" });
                        if (!lineCur && headerCurrency) {
                            rec.setCurrentSublistValue({ sublistId: "line", fieldId: "account_cur", value: headerCurrency });
                        }
                        
                        rec.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: projectCodeValue});
                        rec.setCurrentSublistValue({ sublistId: "line", fieldId: "memo", value: data.memo });
                        
                        var pct = data.calculatedPct || Math.round(data.prosentHour * 100);
                        rec.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tar_percentage", value: pct });

                        setTimeout(function() {
                            try {
                                rec.commitLine({ sublistId: "line" });
                                doLine(index + 1);
                            } catch (e) {
                                console.error("Commit error at index " + index, e.message);
                                doLine(index + 1);
                            }
                        }, 200); 
                    } catch (innerE) {
                        console.error("Error at line processing " + index, innerE.message);
                        doLine(index + 1);
                    }
                }, 200); 
            } catch (outerE) {
                console.error("Error selecting line " + index, outerE.message);
                finishProcess(btn, "Critical Error: " + outerE.message);
            }
        }

        function addCreditLine() {
            try {
                console.log("--- Processing Final Credit Line ---");
                rec.selectNewLine({ sublistId: "line" });
                
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "account", value: accountHeader });
                
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "credit", value: totalHeader });
                
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "department", value: 17, ignoreFieldChange: false });
                rec.setCurrentSublistValue({ sublistId: "line", fieldId: "cseg_stc_sof", value: 58, ignoreFieldChange: false });

                setTimeout(function() {
                    try {
                        var lineCur = rec.getCurrentSublistValue({ sublistId: "line", fieldId: "account_cur" });
                        if (!lineCur && headerCurrency) {
                            rec.setCurrentSublistValue({ sublistId: "line", fieldId: "account_cur", value: headerCurrency });
                        }

                        rec.setCurrentSublistValue({ sublistId: "line", fieldId: "class", value: 12 });
                        
                        var commitStatus = rec.commitLine({ sublistId: "line" });
                        console.log("Credit Line Commit: " + commitStatus);
                        
                        finishProcess(btn,);
                    } catch (e) {
                        console.error("Error committing credit line", e.message);
                        finishProcess(btn, "Completed with error on credit line.");
                    }
                }, 500);
            } catch (e) {
                console.error("Error creating credit line", e.message);
                finishProcess(btn, "Error on final credit line.");
            }
        }

        doLine(0);
    }
    function finishProcess(btn, msg) {
        if (processMsg) processMsg.hide();
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
        }
        if (msg) alert(msg);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onClickGenerate: onClickGenerate
    };
});