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
            if(cForm == 140){
                log.debug('masuk sini')
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                form.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                var subItem = form.getSublist({
                    id : 'line'
                });
                subItem.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                subItem.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });

                var sublistCustom = form.getSublist({
                    id : 'recmachcustrecord_stc_trx_id_allocation'
                })
                sublistCustom.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                sublistCustom.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_premis.js"
            }
            if(cForm == 141){
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_non_premis.js"
            }
        }
}
return {
    beforeLoad: beforeLoad,
};
});