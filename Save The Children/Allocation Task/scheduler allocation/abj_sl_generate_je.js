/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task'], function(task) {
    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                var transId = context.request.parameters.recordId;
                var allocationType = context.request.parameters.allocateType;
                log.debug('data params', {transId: transId, allocationType : allocationType})
                var scrId
                var depId
                var idParams
                if(allocationType == 1){
                    scrId = 'customscript_abj_mr_generate_je_premis'
                    depId = 'customdeploy_abj_mr_generate_je_premis'
                    idParams = 'custscript_abj_trans_id'
                }else if(allocationType == 2){
                    scrId = 'customscript_abj_mr_generate_je'
                    depId = 'customdeploy_abj_mr_generate_je'
                    idParams = 'custscript_abj_source_trans_id'
                }
                log.debug('script and deployment id',{
                    scrId : scrId,
                    depId : depId,
                    idParams : idParams
                })
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: scrId, 
                    deploymentId: depId, 
                    params: {
                        [idParams]: transId
                    }
                });
                mrTask.submit();

                context.response.write('SUCCESS');

            } catch (e) {
                context.response.write(e.message);
            }
        }
    }
    return { onRequest: onRequest };
});