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
            var cekInactive = rec.getValue('isinactive');
            log.debug('cekResignation', cekResignation)
            if(cekInactive){
                if(cekResignation){
                    form.addButton({
                    id: 'custpage_button_resignation',
                    label: "Approver Replacement Process",
                    functionName: `resignation('${cekResignation}')`
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_validate_employee_record.js"
                }
            }
            
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});