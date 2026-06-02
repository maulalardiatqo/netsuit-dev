/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            const form = context.form;
            form.clientScriptModulePath = "SuiteScripts/abj_cs_budget_pashing.js";
            
            form.addButton({
                id: 'custpage_btn_export_excel',
                label: 'Generate Excel',
                functionName: 'onTriggerExport'
            });
        }
    };
    return { beforeLoad };
});