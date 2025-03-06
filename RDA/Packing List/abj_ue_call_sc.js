/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format", "N/task"], function (record, search, serverWidget, runtime, currency, redirect, format, task) {

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.DELETE) {
            try{
                var dataRec = context.oldRecord;
                var dataRecID = context.oldRecord.id;
                var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
                let params = {
                    custscript_id_item_fulfill: dataRecID,
                    custscript_even_trigger: "delete",
                    custscript_all_id_fulfill : allIdFul
                };
    
                let scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_abj_sc_delete_packing_list', 
                    deploymentId: 'customdeploy_abj_sc_delete_packing_list2',
                    params: params
                });
    
                let scriptTaskId = scriptTask.submit();
                log.debug("Scheduled Script Submitted", "Task ID: " + scriptTaskId);
            }catch(e){
                log.debug('error', e)
            }
           
        }
    }
    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            try{
                var dataRec = context.newRecord;
                var dataRecID = context.newRecord.id;
                let params = {
                    custscript_id_item_fulfill: dataRecID,
                    custscript_even_trigger: "create",
                    custscript_all_id_fulfill : ""
                };

                let scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_abj_sc_delete_packing_list', 
                    deploymentId: 'customdeploy_abj_sc_delete_packing_list',
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
        beforeSubmit: beforeSubmit,
        afterSubmit : afterSubmit
    };
});