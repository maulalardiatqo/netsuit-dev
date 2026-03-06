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
            var recLOad = record.load({
                type : 'purchaseorder',
                id : recId
            })
            log.debug('recId', recId)
            var customForm = recLOad.getValue('customform');
            log.debug('customForm', customForm)
            if(customForm == '104'){
                form.addButton({
                id: 'custpage_print_label',
                label: "Print Label",
                functionName: "printLabel()"
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_barcode_po.js"
        }
       
    }
}
return {
    beforeLoad: beforeLoad,
};
});