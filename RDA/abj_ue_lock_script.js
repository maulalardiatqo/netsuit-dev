/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
  ) {
    function beforeLoad(context) {
        try {
             if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT) {
                log.debug('masuk')
             }
        }catch(e){
            log.debug('error', e)
        }
    }
     return{
        beforeLoad : beforeLoad
    };
});