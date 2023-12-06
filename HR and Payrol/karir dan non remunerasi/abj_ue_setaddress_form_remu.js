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
    
                var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var address = recordTRans.getValue("custrecord_abj_msa_alamat");
                log.debug('address', address);
                var idRec = recordTRans.getValue("custrecord3")
                var recEmp = record.load({
                    type : "employee",
                    id : idRec,
                })
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});