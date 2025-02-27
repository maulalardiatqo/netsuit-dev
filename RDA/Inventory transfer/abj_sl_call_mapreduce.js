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
                var ifId = requestBody.ifId;
                log.debug('ifId', ifId)
    
                if (!ifId) {
                    throw new Error('Parameter "ifId" is required.');
                }
    
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_abj_mr_create_inv_transfer', 
                    deploymentId: 'customdeploy_abj_mr_create_inv_transfer', 
                    params: {
                        custscript_id_if: ifId
                    }
                });
    
                var taskId = mrTask.submit();
                log.debug('Map/Reduce Task Submitted', { taskId: taskId });
    
                context.response.write(JSON.stringify({ success: true, taskId: taskId }));
            } catch (e) {
                log.debug('Error in Suitelet', e.message);
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
