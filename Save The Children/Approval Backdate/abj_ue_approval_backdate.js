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
        var delegation = rec.getValue('custentity_stc_subtitute_apprvl');
        var dateFrom = rec.getValue('custentity_stc_delgtion_date_from');
        var dateTo = rec.getValue('custentity_stc_delegation_date_to');
            if(delegation && dateFrom && dateTo){
                form.addButton({
                    id: 'custpage_set_delegate',
                    label: "Change Delegate",
                    functionName: "changeDelegate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_approval_backdate.js"
            }
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});