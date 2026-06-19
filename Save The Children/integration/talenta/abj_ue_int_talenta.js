/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/task', 'N/log', 'N/record'], (task, log, record) => {

    const afterSubmit = (context) => {
        log.debug('context.type', context.type)
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            try {
                if(context.type == context.UserEventType.CREATE){
                    log.debug('triggered Create')
                    const newRecord = context.newRecord;
                    const logId = newRecord.id;
                    const typeRec = newRecord.type;
                    var recLoad = record.load({
                        type : typeRec,
                        id : logId
                    })
                    log.debug('logId', logId)
                    const source = recLoad.getValue('custbody_abj_source_name');
                    if(source){
                        log.debug('source ada', source)
                    }else{
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
                    }
                    
                }
                
                
                
                if(context.type == context.UserEventType.EDIT){
                    log.debug('triggered Edit')
                    const newRecord = context.newRecord;
                    const logId = newRecord.id;
                    const typeRec = newRecord.type;
                    var recLoad = record.load({
                        type : typeRec,
                        id : logId
                    })
                    const source = recLoad.getValue('custbody_abj_source_name');
                    log.debug('source', source)
                    if(source == 'Talenta'){
                        log.debug('logId', logId)
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
                    }
                }
            } catch (e) {
                log.error('Failed to trigger Map/Reduce', e.message);
            }
        }
       
    };

    return { afterSubmit };
});