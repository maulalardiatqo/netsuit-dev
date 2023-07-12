/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/ui/dialog",
  "N/currentRecord",
], function(dialog, currentRecord) {
  var exports = {};

  function pageInit(context) {
    //
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    let total = rec.getValue('total');
    if (total != 0) {
      let failed_dialog = {
        title: 'Error',
        message: "Unable to submit manual submission on this page"
      };
      dialog.alert(failed_dialog);
      return false;
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});