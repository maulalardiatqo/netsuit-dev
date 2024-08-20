/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
        var form = context.form;
        var rec = context.newRecord;
        var cForm = rec.getValue('customform');
        log.debug('cForm', cForm)
            if(cForm == 138){
                log.debug('masuk sini')
                form.addButton({
                    id: 'custpage_button_inv',
                    label: "Hitung total order",
                    functionName: "calculate()"
                });
                var subItem = form.getSublist({
                    id : 'item'
                });
                subItem.addButton({
                    id: 'custpage_button_inv',
                    label: "Hitung total order",
                    functionName: "calculate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_grouping_summary_pr.js"
            }
        }
}
return {
    beforeLoad: beforeLoad,
};
});