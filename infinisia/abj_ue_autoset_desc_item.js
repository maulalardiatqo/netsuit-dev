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
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                    log.debug('masuk')
                    var rec = context.newRecord;
                    var recNew = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    })
                    var countLine = recNew.getLineCount({
                        sublistId : 'item'
                    });
                    for(var i = 0; i < countLine; i++){
                        var itemText = recNew.getSublistText({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        });
                        log.debug('itemText', itemText);
                        var description = recNew.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'description',
                            line : i
                        });
                        log.debug('description', description);
                        if(description){
                            log.debug('deskription ada')
                        }else{
                            log.debug('description tidak ada');
                            recNew.setSublistValue({
                                sublistId:'item',
                                fieldId:'description',
                                line:i,
                                value:itemText
                            });
                            
                        }
                        
                    }
                    var saveRec = recNew.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRec', saveRec)
            }
        } catch (e) {
                log.debug('error', e)
            }
        }
        return {
            afterSubmit: afterSubmit,
        };
});