/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/error"], function(
    record,
    search,
    serverWidget,
    runtime,
    error
    ) {
  function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW || context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY){
            try {
                var rec = context.newRecord;
                var form = context.form;
                form.removeButton('delete');
                var approvalLevel = rec.getValue('custrecord_approval_level');
                var cekEmp = rec.getValue('custrecord_fund_employee');
                var currentUser = runtime.getCurrentUser();
                var userRole = currentUser.role;
                var userId = currentUser.id;
                log.debug('userRole', userRole)
                if (approvalLevel == 0) {
                    if (userRole == 3 && userId == cekEmp) {
                        form.addButton({
                            id: 'custpage_delete',
                            label: "Delete",
                            functionName: "deleteRecord()"
                        });

                        context.form.clientScriptModulePath = "SuiteScripts/abj_cs_validate_pengajuandana.js";
                    }
                }
                else {
                    if (userRole == 3) {
                        form.addButton({
                            id: 'custpage_delete',
                            label: "Delete",
                            functionName: "deleteRecord()"
                        });

                        context.form.clientScriptModulePath = "SuiteScripts/abj_cs_validate_pengajuandana.js";
                    }
                }
               
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return{
        beforeLoad : beforeLoad,
    }
});
