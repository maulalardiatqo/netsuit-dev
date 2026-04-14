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
            var cekResignation = rec.getValue('custentity_resignation_employee');
            log.debug('cekResignation', cekResignation)
            if(cekResignation){
                form.addButton({
                id: 'custpage_button_resignation',
                label: "Resignation",
                functionName: `resignation('${cekResignation}')`
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_validate_employee_record.js"
            }
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});