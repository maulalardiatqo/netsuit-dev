/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect"], function(
  record,
  search,
  serverWidget,
  runtime, currency, redirect
) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var id = rec.id;
        var vendorBlocked = rec.getValue('custentity_abj_dept_block');
        var vdrBlocked = search.create({
          type: 'customrecord_abj_vdr_blockeddept',
          columns: ['internalid', 'custrecord_abj_bd_vendor', 'custrecord_abj_bd_blocked_dept'],
          filters: [{
            name: 'custrecord_abj_bd_vendor',
            operator: 'is',
            values: id
          }, ]
        }).run().getRange(0, 1);
        log.debug("vdrBlocked", vdrBlocked);

        function saveVendorBlocked(vendorData) {
          vendorData.setValue({
            fieldId: "custrecord_abj_bd_blocked_dept",
            value: vendorBlocked,
          });
          vendorData.setValue({
            fieldId: "custrecord_abj_bd_vendor",
            value: id,
          });
          return vendorData.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        }

        if (vdrBlocked.length > 0) {
          vdrBlocked.forEach(function(row) {
            let vdrDataId = row.getValue({
              name: 'internalid'
            });
            let vendorData = record.load({
              type: 'customrecord_abj_vdr_blockeddept',
              id: vdrDataId
            });
            let updateID = saveVendorBlocked(vendorData);
            log.debug('updateID', updateID);
          });
        } else {
          let vendorData = record.create({
            type: 'customrecord_abj_vdr_blockeddept',
          });
          let saveID = saveVendorBlocked(vendorData);
          log.debug('saveID', saveID);
        }
      }
    } catch (e) {
      err_messages = 'error in after submit ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});