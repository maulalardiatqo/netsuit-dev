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
            var status = rec.getValue('shipstatus');
            log.debug('status', status)
            if(status == 'B' || status == 'C'){
                log.debug('status = aproved')
                form.addButton({
                    id: 'custpage_button_packing_slip',
                    label: "Print Packing Slip",
                    functionName: "printPDF()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_packing_slip_if.js"
            }
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});