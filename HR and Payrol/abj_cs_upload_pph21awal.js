/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", 'N/ui/message'], function(
    runtime,
    log,
    url,
    currentRecord,
    currency,
    record,
    search,
    message
    ) {
        function pageInit(context) {
        }
        function upload(){
            var uploadExcel = url.resolveScript({
                scriptId: 'customscript_abj_sl_upload_pph21awal',
                deploymentId: 'customdeploy_abj_sl_upload_pph21awal',
                returnExternalUrl: false
            });

            console.log("urlpdf", uploadExcel);

            if (uploadExcel) {
                newWindow = window.open(uploadExcel);
            }
        }
        return{
            pageInit : pageInit,
            upload : upload
        }
        
});