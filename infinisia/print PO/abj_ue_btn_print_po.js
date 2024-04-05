/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
        var form = context.form;
        var rec = context.newRecord;
        var currentUserRole = runtime.getCurrentUser().role;
        var statusPo = rec.getValue('status');
        log.debug('statusPo', statusPo)
        if(statusPo == 'Pending Receipt'){
            form.addButton({
                id: 'custpage_button_po',
                label: "Print PO",
                functionName: "printPDF()"
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_po.js "
        }
        
    }
}
return {
    beforeLoad: beforeLoad,
};
});