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
            var status = rec.getValue('custbody_abj_status_approval');
            log.debug('status', status)
            form.addButton({
                id: 'custpage_button_po',
                label: "Print Quotation",
                functionName: "printPDF()"
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_quot.js"
        
 
        }
}
return {
    beforeLoad: beforeLoad,
};
});