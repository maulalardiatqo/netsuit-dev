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
      var approval_status = rec.getText('custrecord_abj_rfq_status');


      if (approval_status != 'Cancelled' && approval_status != 'KIV') {

        if (!rec.getValue('custrecord_abj_rfq_tender_type')) {
          form.addButton({
            id: 'custpage_button_print_rfq',
            label: "Print",
            functionName: "printPDF"
          });


          if (approval_status != 'PO Created' && approval_status != 'Fully Approved' && approval_status != 'Pending Approval') {

            form.addButton({
              id: 'custpage_button_email_rfq',
              label: "Blast Email",
              functionName: "emailPDF"
            });

          }



        }
        if (approval_status == 'Fully Approved' || approval_status == 'PO Created') {
          form.addButton({
            id: 'custpage_button_email_rejection',
            label: "Email Unawarded Vendor",
            functionName: "EmailUnAwardVendor"
          });
          /*form.addButton({
            id : 'custpage_button_email_awarded',
            label: "Email Awarded Vendor",
            functionName : "EmailAwardVendor"
          });*/

        }
      }

      //log.debug("id",id);
      context.form.clientScriptModulePath = "SuiteScripts/afc_rfq_print_cs.js"
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});