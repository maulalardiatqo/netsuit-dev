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
        function download(allData, totalan, nameAct){
            if(allData){
                var downloadExcel = url.resolveScript({
                    scriptId: 'customscript_abj_sl_download_report_ca',
                    deploymentId: 'customdeploy_abj_sl_download_report_ca',
                    returnExternalUrl: false
                });
    
                console.log("urlpdf", downloadExcel);
    
                if (downloadExcel) {
                    newWindow = window.open(downloadExcel + '&allData=' + encodeURIComponent(allData));
                }
            }
        }
       
return{
    pageInit : pageInit,
    download : download
}

});