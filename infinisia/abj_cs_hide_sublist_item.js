/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    console.log('records', records)
    function pageInit(context) {
        log.debug('init masuk')
    }
    function fieldChanged(context){
        var vrecord = context.currentRecord;
        
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged
    };
});