/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/email', 'N/record'], function(email, record) {
  
    function afterSubmit(context){
        try{
            if(context.type == context.UserEventType.EDIT){
                log.debug('masuk');
            }

        }catch(e){
            log.debug('error', e)
        }
    }
      
    return {
      afterSubmit: afterSubmit
    };
  });
  