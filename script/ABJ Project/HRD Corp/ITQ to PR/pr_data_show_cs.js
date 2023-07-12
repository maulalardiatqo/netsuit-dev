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
    if (context.fieldId == "custbody_sol_itq_awardedvendor") {
      let awarde = vrecord.getValue("custbody_sol_itq_awardedvendor");
      console.log("awarde", awarde);
    }
    if (context.fieldId == "department") {
      let department = vrecord.getValue("department");
      console.log("department", department);
    }
  }

  exports.fieldChanged = fieldChanged;
  exports.pageInit = pageInit;

  return exports;
});