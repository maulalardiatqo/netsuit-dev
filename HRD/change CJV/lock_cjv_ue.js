    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
    define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/message'], function(ui, record, error, message) {

        function beforeLoad(context) {
            var form = context.form;
            var currentRecord = context.newRecord;
            var processName = currentRecord.getValue('custbody_sol_etris_process_name');
            if (processName) {
                if (context.type === context.UserEventType.EDIT) {
                    context.form.addPageInitMessage({
                        type: message.Type.INFORMATION,
                        title: 'INFO',
                        message: 'You Cannot Edit, CJV Is Locked.',
                        duration: 5000
                    });
                    form.removeButton({
                        id: 'submitter'
                     });
                     form.removeButton({
                        id: 'submitnew'
                     });
                }
            }
            if(context.type === context.UserEventType.VIEW){
                try{
                    var form = context.form;
                    var currentRecord = context.newRecord;
                    var idRec = currentRecord.id;
                    log.debug('idRec', idRec);
                    var processName = currentRecord.getValue('custbody_sol_etris_process_name');
                    log.debug('processName', processName);
                    if(processName){
                        context.form.addPageInitMessage({
                            type: message.Type.INFORMATION,
                            title: 'INFO',
                            message: 'You Cannot Edit, CJV Is Locked.',
                            duration: 5000
                        });
                        form.removeButton({
                            id :'edit',
                        });
                        form.addButton({
                        id: 'custpage_change_print_title',
                        label: 'Change Print Title',
                        functionName: 'onButtonClick('+ idRec +')',
                        });
                        context.form.clientScriptModulePath = 'SuiteScripts/lock_cjv_cs.js';
                    }
                }catch (error) {
                    log.error({
                        title: 'custpage_change_print_title',
                        details: error.message
                    });
                }
            }
        } 
        return {
            beforeLoad: beforeLoad,
        }
        });
    