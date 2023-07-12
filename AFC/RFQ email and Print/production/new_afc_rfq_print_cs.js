          /**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
 function(error,dialog,url,record,currentRecord,log) {
  var records = currentRecord.get();
     function pageInit(context) {
         console.log("test Masuk");
     }
      
	 function PDFURL()
	 {
		 return url.resolveScript({
         scriptId: 'customscript_new_rfq_print',
         deploymentId: 'customdeploy_new_rfq_print',
         returnExternalUrl: false
       });
	 }		 
	 
     function printPDF(context) {
       var id = records.id;
       var createPDFURL = PDFURL();
       createPDFURL += '&id=' +  id;
	   window.location.href = createPDFURL;
      } 
   
     function emailPDF(context) {
       var id = records.id;
       var createPDFURL = PDFURL();
       createPDFURL += '&id=' +  id+'&isemail=1';
	   window.location.href = createPDFURL;
      } 

     function EmailUnAwardVendor(context) {
       var id = records.id;
       var createPDFURL = PDFURL();
       createPDFURL += '&id=' +  id+'&isemailunawarded=1';
	   window.location.href = createPDFURL;
      } 

     function EmailAwardVendor(context) {
       var id = records.id;
       var createPDFURL = PDFURL();
       createPDFURL += '&id=' +  id+'&isemailawarded=1';
	   window.location.href = createPDFURL;
      } 

     return {
          pageInit: pageInit,
          printPDF : printPDF,
          emailPDF : emailPDF,
          EmailUnAwardVendor : EmailUnAwardVendor,
          EmailAwardVendor : EmailAwardVendor,
     };
 }); 

     