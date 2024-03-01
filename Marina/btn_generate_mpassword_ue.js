/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.VIEW) {
      try {
        var rec = scriptContext.newRecord;
        var currentUser = runtime.getCurrentUser();
        var userRoles = currentUser.role;
        if (userRoles == 3) {
          const objForm = scriptContext.form;
          objForm.addButton({
            id: "custpage_generate_mobile_password_btn",
            label: "Generate Access Code Mobile",
            functionName: "generatePassword()",
          });
          scriptContext.form.clientScriptModulePath = "SuiteScripts/generate_mobile_password_cs.js";
        }
      } catch (error) {
        log.error({
          title: "error",
          details: error.message,
        });
      }
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});
