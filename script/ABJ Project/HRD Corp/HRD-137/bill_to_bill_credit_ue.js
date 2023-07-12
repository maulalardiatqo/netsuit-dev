/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log'], (runtime, log) => {
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.VIEW) {
      try {
        var rec = scriptContext.newRecord;
        const objForm = scriptContext.form;
        objForm.addButton({
          id: 'custpage_bill_credit_button',
          label: 'Credit Note',
          functionName: "bcPosting()"
        });
        scriptContext.form.clientScriptModulePath = "SuiteScripts/bill_to_bc_cs.js";
      } catch (error) {
        log.error({
          title: 'beforeLoad',
          details: error.message
        });
      }
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});