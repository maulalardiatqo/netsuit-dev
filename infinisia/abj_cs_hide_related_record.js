/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    console.log('tes')
    var relatedRecordsTab = document.getElementById("relrecordslnk");
    console.log('relatedRecordsTab', relatedRecordsTab)
    if(relatedRecordsTab){
        relatedRecordsTab.style.display = "none";
    }
    var relatedRecordsPan = document.getElementById("relrecords_pane");
    console.log('relatedRecordsPan', relatedRecordsPan)
    if(relatedRecordsPan){
        relatedRecordsPan.style.display = "none";
    }
    function pageInit(context) {
        console.log('pageInit')
        
    }

    return {
        pageInit: pageInit
    };
});