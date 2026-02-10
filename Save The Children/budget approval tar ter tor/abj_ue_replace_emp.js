/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
  function afterSubmit(context) {
    try{
        if(context.type == context.UserEventType.EDIT){
            var rec = context.newRecord;
            var recId = rec.id
            log.debug('recId', recId)
            var recType = rec.type
            log.debug('recType', recType)
            if(recId == '31971'){
                var loadRec = record.load({
                    type : recType,
                    id : recId
                })
                loadRec.setValue({
                    fieldId : 'custbody_stc_approval_by',
                    value : ''
                })
                loadRec.setValue({
                    fieldId : 'custbody_stc_last_approve_at',
                    value : ''
                })
                
                var saveRec = loadRec.save()
                log.debug('saveRec', saveRec)
            }
        }
       

    }catch{

    }
  }
  return{
    afterSubmit
  }
})