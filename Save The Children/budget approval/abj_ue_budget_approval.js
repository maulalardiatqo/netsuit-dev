/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
    function beforeLoad(context){
        try{
            const currentUser = runtime.getCurrentUser();
            const employeeId = currentUser.id;       // Internal ID employee
            const employeeName = currentUser.name;   // Nama user

            log.debug('Employee Info', {
                id: employeeId,
                name: employeeName
            });
            var cekLineItem 
            const form = context.form;
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_button.js';
        }catch(e){
            log.debug('error', e);
            
        }
    }
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.EDIT) {
                log.debug('masuk eksekusi')
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit,
        beforeLoad : beforeLoad
    }
});