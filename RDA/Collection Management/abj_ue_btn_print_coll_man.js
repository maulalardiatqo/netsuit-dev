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
            id: 'custpage_button_po',
            label: "Print Collection Management",
            functionName: "printPDF()"
        });
        context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_coll_man.js"
        }
}
return {
    beforeLoad: beforeLoad,
};
});