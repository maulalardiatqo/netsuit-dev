/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'], function(record, search){
    function afterSubmit(context){
        if(context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY){
            const rec = context.newRecord;
            var recInv = record.load({
                type : rec.type,
                id : rec.id
            });
            var tranId = recInv.getValue('tranid');
            if(tranId){
                recInv.setValue({
                    fieldId : 'custbody_sos_no_dok_pembeli',
                    value : tranId
                })
            }
            recInv.save();
        }
    }
    return{
        afterSubmit : afterSubmit
    } 
})