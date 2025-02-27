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
         scriptId: 'customscript_abj_sl_print_po',
         deploymentId: 'customdeploy_abj_sl_print_po',
         returnExternalUrl: false
     })
     console.log("id",id);
     console.log("urlpdf", createPDFURL);
     createPDFURL += '&id=' +  id;
         if (createPDFURL) {
             newWindow = window.open(createPDFURL);
         }
     } 
     function printPDFOc() {
        console.log("test in function");
        var id = records.id;
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_oc',
            deploymentId: 'customdeploy_abj_sl_print_oc',
            returnExternalUrl: false
        })
        console.log("id",id);
        console.log("urlpdf", createPDFURL);
        createPDFURL += '&id=' +  id;
            if (createPDFURL) {
                newWindow = window.open(createPDFURL);
            }
        } 
        function printPDFPR() {
            console.log("test in function");
            var id = records.id;
            var createPDFURL = url.resolveScript({
                scriptId: 'customscript_abj_sl_print_pr',
                deploymentId: 'customdeploy_abj_sl_print_pr',
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
         printPDFOc : printPDFOc,
         printPDFPR : printPDFPR
     };
 }); 
 