/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/task"], function(
    record,
    search,
    task,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
    
                var scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                });

                scriptTask.scriptId = 'customscript_abj_ss_setgaji';

                scriptTask.deploymentId = 'customdeploy_abj_ss_setgaji';
                log.debug('recId', rec.id);
                scriptTask.params = {
                    'custscript_id_remunerasi': rec.id,
                };
                log.debug('scriptTask.params', scriptTask.params);
                var scriptTaskId = scriptTask.submit();
                log.debug('Script Task Submitted', 'Task Id: ' + scriptTaskId);
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
 });