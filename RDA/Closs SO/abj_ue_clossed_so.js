/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        const form = context.form;
        const record = context.newRecord;

        if (context.type === context.UserEventType.VIEW) {
            const userRole = runtime.getCurrentUser().role;
            const status = record.getValue({ fieldId: 'status' });
            var idRec = record.id
            log.debug('Status & Role', `Status: ${status}, Role: ${userRole}`);

            if (status === 'Pending Approval' && userRole === 3) {
                form.addButton({
                    id: 'custpage_rda_button_clossed_so',
                    label: "Close SO",
                    functionName: "clossedSO("+idRec+")"
                });

                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_clossed_so.js";
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
    };
});
