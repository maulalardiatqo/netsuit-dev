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
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var idTer = rec.id
                var noTar = rec.getValue('custrecord_ter_tar_no');
                if(noTar){
                    var recTar = record.load({
                        type : 'customrecord_tar',
                        id : noTar
                    });
                    recTar.setValue({
                        fieldId : 'custrecord_tar_link_ter',
                        value : idTer
                    })
                    var saveTar = recTar.save();
                    log.debug('saveTar', saveTar)
                }

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit
    }
});