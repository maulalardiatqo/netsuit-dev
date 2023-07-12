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
      form.addButton({
        id: "custpage_print_quotesumm",
        label: "Print Quotation Summary",
        functionName: "PrintQuoteSumm",
      });

      context.form.clientScriptModulePath =
        "SuiteScripts/afc_quote_summ_print_cs.js";
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});