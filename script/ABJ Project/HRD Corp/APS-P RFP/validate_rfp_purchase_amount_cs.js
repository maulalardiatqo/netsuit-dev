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
    let type = rec.type;
    if (type.includes("rfp")) {
      let statusTender = rec.getValue('custrecord_sol_rfp_opn_cld');
      if (statusTender == 1) {
        let tenderPurchaseAmt = rec.getValue('custrecord_sol_rfp_purchase_amount');
        let preDoc_1 = rec.getValue('custrecord_sol_rfp_pre_dc1');
        let preDoc_2 = rec.getValue('custrecord_sol_rfp_pre_dc2');
        if (!tenderPurchaseAmt) {
          alert("TENDER PURCHASE AMOUNT is required");
          return false;
        }
        if (!preDoc_1) {
          alert("PREVIEW ATTACHMENT is required");
          return false;
        }
        if (!preDoc_2) {
          alert("PREVIEW ATTACHMENT 2 is required");
          return false;
        }
      }
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});