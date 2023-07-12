/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
  record,
  search,
) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        var rec = context.newRecord;
        var recid = rec.id;
        var locationid = rec.getValue("custrecord_abj_ir_location");
        log.debug("locationid", locationid);
        var FindLocation = search.create({
          type: 'location',
          columns: ['internalid'],
          filters: [{
            name: 'externalid',
            operator: 'is',
            values: locationid
          }, ]
        }).run().getRange(0, 1);
        var location_internalid = 0;
        if (FindLocation.length > 0) {
          location_internalid = FindLocation[0].getValue({
            name: 'internalid'
          });
        }
        log.debug('location_internalid', location_internalid);
        recItmFulfillment = record.load({
          type: 'customrecord_abj_ir_bulk',
          id: recid,
          isDynamic: true
        });
        recItmFulfillment.setValue({
          fieldId: 'custrecord_sol_rcpt_loc_list',
          value: location_internalid,
        });
        recItmFulfillment.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
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