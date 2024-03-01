/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
      try {
        var rec = scriptContext.newRecord;
        let employee = rec.getValue("custrecord_ep_emp");
        let photo = rec.getValue("custrecord_ep_photo");
        var dataEmp = record.load({
          type: "employee",
          id: employee,
          isDynamic: false,
        });
        dataEmp.setValue({
          fieldId: "image",
          value: photo,
          ignoreFieldChange: true,
        });
        dataEmp.save({
          enableSourcing: true,
          ignoreMandatoryFields: true,
        });
      } catch (error) {
        log.error({
          title: "error",
          details: error.message,
        });
      }
    }
  }
  return {
    afterSubmit: afterSubmit,
  };
});
