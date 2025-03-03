/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {

    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            var isCreate = context.type == context.UserEventType.CREATE
            var dataRec = context.newRecord;
            var sjpNumber = dataRec.getValue('id');
            var dateSjp = dataRec.getValue('trandate');
            log.debug('dataSJP', {sjpNumber : sjpNumber, dateSjp : dateSjp})
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
                    const valuesToUpdate = {};

                    if (isCreate) {
                        const cekNumber = search.lookupFields({
                            type: "invoice",
                            id: invId,
                            columns: ["custbody_rda_sjp_count"]
                        }).custbody_rda_sjp_count;

                        valuesToUpdate["custbody_rda_sjp_count"] = cekNumber ? Number(cekNumber) + 1 : 1;
                    }

                    if (reason) {
                        valuesToUpdate["custbody_rda_reason"] = reason;
                    }

                    valuesToUpdate["custbody_rda_action_plan"] = action || '';
                    valuesToUpdate["custbody_rda_sjp_number"] = sjpNumber || '';
                    valuesToUpdate["custbody_rda_sjp_date"] = dateSjp || '';

                    const saveRec = record.submitFields({
                        type: "invoice",
                        id: invId,
                        values: valuesToUpdate,
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });

                    log.debug('saveRec', saveRec);

                }
            }
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});