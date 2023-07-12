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

  var currRecord = currentRecord.get();

  function pageInit(scriptContext) {
    //
  }

  function saveRecord(context) {
    var rec = context.currentRecord;
    var requestor = rec.getValue('custrecord_abj_rfq_requestor');

    var empRec = record.load({
      type: "employee",
      id: requestor,
      isDynamic: true,
    });
    var empDepartment = empRec.getValue("department");
    var empDepartmentText = empRec.getText("department");
    log.debug("empDepartment", empDepartment);

    if (empDepartment) {
      var lineTotal = rec.getLineCount({
        sublistId: "recmachcustrecord_abj_rfq_vdr_rfq",
      });
      log.debug("lineTotal", lineTotal);

      var vendorBlock = 0;
      var bodyAlert = "";
      for (var i = 0; i < lineTotal; i++) {
        var vendorSuggest = rec.getSublistValue({
          sublistId: "recmachcustrecord_abj_rfq_vdr_rfq",
          fieldId: "custrecord_abj_rfq_vdr",
          line: i,
        });

        var vendorSuggestText = rec.getSublistText({
          sublistId: "recmachcustrecord_abj_rfq_vdr_rfq",
          fieldId: "custrecord_abj_rfq_vdr",
          line: i,
        });

        var venRec = record.load({
          type: "vendor",
          id: vendorSuggest,
          isDynamic: true,
        });
        var deptBlocked = venRec.getValue("custentity_abj_dept_block");
        log.debug("deptBlocked", deptBlocked);
        if (deptBlocked.includes(empDepartment)) {
          vendorBlock++;
          bodyAlert += "Department : " + empDepartmentText + " cannot make purchase against vendor : " + vendorSuggestText + "\n";
        }
      }

      if (vendorBlock > 0) {
        // let failed_dialog = {
        //   title: 'Error',
        //   message: bodyAlert
        // };
        // dialog.alert(failed_dialog);
        alert(bodyAlert);
        return false;
      }
    }

    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});