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
        var prid = rec.getValue('custrecord_sol_rfp_requisition');
        if (!prid) {
          const objForm = scriptContext.form;
          objForm.addButton({
            id: 'custpage_purchase_req_button_rfp',
            label: 'Create Purchase Requisition',
            functionName: "prPosting('rfp')"
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