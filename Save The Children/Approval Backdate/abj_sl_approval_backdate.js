/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/task', 'N/log', 'N/record'], function(task, log, record) {
    function onRequest(context) {
        if (context.request.method === 'POST') {
            const params = JSON.parse(context.request.body);
            log.debug('params', params)
            var idEmp = params.id
            var delegationApproval
            var delDateFrom
            var delDateTo
            if(idEmp){
                var recEmp = record.load({
                    type : 'employee',
                    id : idEmp
                });
                delegationApproval = recEmp.getValue('custentity_stc_subtitute_apprvl')
                delDateFrom = recEmp.getValue('custentity_stc_delgtion_date_from')
                delDateTo = recEmp.getValue('custentity_stc_delegation_date_to')
            }
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_approval_backdate', 
                params: {
                    custscript_data_id: params.id,
                    custscript_data_approval: delegationApproval,
                    custscript_dal_date_from : delDateFrom,
                    custscript_dal_date_to : delDateTo
                }
            });

            const taskId = mrTask.submit();
            context.response.write(JSON.stringify({ taskId: taskId }));

        } else {
            const taskId = context.request.parameters.taskId;
            const taskStatus = task.checkStatus({ taskId: taskId });
            context.response.write(JSON.stringify({ status: taskStatus.status }));
        }
    }
    return { onRequest: onRequest };
});