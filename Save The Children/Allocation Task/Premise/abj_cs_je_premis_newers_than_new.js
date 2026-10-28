/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], 
function (runtime, log, url, currentRecord, currency, record, search, message) {
    
    var records = currentRecord.get();
    var processMsg;

    function pageInit(context) {
        log.debug('init masuk');
    }

    function fieldChanged(context) {
        var rec = context.currentRecord;
        var amountAllocated = rec.getValue('custbody_abj_amount_to_allocate');
        var cForm = rec.getValue('customform');
        
        if (cForm == 140) {
            var fieldName = context.fieldId;
            var sublistFieldName = context.sublistId;

            if (fieldName == 'custbody_stc_source_account_allocation') {
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
                } else {
                    alert('Please Fill Account & Period');
                }
            }

            if (sublistFieldName == 'line' && fieldName == 'custcol_tar_percentage') {
                var percentage = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_tar_percentage' });
                if (percentage) {
                    var cekMemo = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'memo' });
                    var memoNew = cekMemo + ' ' + percentage + '%';
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoNew });
                    var newAmount = Number(amountAllocated) * (Number(percentage) / 100);
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: newAmount });
                }
            }
        }
    }

    function generate(context) {
        var rec = currentRecord.get();
        var sofIdHead = rec.getValue('cseg_stc_sof');
        var accountHeader = rec.getValue('custbody_stc_source_account_allocation');
        var accountHeaderText = rec.getText('custbody_stc_source_account_allocation');
        var periodId = rec.getValue('postingperiod');
        var periodText = rec.getText('postingperiod');

        if (!sofIdHead || !accountHeader || !periodId) {
            alert('Please select SOF, Account, and Period in Header');
            return false;
        }

        processMsg = message.create({
            title: "Processing",
            message: "Generating lines, please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        try {
            const periodFields = search.lookupFields({
                type: record.Type.ACCOUNTING_PERIOD,
                id: periodId,
                columns: ['startdate', 'enddate']
            });

            // 1. Ambil data baris SOF
            var searchSof = search.load({ id: 'customsearch_sof_premise' });
            var sofResult = [];
            searchSof.run().each(function (result) {
                sofResult.push({ sofId: result.getValue({ name: 'internalid' }) });
                return true;
            });

            // 2. Map DEA & DRC berdasarkan SOF Link
            var deaDrcMap = {};
            var deaSearch = search.create({
                type: "customrecord_stc_dea_allocation",
                filters: [
                    ["custrecord_stc_account_allocation", "anyof", accountHeader], 
                    "AND", 
                    ["custrecord_stc_allocation_type", "anyof", "1"]
                ],
                columns: [
                    search.createColumn({name: "custrecord_stc_sof_link", label: "SOF Link"}),
                    search.createColumn({name: "custrecord_stc_drc_from_dea", label: "DRC from DEA"}),
                    search.createColumn({name: "custrecord_dea_allocation", label: "DEA Allocation"})
                ]
            });
            deaSearch.run().each(function(res){
                var sLink = res.getValue({name: "custrecord_stc_sof_link"});
                if (sLink) {
                    deaDrcMap[sLink] = {
                        drc: res.getValue({name: "custrecord_stc_drc_from_dea"}),
                        dea: res.getValue({name: "custrecord_dea_allocation"})
                    };
                }
                return true;
            });

            // 3. Map Project Code (Class) dari Resource Allocation (Asumsi department 17 seperti di form ini)
            var projectCodeMap = {};
            var resAllocSearch = search.create({
                type: "resourceallocation",
                filters: [
                    ["internalid","noneof","@NONE@"], "AND", 
                    ["numberhours","greaterthan","0"], "AND", 
                    ["project","noneof","@NONE@"], "AND", 
                    ["job.cseg_stc_sof","noneof","@NONE@"], "AND", 
                    ["custevent_stc_rsc_cost_center","noneof","@NONE@"], "AND",
                    ["startdate", "onorafter", periodFields.startdate], "AND",
                    ["enddate", "onorbefore", periodFields.enddate], "AND",
                    ["employee.department", "anyof", "17"]
                ],
                columns: [
                    search.createColumn({name: "class", join: "employee", summary: "GROUP"}),
                    search.createColumn({name: "cseg_stc_sof", join: "job", summary: "GROUP"})
                ]
            });
            resAllocSearch.run().each(function (res) {
                var sLink = res.getValue({name: "cseg_stc_sof", join: "job", summary: "GROUP"});
                var pCode = res.getValue({name: "class", join: "employee", summary: "GROUP"});
                if (sLink && pCode) {
                    projectCodeMap[sLink] = pCode;
                }
                return true;
            });

            var lineCount = rec.getLineCount({ sublistId: 'line' });
            for (var i = lineCount - 1; i >= 0; i--) {
                rec.removeLine({ sublistId: 'line', line: i, ignoreRecalc: true });
            }

            prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, 0);
            
        } catch (e) {
            log.error('Generate Data Collection Error', e);
            if (processMsg) processMsg.hide();
            alert('Error generating data: ' + e.message);
        }
    }

    function prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, index) {
        var headerCurrency = rec.getValue('currency');
        var memoSet = 'Allocation Premise ' + accountHeaderText + ' ' + periodText;
        var costCenterIdDepartment = 17;
        
        if (index >= sofResult.length) {
            addFinalCreditLine(rec, accountHeader, memoSet, costCenterIdDepartment, deaDrcMap, sofIdHead);
            return;
        }

        var item = sofResult[index];
        var currentSof = item.sofId;
        
        var defaultProjectCode = 12; 
        var lineProj = projectCodeMap[currentSof] ? projectCodeMap[currentSof] : defaultProjectCode;
        var lineDrc = deaDrcMap[currentSof] ? deaDrcMap[currentSof].drc : '';
        var lineDea = deaDrcMap[currentSof] ? deaDrcMap[currentSof].dea : '';

        try {
            console.log("Processing Debit Line: SOF " + currentSof);
            rec.selectNewLine({ sublistId: 'line' });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHeader });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: 0 });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: costCenterIdDepartment, ignoreFieldChange: false });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: currentSof, ignoreFieldChange: false });
            setTimeout(function () {
                try {
                    var lineCur = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur' });
                    if (!lineCur && headerCurrency) {
                        rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur', value: headerCurrency });
                    }

                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: lineProj });
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoSet });
                    if (lineDrc) {
                        rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: lineDrc, ignoreFieldChange: false });
                    }

                    setTimeout(function() {
                        try {
                            if (lineDea) {
                                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: lineDea, ignoreFieldChange: false });
                            }
                            setTimeout(function() {
                                rec.commitLine({ sublistId: 'line' });
                                prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, index + 1);
                            }, 200);

                        } catch (errDea) {
                            log.error('Error setting DEA line ' + index, errDea);
                            prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, index + 1);
                        }
                    }, 400); 
                } catch (e) {
                    log.error('Error line ' + index, e);
                    prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, index + 1);
                }
            }, 300); 

        } catch (e) {
            log.error('Critical Error Line ' + index, e);
            prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, deaDrcMap, projectCodeMap, sofIdHead, index + 1);
        }
    }

    function addFinalCreditLine(rec, accountHeader, memoSet, dept, deaDrcMap, sofIdHead) {
        try {
            console.log("Processing Final Credit Line");
            
            // Ambil DEA dan DRC mapping berdasarkan SOF Header
            var headDrc = deaDrcMap[sofIdHead] ? deaDrcMap[sofIdHead].drc : 3; // Fallback 3 sesuai script asli
            var headDea = deaDrcMap[sofIdHead] ? deaDrcMap[sofIdHead].dea : '';
            var headProj = 12; // Tetap menggunakan 12 untuk line credit seperti script lama

            var headerCurrency = rec.getValue('currency');
            rec.selectNewLine({ sublistId: 'line' });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: accountHeader });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: 0 }); 
            
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: dept, ignoreFieldChange: false });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_sof', value: '58', ignoreFieldChange: false });

            // TIMEOUT 1: Credit Line
            setTimeout(function() {
                try {
                    var lineCur = rec.getCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur' });
                    if (!lineCur && headerCurrency) {
                        rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account_cur', value: headerCurrency });
                    }
                    
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: headProj });
                    rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoSet });
                    
                    // Set DRC
                    if(headDrc) {
                        rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_drc_segmen', value: headDrc, ignoreFieldChange: false });
                    }

                    // TIMEOUT 2: Credit line sourcing DRC -> DEA
                    setTimeout(function() {
                        if (headDea) {
                            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_stc_segmentdea', value: headDea, ignoreFieldChange: false });
                        }

                        // TIMEOUT 3: Credit Line commit
                        setTimeout(function() {
                            rec.commitLine({ sublistId: 'line' });
                            if (processMsg) processMsg.hide();
                            alert('Generate Completed');
                        }, 200);

                    }, 400);

                } catch(e) {
                    log.error('Error in Credit Line timeout', e);
                    if (processMsg) processMsg.hide();
                }
            }, 300);
        } catch (e) {
            log.error('Error Credit Line', e);
            if (processMsg) processMsg.hide();
        }
    }

    function calculate(context) {
        try {
            var rec = records;
            var lineCount = rec.getLineCount({ sublistId: 'line' });
            if (lineCount === 0) return;
            var totalDebit = 0;
            var creditLineIndex = -1;

            for (var i = 0; i < lineCount; i++) {
                var debit = parseFloat(rec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: i })) || 0;
                var credit = rec.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: i });
                if (credit && credit !== 0) creditLineIndex = i;
                if (i < lineCount - 1) totalDebit += debit;
            }

            if (creditLineIndex === -1) creditLineIndex = lineCount - 1;

            rec.selectLine({ sublistId: 'line', line: creditLineIndex });
            rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: totalDebit });
            rec.commitLine({ sublistId: 'line' });
        } catch (e) { console.log('Error calculate', e); }
    }

    function saveRecord(context) {
        var rec = context.currentRecord;
        if (rec.getValue('customform') == 140) {
            var lineCount = rec.getLineCount({ sublistId: 'line' });
            if (lineCount <= 0) return true;
            var totalDebit = 0;
            var creditLineIndex = null;

            for (var i = 0; i < lineCount; i++) {
                totalDebit += (parseFloat(rec.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: i })) || 0);
                var credit = rec.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: i });
                if (credit !== null && credit !== '') creditLineIndex = i;
            }

            if (creditLineIndex !== null) {
                rec.selectLine({ sublistId: 'line', line: creditLineIndex });
                rec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: totalDebit, ignoreFieldChange: true });
                rec.commitLine({ sublistId: 'line' });
            }
        }
        return true;
    }

    return {
        pageInit: pageInit,
        calculate: calculate,
        generate: generate,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});