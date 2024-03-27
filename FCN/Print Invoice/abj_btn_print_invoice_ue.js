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
        var subsidiary = rec.getValue('subsidiary');
        log.debug('subsidiary', subsidiary)
        form.addButton({
            id: 'custpage_button_print_invoice',
            label: "Print Invoice",
            functionName: "printPDF('" + JSON.stringify(subsidiary) + "')"
        });
        context.form.clientScriptModulePath = "SuiteScripts/abj_invoice_print_cs.js"
        }
}
return {
    beforeLoad: beforeLoad,
};
});