/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var customForm = recordLoad.getValue("customform");
                log.debug('customForm', customForm)
                if (customForm == 138) {
                    var countLine = recordLoad.getLineCount({
                        sublistId : "item"
                    });
                    log.debug('countLine', countLine)
                    if(countLine > 0){
                        for(var i = 0; i < countLine; i++){
                            recordLoad.selectLine({
                                sublistId : "item",
                                line : i
                            })
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'rate',
                                line : i,
                                value : 0
                            });
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'taxcode',
                                line : i,
                                value : 5
                            });
                            
                            recordLoad.commitLine("item")
                        }
                        var saveRec = recordLoad.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                        });
                        log.debug('saveRec', saveRec)
                    }
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        
    }
    return {
        afterSubmit: afterSubmit,
      };
    });
    