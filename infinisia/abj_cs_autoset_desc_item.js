/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    function sublistChanged(context) {
        var sublistId = context.sublistId;
        if (sublistId === 'item'){
            var currentRecordObj = context.currentRecord;
            var iteminCostom = currentRecordObj.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'item'
            });
            console.log('iteminCostom', iteminCostom)
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                value: iteminCostom,
            });
                
            
        }
    }
    return {
        pageInit: pageInit,
        sublistChanged : sublistChanged
    };
});