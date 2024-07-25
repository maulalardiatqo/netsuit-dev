/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/currentRecord", "N/search", "N/url"], function (currentRecord, search, url) {
  var exports = {};
  var currentRecordObj = currentRecord.get();
  function pageInit(context) {}

  function fieldChanged(context) {
    var sublistFieldName = context.fieldId;
    var sublistName = context.sublistId;
    var totalLineDisc = 0;
    if (sublistName == "item") {
        if (sublistFieldName == "rate") {
            currentRecordObj.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_msa_ppn_include_update",
              value: true,
            })
        }
    }
  }



  exports.fieldChanged = fieldChanged;
  exports.pageInit = pageInit;
  return exports;
});
