/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function beforeSubmit(context) {
        try {
            log.debug('context.type', context.type)
            if (context.type == context.UserEventType.PAYBILLS) {
                var rec = context.newRecord;
                var recId = rec.id
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        beforeSubmit : beforeSubmit
    }
})