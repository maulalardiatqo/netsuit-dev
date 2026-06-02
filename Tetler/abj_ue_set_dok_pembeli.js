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
            log.debug('context.type', context.type)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var idRec = rec.id;
                var recInv = record.load({
                    type : rec.type,
                    id : idRec,
                });
                var trandId = recInv.getValue('tranid')
                if(trandId){
                    recInv.setValue({
                        fieldId : 'custbody_sos_no_dok_pembeli',
                        value : trandId
                    })
                    recInv.save();
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});