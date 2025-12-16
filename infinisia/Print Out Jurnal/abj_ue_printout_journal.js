/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/search"], (runtime, log, search) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var currentUserRole = runtime.getCurrentUser().role;
            var idRec = rec.id
            var journalentrySearchObj = search.create({
                type: "journalentry",
                filters: [
                    ["type","anyof","Journal"],
                    "AND",
                    ["mainline","is","T"],
                    "AND",
                    ["internalid","anyof",idRec],
                    "AND",
                    ["taxline","is","F"],
                    "AND",
                    ["cogs","is","F"]
                ],
                columns: [
                    search.createColumn({ name: "customform", label: "Custom Form" })
                ]
            });
            var firstResult = journalentrySearchObj.run().getRange({ start: 0, end: 1 })[0];
            var customForm = ''
            if (firstResult) {
                customForm = firstResult.getValue("customform");
            } else {
                log.debug("Search Result", "No result found");
            }
            log.debug('customForm', customForm)
            var jenisTransaksi
            if(customForm == '158'){
                jenisTransaksi = rec.getValue('custbody_custom_transaksi_list_bank');
                if(jenisTransaksi == '1'){
                    jenisTransaksi = 'Bank In'
                }else{
                    jenisTransaksi = 'Bank Out'
                }
            }else if(customForm == '159'){
                jenisTransaksi = rec.getValue('custbody_custom_transksi_list_cash');
                        if(jenisTransaksi == '1'){
                            jenisTransaksi = 'Cash In'
                        }else{
                            jenisTransaksi = 'Cash Out'
                        }
            }
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