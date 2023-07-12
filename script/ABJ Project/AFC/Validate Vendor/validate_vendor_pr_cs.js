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
    var requestor = rec.getValue('entity');
    log.debug("saveRecord", true);
    // var empRec = record.load({
    //   type: "employee",
    //   id: requestor,
    //   isDynamic: true,
    // });
    log.debug("after load employee", true);
    var currentEmployee = runtime.getCurrentUser();
    log.debug("currentEmployeeDepartment", currentEmployee.department);
    var empDepartment = String(currentEmployee.department);
    // var empDepartmentText = empRec.getText("department");
    // log.debug("empDepartment", empDepartment);

    if (empDepartment && empDepartment > 0) {
      var lineTotal = rec.getLineCount({
        sublistId: "item",
      });
      log.debug("lineTotal", lineTotal);

      var vendorBlock = 0;
      var bodyAlert = "";
      for (var i = 0; i < lineTotal; i++) {
        var vendorSuggest = rec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_abj_vendorline",
          line: i,
        });
        log.debug("vendorSuggest", vendorSuggest);
        if (vendorSuggest) {
          var vendorSuggestText = rec.getSublistText({
            sublistId: "item",
            fieldId: "custcol_abj_vendorline",
            line: i,
          });

          var vdrBlocked = search.create({
            type: 'customrecord_abj_vdr_blockeddept',
            columns: ['internalid', 'custrecord_abj_bd_vendor', 'custrecord_abj_bd_blocked_dept'],
            filters: [{
              name: 'custrecord_abj_bd_vendor',
              operator: 'is',
              values: vendorSuggest
            }, ]
          }).run().getRange(0, 1);
          if (vdrBlocked.length > 0) {
            vdrBlocked.forEach(function(row) {
              var vdrDataId = row.getValue({
                name: 'internalid'
              });
              var venRec = record.load({
                type: 'customrecord_abj_vdr_blockeddept',
                id: vdrDataId
              });
              log.debug('vendorData', venRec);
              var deptBlocked = venRec.getValue("custrecord_abj_bd_blocked_dept");
              log.debug("deptBlocked", deptBlocked);
              if (deptBlocked.includes(empDepartment)) {
                vendorBlock++;
                bodyAlert += "This user department cannot make purchase against vendor : " + vendorSuggestText + "\n";
              }
            });
          }
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