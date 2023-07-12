/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
      //var cr = context.request;
      //var id = cr.parameters.id;
      if (context.type === context.UserEventType.VIEW) {
        var rec = context.newRecord;
        var form = context.form;
        var currentUserRole = runtime.getCurrentUser().role;
        if (!rec.getValue('custrecord_abj_rfq_tender_type')) {
          form.addButton({
            id: 'custpage_button_print_rfq',
            label: "New Print",
            functionName: "printPDF"
          });
          if (currentUserRole == 1015) {
            form.addButton({
              id: 'custpage_button_email_rfq',
              label: "Blast Email",
              functionName: "emailPDF"
            });
          }
        }
  
        // if (currentUserRole == 1015) {
        //   form.addButton({
        //     id: 'custpage_button_email_rejection',
        //     label: "Email Unawarded Vendor",
        //     functionName: "EmailUnAwardVendor"
        //   });
        //   /*form.addButton({
        //     id : 'custpage_button_email_awarded',
        //     label: "Email Awarded Vendor",
        //     functionName : "EmailAwardVendor"
        //   });*/
        // }
  
        //log.debug("id",id);
        context.form.clientScriptModulePath = "SuiteScripts/new_afc_rfq_print_cs.js"
      }
    }
    return {
      beforeLoad: beforeLoad,
    };
  });