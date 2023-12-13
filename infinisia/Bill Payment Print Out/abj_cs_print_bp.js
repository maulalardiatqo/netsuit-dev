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
     return {
         pageInit: pageInit,
         printPDF : printPDF,
     };
 }); 