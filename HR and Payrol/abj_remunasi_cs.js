/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
    "N/search",
    "N/currentRecord",
    "N/query",
    "N/record",
    "N/format",
    "N/ui/dialog",
    "N/runtime",
    "N/ui/message",
  ], function(search, currentRecord, query, record, format, dialog, runtime, message) {
    var exports = {};
  
    function pageInit(scriptContext) {
      //
    }

    function fieldChanged(context) {
        var vrecord = context.currentRecord;
    }
    exports.fieldChanged = fieldChanged;
    exports.pageInit = pageInit;

    return exports;
});