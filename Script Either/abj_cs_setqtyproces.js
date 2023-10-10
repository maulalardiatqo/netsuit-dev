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
      console.log('in');
    }
    function sublistChanged(context) {
        var vrecord = context.currentRecord;
        if (context.sublistId == "custrecord216"){
            console.log('change')
        }
    }
    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        if (context.sublistId == "custrecord216"){
            console.log('change')
        }   
    }
    exports.sublistChanged = sublistChanged;
    exports.pageInit = pageInit;
    exports.fieldChanged = fieldChanged;
    return exports;
  });