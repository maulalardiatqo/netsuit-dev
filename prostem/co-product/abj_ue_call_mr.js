/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/log', 'N/task'], (log, task) => {

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.COPY && 
            context.type !== context.UserEventType.CREATE && 
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        const newRecord = context.newRecord;
        const recordId = newRecord.id;

        try {
            if (!recordId) {
                log.debug('Info', 'Record ID tidak ditemukan, proses dihentikan.');
                return;
            }
            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_create_wo',  
                params: {
                    'custscript_abj_woc_id': recordId         
                }
            });

            let mrTaskId = mrTask.submit();
            log.audit('Map/Reduce Triggered', `Berhasil memanggil MR script untuk WOC ID: ${recordId}. Task ID: ${mrTaskId}`);

        } catch (error) {
            log.error({
                title: 'Error in afterSubmit',
                details: `Message: ${error.message} | Stack: ${error.stack}`
            });
        }
    };

    return {
        afterSubmit: afterSubmit
    };
});