/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {

    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            var isCreate = context.type == context.UserEventType.CREATE
            var dataRec = context.newRecord;
            var lineCount = dataRec.getLineCount({
                sublistId : 'recmachcustrecord_transaction'
            });
            log.debug('lineCount', lineCount)
            if(lineCount > 0){
                for(var i = 0; i < lineCount; i++){
                    var invId = dataRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction',
                        fieldId : 'custrecord_invoice_number',
                        line : i
                    })
                    var reason = dataRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction',
                        fieldId : 'custrecord_rda_reason',
                        line : i
                    })
                    var action = dataRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction',
                        fieldId : 'custrecord_rda_action',
                        line : i
                    });
                    log.debug('data', {invId : invId, reason : reason, action : action})
                    const recInv = record.load({
                        type: "invoice", 
                        id : invId, 
                        isDynamic: true 
                    });
                    if(isCreate){
                        const cekNumber = recInv.getValue("custbody_rda_sjp_count");
                        recInv.setValue({
                            fieldId: "custbody_rda_sjp_count",
                            value: cekNumber ? Number(cekNumber) + 1 : 1,
                            ignoreFieldChange: true
                        });
                    }
                    
                    if(reason){
                        recInv.setValue({
                            fieldId: "custbody_rda_reason",
                            value: reason,
                            ignoreFieldChange: true
                        });
                    }
                    recInv.setValue({
                        fieldId: "custbody_rda_action_plan",
                        value: action || '',
                        ignoreFieldChange: true
                    });
                    var saveRec = recInv.save();
                    log.debug('saveRec', saveRec)
                }
            }
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});