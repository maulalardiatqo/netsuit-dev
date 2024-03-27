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
    function fieldChanged(context){
        var vrecord = context.currentRecord;
        if(context.fieldId == "custitem_iss_months"){
            var month = vrecord.getValue({
                fieldId : 'custitem_iss_months'
            });
            console.log('month',month);
            var montConvert = parseFloat(month) * 30
            console.log('montConvert', montConvert)
            vrecord.setValue({
                fieldId: 'leadtime',
                value: montConvert
            })
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged
    };
});