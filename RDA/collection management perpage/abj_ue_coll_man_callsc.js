/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format", "N/task"], function (record, search, serverWidget, runtime, currency, redirect, format, task) {

    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            try{
                var isCreate = false
                if(context.type == context.UserEventType.CREATE){
                    isCreate = true
                }
                let newRecord = context.newRecord;
                let recordId = newRecord.id;
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
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});