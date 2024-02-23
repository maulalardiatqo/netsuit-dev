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

        form.addButton({
            id: 'custpage_btn_print_vendor_credit',
            label: "Print Vendor Credit",
            functionName: "printPDF()"
        });
        context.form.clientScriptModulePath = "SuiteScripts/abj_vendor_credit_print_cs.js"
        }
}
return {
    beforeLoad: beforeLoad,
};
});