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
        
       function printPDF(subsidiary) {
           var id = records.id;
           var createPDFURL
           var subsidiary = JSON.parse(subsidiary)
           console.log("subsidiary", subsidiary);
           console.log(typeof subsidiary);
           var subtrim = parseInt(subsidiary)
           console.log("subtrim", subtrim);
           console.log(typeof subtrim);
           if(subtrim == 46){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_alva',
                   deploymentId: 'customdeploy_abj_sl_inv_alva',
                   returnExternalUrl: false
               });
           }else if(subtrim == 47){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript1128',
                   deploymentId: 'customdeploy1',
                   returnExternalUrl: false
               });
           }else if(subtrim == 69){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_antikode',
                   deploymentId: 'customdeploy_abj_sl_inv_anti',
                   returnExternalUrl: false
               });
           }else if(subtrim == 68){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_orbeam',
                   deploymentId: 'customdeploy_abj_sl_inv_orbeam',
                   returnExternalUrl: false
               });
           }else if(subtrim == 67){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_orbeat',
                   deploymentId: 'customdeploy_abj_sl_inv_orbeat',
                   returnExternalUrl: false
               });
           }else if(subtrim == 66){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_orca',
                   deploymentId: 'customdeploy_abj_sl_inv_orca',
                   returnExternalUrl: false
               });
           }else if(subtrim == 48){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_jingga',
                   deploymentId: 'customdeploy_abj_sl_inv_jingga',
                   returnExternalUrl: false
               });
           }else if(subtrim == 49){
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_sl_inv_sisi',
                   deploymentId: 'customdeploy_abj_sl_inv_sisi',
                   returnExternalUrl: false
               });
           }else{
               createPDFURL = url.resolveScript({
                   scriptId: 'customscript_abj_invoice_print_sl',
                   deploymentId: 'customdeploy_abj_invoice_print_sl',
                   returnExternalUrl: false
               });
           }
           
           console.log("id",id);
           console.log("urlpdf", createPDFURL);
           createPDFURL += '&id=' +  id;
           if (createPDFURL) {
               newWindow = window.open(createPDFURL);
           }
       } 
   
       return {
           pageInit: pageInit,
           printPDF: printPDF
       };
   });
   