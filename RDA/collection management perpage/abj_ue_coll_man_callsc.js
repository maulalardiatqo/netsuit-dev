/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format", "N/task"], function (record, search, serverWidget, runtime, currency, redirect, format, task) {

    function executeByUe(lineCount, newRecord, isCreate){
        var sjpNumber = newRecord.getValue('id');
        var dateSjp = newRecord.getValue('trandate');
        log.debug('executeByUe')
        if(lineCount > 0){
            for(var i = 0; i < lineCount; i++){
                var invId = newRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction',
                    fieldId : 'custrecord_invoice_number',
                    line : i
                })
                var reason = newRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction',
                    fieldId : 'custrecord_rda_reason',
                    line : i
                })
                var action = newRecord.getSublistValue({
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
    function executeBySC(isCreate, recordId){
        let params = {
            custscript_record_id: recordId,
            custscript_record_iscreate: isCreate
        };

        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_abj_sc_submit_inv_collman', 
            deploymentId: 'customdeploy_abj_sc_submit_inv_collman',
            params: params
        });

        let scriptTaskId = scriptTask.submit();
        log.debug("Scheduled Script Submitted", "Task ID: " + scriptTaskId);
    }
    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            try{
                var isCreate = false
                if(context.type == context.UserEventType.CREATE){
                    isCreate = true
                }
                let newRecord = context.newRecord;
                let recordId = newRecord.id;
                var lineCount = newRecord.getLineCount({
                    sublistId : 'recmachcustrecord_transaction'
                });
                if(lineCount < 20){
                    executeByUe(lineCount, newRecord, isCreate)
                }else{
                    executeBySC(isCreate, recordId)
                }
               
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});