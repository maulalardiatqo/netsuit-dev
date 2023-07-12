/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log'], (runtime, log) => {
    function beforeLoad(scriptContext) {
      if (scriptContext.type === scriptContext.UserEventType.EDIT) {
        try {
          var rec = scriptContext.newRecord;
          const objForm = scriptContext.form;
          objForm.addButton({
            id: 'custpage_bill_tick_untick_button',
            label: 'Payment Hold',
            functionName: "bTickUntick()"
          });
          scriptContext.form.clientScriptModulePath = "SuiteScripts/bill_tick_untick_cs.js";
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