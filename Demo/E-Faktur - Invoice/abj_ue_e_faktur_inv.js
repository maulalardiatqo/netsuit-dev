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
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                var rec = context.newRecord;
  
                var invRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var fakturPajakNo = invRec.getValue('custbody_abj_fp_no');
                var idInv = rec.id;
                log.debug('fakturPajakNo', fakturPajakNo);
                if (fakturPajakNo) {
                    var loadFakturPajak = record.load({
                        type: "customrecord_abj_no_fp",
                        id: fakturPajakNo,
                        isDynamic: true,
                    });
                    loadFakturPajak.setValue({
                        fieldId : "custrecord_abj_doc_number_fp",
                        value : idInv
                    });
                    loadFakturPajak.setValue({
                        fieldId : "custrecord_abj_status",
                        value : "1"
                    });
                    var saveFaktur = loadFakturPajak.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveFaktur', saveFaktur);
                }
            }
           
        } catch(e) {
            log.debug('error', e);
        }
    }

    return {
        afterSubmit: afterSubmit,
    };
});
