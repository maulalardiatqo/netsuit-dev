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
    var requestor = rec.getValue('custbody_abj_po_requestor');
    var vendor = rec.getValue('entity');
    var vendorText = rec.getText('entity');

    if (requestor) {
      var empRec = record.load({
        type: "employee",
        id: requestor,
        isDynamic: true,
      });
      var empDepartment = empRec.getValue("department");
      var empDepartmentText = empRec.getText("department");
      log.debug("empDepartment", empDepartment);

      if (empDepartment) {
        var venRec = record.load({
          type: "vendor",
          id: vendor,
          isDynamic: true,
        });
        var deptBlocked = venRec.getValue("custentity_abj_dept_block");
        log.debug("deptBlocked", deptBlocked);
        var bodyAlert = "";
        if (deptBlocked.includes(empDepartment)) {
          bodyAlert += "Department : " + empDepartmentText + " cannot make purchase against vendor : " + vendorText + "\n";
          alert(bodyAlert);
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