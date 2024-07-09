/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      var form = context.form;
      var rec = context.newRecord;
      form.addButton({
        id: "custpage_button_print_quote",
        label: "Print Quotation",
        functionName: "printPDF()",
      });
      var cekMail = rec.getValue('custbody_abj_email_recipients');
      log.debug('cekMail', cekMail);
      if(cekMail){
          form.addButton({
              id: 'custpage_button_print_so',
              label: "Send Email",
              functionName: "sendMail()"
          });
      }

      context.form.clientScriptModulePath = "SuiteScripts/quotation_rate_card_cs.js";
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});
