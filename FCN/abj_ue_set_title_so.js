/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try{
                var currentRecord = context.newRecord;
                var internalId = currentRecord.id;
                log.debug('internalid', internalId);
                var typeRec = currentRecord.getValue('type');
                var recLoad = record.load({
                    type : 'salesorder',
                    id : internalId,
                    isDynamic: true,
                });
                var cFrom = recLoad.getValue('customform');
                log.debug('cFrom', cFrom)
                if(cFrom == "105" || cFrom =="151"){
                    var createdFrom = recLoad.getValue("createdfrom");
                    log.debug('createdFrom', createdFrom)
                    if(createdFrom && createdFrom != ""){
                        log.debug('masuk kondisi')
                        var createdFromRec = record.load({
                            type : "estimate",
                            id : createdFrom,
                            isDynamic : true,
                        });
                        var titleQuot = createdFromRec.getValue('title');
                        if(titleQuot){
                            recLoad.setValue({
                                fieldId: "custbody_abj_sales_order_title",
                                value: titleQuot,
                                ignoreFieldChange: true,
                            });
                            var savetrans = recLoad.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            });
                            log.debug("saveTrans", savetrans);
                        }
                    }
                }
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return{
        afterSubmit: afterSubmit
    }
});