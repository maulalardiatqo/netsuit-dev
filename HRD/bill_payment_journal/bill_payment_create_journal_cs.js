/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */
 define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/search", "N/format"],
 function(error, dialog, url, record, currentRecord, search, format) {
    function pageInit(context) {
        //console.log("test in");
    }

    function createJournal(accountParams){

    }
    return {
        pageInit: pageInit,
        createJournal: createJournal
    };

});