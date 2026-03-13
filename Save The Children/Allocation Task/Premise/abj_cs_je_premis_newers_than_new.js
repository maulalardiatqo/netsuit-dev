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
        var periodText = rec.getText('postingperiod');

        if (!sofIdHead || !accountHeader) {
            alert('Please select SOF and Account in Header');
            return false;
        }

        processMsg = message.create({
            title: "Processing",
            message: "Generating lines, please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        var searchSof = search.load({ id: 'customsearch_sof_premise' });
        var sofResult = [];
        searchSof.run().each(function (result) {
            sofResult.push({
                sofId: result.getValue({ name: 'internalid' }),
                projectId: result.getValue({ name: 'custrecord_sof_project' })
            });
            return true;
        });

        var idDea = '';
        var deaSearch = search.load({ id: 'customsearch_mapping_dea_je_premise' });
        var dFilters = deaSearch.filters;
        dFilters.push(search.createFilter({ name: 'custrecord_stc_account_allocation', operator: search.Operator.IS, values: accountHeader }));
        dFilters.push(search.createFilter({ name: 'custrecord_stc_account_allocation', operator: search.Operator.IS, values: sofIdHead }));
        deaSearch.filters = dFilters;
        var dResult = deaSearch.run().getRange({ start: 0, end: 1 });
        if (dResult.length > 0) {
            idDea = dResult[0].getValue({ name: "custrecord_dea_allocation" });
        }

        var lineCount = rec.getLineCount({ sublistId: 'line' });
        for (var i = lineCount - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: 'line', line: i, ignoreRecalc: true });
        }

        prosesRecursive(rec, sofResult, accountHeader, accountHeaderText, periodText, idDea, 0);
    }

    function prosesRecursive(rec, lines, accountHeader, accountHeaderText, periodText, idDea, index) {
        const sublistId = 'line';
        if (index >= lines.length) {
            addFinalCreditLine(rec, accountHeader, accountHeaderText, periodText, idDea);
            return;
        }

        const lineData = lines[index];
        const headerCurrency = rec.getValue('currency');
        const memoSet = 'Allocation Premise ' + accountHeaderText + ' ' + periodText;

        try {
            rec.selectNewLine({ sublistId: sublistId });

            safeSet(rec, sublistId, 'account', accountHeader, false);
            safeSet(rec, sublistId, 'debit', 0);
            safeSet(rec, sublistId, 'department', 17, false);

            if (lineData.projectId) {
                safeSet(rec, sublistId, 'entity', lineData.projectId, false);
            }

            setTimeout(function() {
                try {
                    safeSet(rec, sublistId, 'cseg_stc_sof', lineData.sofId, false);
                    
                    safeSet(rec, sublistId, 'class', 12);
                    safeSet(rec, sublistId, 'memo', memoSet);
                    
                    if (idDea) {
                        safeSet(rec, sublistId, 'cseg_stc_segmentdea', idDea);
                    }

                    var lineCur = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'account_cur' });
                    if (!lineCur && headerCurrency) {
                        safeSet(rec, sublistId, 'account_cur', headerCurrency);
                    }

                    rec.commitLine({ sublistId: sublistId });
                    
                    setTimeout(function() {
                        prosesRecursive(rec, lines, accountHeader, accountHeaderText, periodText, idDea, index + 1);
                    }, 100);

                } catch (e) {
                    log.error('Error in Timeout line ' + index, e);
                    prosesRecursive(rec, lines, accountHeader, accountHeaderText, periodText, idDea, index + 1);
                }
            }, 200);

        } catch (err) {
            log.error('Error processing line ' + index, err);
            prosesRecursive(rec, lines, accountHeader, accountHeaderText, periodText, idDea, index + 1);
        }
    }

    function addFinalCreditLine(rec, accountHeader, accountHeaderText, periodText, idDea) {
        try {
            const sublistId = 'line';
            const headerCurrency = rec.getValue('currency');
            const memoSet = 'Allocation Premise ' + accountHeaderText + ' ' + periodText;

            rec.selectNewLine({ sublistId: sublistId });
            safeSet(rec, sublistId, 'account', accountHeader, false);
            safeSet(rec, sublistId, 'credit', 0);
            safeSet(rec, sublistId, 'department', 17, false);
            safeSet(rec, sublistId, 'entity', 3763, false)
            setTimeout(function() {
                safeSet(rec, sublistId, 'cseg_stc_sof', '58', false);
                safeSet(rec, sublistId, 'class', 12);
                safeSet(rec, sublistId, 'memo', memoSet);
                safeSet(rec, sublistId, 'cseg_stc_drc_segmen', 3);

                if (idDea) {
                    safeSet(rec, sublistId, 'cseg_stc_segmentdea', idDea);
                }

                if (headerCurrency) {
                    safeSet(rec, sublistId, 'account_cur', headerCurrency);
                }

                rec.commitLine({ sublistId: sublistId });
                if (processMsg) processMsg.hide();
                alert('Generate Completed');
            }, 300);
        } catch (e) {
            log.error('Error Credit Line', e);
        }
    }

    function safeSet(rec, sublist, fieldId, value, ignoreChange = true) {
        if (value !== null && value !== undefined && value !== '') {
            rec.setCurrentSublistValue({
                sublistId: sublist,
                fieldId: fieldId,
                value: value,
                ignoreFieldChange: ignoreChange,
                forceSyncSourcing: true
            });
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
        } catch (e) { log.error('Error calculate', e); }
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