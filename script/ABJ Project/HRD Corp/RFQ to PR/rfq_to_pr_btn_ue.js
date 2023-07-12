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
        var prid = rec.getValue('custrecord_sol_rfq_requisition');
        if (!prid) {
          const objForm = scriptContext.form;
          objForm.addButton({
            id: 'custpage_purchase_req_button_rfq',
            label: 'Create Purchase Requisition',
            functionName: "prPosting('rfq')"
          });
          scriptContext.form.clientScriptModulePath = "SuiteScripts/pr_create_cs.js";
        }
      } catch (error) {
        log.error({
          title: 'beforeLoad_purchase_req_button',
          details: error.message
        });
      }
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});