/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function fieldChanged(context){
        if(context.fieldId == "lastpurchaseprice"){
            records.setValue({
                fieldId : 'upccode',
                value : 'test trigger last purchase',
                ignoreFieldChange: true
            })
        }
    }
    return {
        fieldChanged : fieldChanged
    };
});