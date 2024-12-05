/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log"], function (record, search, log) {
    function beforeLoad(context){
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var status = rec.getValue('status');
            var isCancelled = rec.getValue('custbody_rda_do_cancelled');
            var cekNo = rec.getValue('custbody_rda_do_trf_to_gs');
            log.debug('cekNo', cekNo)
            log.debug('status', status);
            log.debug('isCancelled', isCancelled);
            if(status == 'Picked' && isCancelled == true && cekNo == ''){
                form.addButton({
                    id: 'custpage_button_recreate',
                    label: "Create Inventory Transfer",
                    functionName: "createInv()"
                });
            }
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_inv_trans_if.js"
        }
    }
    return {
        beforeLoad : beforeLoad
    }
});