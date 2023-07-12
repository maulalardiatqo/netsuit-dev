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
      form.addButton({
        id: 'custpage_button_interest_posting',
        label: "Interest Posting",
        functionName: "interestPosting"
      });
      context.form.clientScriptModulePath = "SuiteScripts/investment_interest_posting_cs.js";
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});