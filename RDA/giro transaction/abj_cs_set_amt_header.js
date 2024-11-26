/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();

    function pageInit(context) {
        log.debug('init masuk');
    }

    function validateLine(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;

            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) + Number(amtLine);
            log.debug('total after add line', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true; 
    }

    function validateDelete(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;

            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) - Number(amtLine);
            log.debug('total after delete', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true; // Mengizinkan penghapusan line
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
    };
});
