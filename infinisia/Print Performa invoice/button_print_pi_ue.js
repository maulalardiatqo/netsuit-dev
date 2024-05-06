/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      var rec = context.newRecord;
      var form = context.form;
      let piNumber = rec.getValue("custbodyiss_proforma_invoice_num");
      if (piNumber)
        form.addButton({
          id: "custpage_button_pdf_pi",
          label: "Print Proforma IN",
          functionName: "printPI",
        });
      context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_invoice.js";
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});
