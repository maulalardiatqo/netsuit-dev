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
        var currentUserRole = runtime.getCurrentUser().role;
        var jenisTransaksi = rec.getText('custbody_custom_jenis_transaksi');
        log.debug('jenisTransaksi', jenisTransaksi);
            if(jenisTransaksi){
                form.addButton({
                    id: 'custpage_button_inv',
                    label: "Print " + jenisTransaksi,
                    functionName: "printPDF()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_printout_journal.js"
            }
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});