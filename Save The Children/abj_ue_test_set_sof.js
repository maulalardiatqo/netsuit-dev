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
            if (context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                recordLoad.setValue({
                    fieldId : 'cseg_stc_sof',
                    value : 66
                })
                var saveRecord = recordLoad.save();
                log.debug('saveRecord', saveRecord)
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit
    }
});