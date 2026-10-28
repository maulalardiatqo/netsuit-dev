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
            var cektype = rec.getValue('custbody_pdt_sales_type');
            log.debug('cektype', cektype)
            if(cektype && cektype == '1'){
                form.addButton({
                    id: 'custpage_button_print_inv_expert',
                    label: "Print Commercial Invoice",
                    functionName: "printPDFexp()"
                });
            }else{
                 form.addButton({
                    id: 'custpage_button_print_inv_local',
                    label: "Print Commercial Invoice",
                    functionName: "printPDFLocal()"
                });
            }
            
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_inv_print.js"
            
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});