/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        let rec = context.newRecord;
        let currentEmployee = runtime.getCurrentUser();
        rec.setValue({
          fieldId: 'custbody_ov_transaction_created_by',
          value: currentEmployee.id,
          ignoreFieldChange: true
        });
        rec.save({
          enableSourcing: false,
          ignoreMandatoryFields: true
        });
      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }

  function beforeLoad(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        let rec = context.newRecord;
        let currentEmployee = runtime.getCurrentUser();
        rec.setValue({
          fieldId: 'custbody_ov_transaction_created_by',
          value: currentEmployee.id,
          ignoreFieldChange: true
        });
      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }
  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit
  };
});