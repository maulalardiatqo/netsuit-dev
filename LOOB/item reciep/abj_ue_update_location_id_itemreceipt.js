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
        var poRec = rec.getValue("custrecord_abj_ir_so");
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
        log.debug("FindLocation", FindLocation);
        if (FindLocation.length > 0) {
          location_internalid = FindLocation[0].getValue({
            name: 'internalid'
          });
        }
        log.debug('location_internalid', location_internalid);


        var findPOid = search.create({
          type: 'transaction',
          columns: ['internalid'],
          filters: [{
            name: 'tranid',
            operator: 'is',
            values: poRec
          }, ]
        }).run().getRange(0, 1);
        po_internal_id = 0
        log.debug('findPOid', findPOid);
        if(findPOid.length > 0){
          po_internal_id = findPOid[0].getValue({
            name: 'internalid'
          })
        }
        recItmFulfillment = record.load({
          type: 'customrecord_abj_ir_bulk',
          id: recid,
          isDynamic: true
        });
        let setLoc = recItmFulfillment.setValue({
          fieldId: 'custrecord_sol_rcpt_loc_list',
          value: location_internalid,
        });
        log.debug("setLoc", setLoc);
        let setPOid = recItmFulfillment.setValue({
          fieldId: 'custrecord_po_internal_id',
          value: po_internal_id
        })
        log.debug("setPOId", setPOid);
        let saveLoc = recItmFulfillment.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
        log.debug("saveLoc", saveLoc);
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