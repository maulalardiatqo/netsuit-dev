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
        var cekApproval = rec.getValue('approvalstatus')
        if(cekApproval == '2'){
            form.addButton({
                id: 'custpage_button_po',
                label: "Print Invoice",
                functionName: "printPDF()"
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_inv.js"
        }
       
        }
}
return {
    beforeLoad: beforeLoad,
};
});