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
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    var rec = context.newRecord;
    
                    var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                    });
                    var countLine = recordTRans.getLineCount({ sublistId: 'item' });
                    if(countLine > 0){
                        for (var i = 0; i < countLine; i++) {
                            log.debug('i', i)
                            recordTRans.selectLine({
                                sublistId : "item",
                                line : i
                            })
                            var nilaiToSet = i + 1
                            recordTRans.setCurrentSublistValue({
                                sublistId : "item",
                                fieldId : "custcol_msa_sequence",
                                line : i,
                                value : nilaiToSet
                            })
                            recordTRans.commitLine("item")
                        }
                        var isSave = recordTRans.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                        });
                        log.debug('isSave', isSave)
                    }
                }
            }catch(e){
                log.debug('error', e)
            }
        }

    return {
        afterSubmit: afterSubmit,
    };
});