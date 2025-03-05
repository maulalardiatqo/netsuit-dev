/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log"], function (record, search, log) {
    function afterSubmit(context) {
        if(context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE){
            try {
                var rec = context.newRecord;
                var invId = rec.id
                var cekCreatedForm = rec.getValue('createdfrom')
                log.debug('createdFrom',  cekCreatedForm)
                if(cekCreatedForm){
                    var recSo = record.load({
                        type : record.Type.SALES_ORDER,
                        id : cekCreatedForm,
                        isDynamic : false
                    });
                    var kursinSo = recSo.getValue('custbody_abj_kurs_usd');
                    log.debug('kursinSo', kursinSo)
                    if(kursinSo){
                        record.submitFields({
                            type: 'invoice',
                            id: invId,
                            values: { custbody_abj_kurs_usd: kursinSo },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                }
            }catch(e){
                log.debug('error',e)
            }
        }
       
    }
    return{
        afterSubmit: afterSubmit
    }
});