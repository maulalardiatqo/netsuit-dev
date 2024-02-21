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
     
     function printPDF() {
     console.log("test in function");
     var id = records.id;
     var createPDFURL = url.resolveScript({
         scriptId: 'customscript_abj_sl_print_bp',
         deploymentId: 'customdeployabj_sl_print_bp',
         returnExternalUrl: false
     })
     console.log("id",id);
     console.log("urlpdf", createPDFURL);
     createPDFURL += '&id=' +  id;
         if (createPDFURL) {
             newWindow = window.open(createPDFURL);
         }
     }
    function download(params){
        var allData = params;
        var downloadExcel = url.resolveScript({
            scriptId: 'customscript_abj_sl_download_vend_budget',
            deploymentId: 'customdeploy_abj_sl_download_vend_budget',
            returnExternalUrl: false
        });

        console.log("urlpdf", downloadExcel);

        if (downloadExcel) {
            newWindow = window.open(downloadExcel + '&allData=' + encodeURIComponent(JSON.stringify(allData)));
        }
    }
     return {
         pageInit: pageInit,
         printPDF : printPDF,
         download : download
     };
 }); 