/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record"], (runtime, log, record) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var recId = rec.id;

            var currentUserRole = runtime.getCurrentUser().role;
            log.debug('currentUserRole', currentUserRole);

            var recordSO = record.load({
                type: record.Type.SALES_ORDER,
                id: recId
            });
            var cekStatus = recordSO.getValue('status');
            log.debug('cekStatus', cekStatus);

            if (cekStatus == 'Closed' && currentUserRole == 3) {
                form.addButton({
                    id: 'custpage_rda_button_reopen_so',
                    label: "Re-open",
                    functionName: "reopen('" + recId + "')"
                });
            }

            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_reopen_so.js";
        }
    }
    return {
        beforeLoad: beforeLoad,
    };
});
