/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/task', 'N/log'], (task, log) => {

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.CREATE || context.type !== context.UserEventType.EDIT) return;

        try {
            const newRecord = context.newRecord;
            const logId = newRecord.id;

            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_int_talenta', 
                // deploymentId: 'customdeploy_abj_process_payroll_mr',
                params: {
                    custscript_abj_log_id: logId 
                }
            });

            const taskId = mrTask.submit();
            log.audit('Map/Reduce Triggered', `Log ID: ${logId} | Task ID: ${taskId}`);

        } catch (e) {
            log.error('Failed to trigger Map/Reduce', e.message);
        }
    };

    return { afterSubmit };
});