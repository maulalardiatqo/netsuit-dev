/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/currentRecord",
  "N/record",
], function(currentRecord, record) {
  var exports = {};

  function pageInit(context) {
    var rec = context.currentRecord;
    var vendorID = rec.getValue('internalid');
    var vendorIDNumbering = rec.getValue('entityid');
    log.debug("vendorID", {
      vendorID: vendorID,
      vendorIDNumbering: vendorIDNumbering
    })
    if (vendorIDNumbering) {
      rec.setValue({
        fieldId: "custentity_abj_vdr_numbering",
        value: vendorIDNumbering,
      });
    }
  }

  exports.pageInit = pageInit;
  return exports;
});