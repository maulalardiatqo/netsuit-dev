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
        function pageInit(context) {}

        function download(transferBankFieldId){
           
            var downloadExcel = url.resolveScript({
                scriptId: 'customscript_abj_sl_downloadrekapexcel',
                deploymentId: 'customdeploy_abj_sl_downloadrekapexcel',
                returnExternalUrl: false
            });

            console.log("urlpdf", downloadExcel);

            if (downloadExcel) {
                newWindow = window.open(downloadExcel);
            }
        }
return{
    pageInit : pageInit,
    download : download
}

});