/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/currentRecord",
  "N/ui/dialog",
  "N/runtime",
], function(currentRecord, dialog, runtime) {
  var exports = {};

  function pageInit(scriptContext) {
    //
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    // const executionContext = runtime.executionContext;
    // if (executionContext == "USERINTERFACE") {
    let payment = rec.getValue('payment');
    log.debug("payment", payment);
    if (payment != 0) {
      let failed_dialog = {
        title: 'Error',
        message: "Unable to submit manual submission on this page"
      };
      dialog.alert(failed_dialog);
      return false;
    }
    return true;
    //}
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});