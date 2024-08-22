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
    function saveRecord(context){
        var currentRecordObj = context.currentRecord;
        var cForm = currentRecordObj.getValue('customform');
        
        if(cForm == '138'){
            var cekSublistSummary = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_iss_pr_parent' });
            console.log('cekSublistSummary', cekSublistSummary)
            if(cekSublistSummary > 0){
                return true
            }else{
                alert('Please Fill The PR Summary By Customer Line with click "Hitung Total Order" Button');
                return false;
            }
        }
    }
    return {
        pageInit: pageInit,
        saveRecord : saveRecord
    };
});