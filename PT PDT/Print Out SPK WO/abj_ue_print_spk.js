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
            form.addButton({
                id: 'custpage_button_print_spk',
                label: "Print SPK",
                functionName: "printSPK()"
            });
            
            
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_spk.js"
            
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});