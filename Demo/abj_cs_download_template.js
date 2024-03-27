/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
 function(error,dialog,url,record,currentRecord,log) {
 var records = currentRecord.get();
     function pageInit(context) {
         console.log("test in");
     }
     
     function download(params){
        
        var allIdSlip = params;
        var downloadExcel = url.resolveScript({
            scriptId: 'customscript_abj_sl_download_temp_vend',
            deploymentId: 'customdeploy_abj_sl_download_temp_vend',
            returnExternalUrl: false
        });


        if (downloadExcel) {
            newWindow = window.open(downloadExcel);
        }
    }
    return {
            pageInit: pageInit,
            download : download,
    };
}); 
 