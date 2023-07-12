/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/currentRecord",
  "N/ui/dialog",
], function(currentRecord, dialog) {
  var exports = {};

  function pageInit(scriptContext) {
    //
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    let expiryDate = rec.getValue('custbody_sol_exp_date');
    let todayDate = new Date();
    log.debug("expiryDate", expiryDate);
    log.debug("todayDate", todayDate);
    if (expiryDate && todayDate > expiryDate) {
      let justify = rec.getValue('custbody_sol_pr_receiveby_justify');
      if (!justify) {
        alert("EX-POST FACTO EVENT JUSTIFICATION is required");
        return false;
      }
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});