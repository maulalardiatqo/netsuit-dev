/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/log', 'N/task'], function (log, task) {
    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                var requestBody = JSON.parse(context.request.body);
                var soId = requestBody.soId;
                log.debug('soId', soId)
    
                if (!soId) {
                    throw new Error('Parameter "ifId" is required.');
                }
    
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_abj_mr_create_inv_trans_so', 
                    deploymentId: 'customdeploy_abj_mr_create_inv_trans_so', 
                    params: {
                        custscript_id_so: soId
                    }
                });
    
                var taskId = mrTask.submit();
                log.audit('Map/Reduce Task Submitted', { taskId: taskId });
    
                context.response.write(JSON.stringify({ success: true, taskId: taskId }));
            } catch (e) {
                log.error('Error in Suitelet', e.message);
                context.response.write(JSON.stringify({ success: false, message: e.message }));
            }
        } else {
            context.response.write(JSON.stringify({ success: false, message: 'Invalid request method.' }));
        }
    }
    

    return {
        onRequest: onRequest
    };
});
