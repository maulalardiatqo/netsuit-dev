/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

 define(['N/runtime', 'N/log'], (runtime, log) => {
    function beforeLoad(scriptContext) {
      if (scriptContext.type === scriptContext.UserEventType.VIEW) {
  
        var rec = scriptContext.newRecord;
        var requestor = rec.getValue("entity");
        var nextApprover = rec.getValue("nextapprover");
        var permission = runtime.getCurrentUser();
        var userObject = runtime.getCurrentUser();
        var userRole = userObject.role;
          var status = rec.getValue({
            fieldId: "status",
          });
        var userId = userObject.id;
          log.debug("status", userRole);
          log.debug('requestor',requestor);
          log.debug('userId', userId);
          log.debug('nextApprover', nextApprover);
       
          if(userId == requestor && nextApprover == -1){
            var objForm = scriptContext.form;
            objForm.addButton({
              id: 'custpage_purchase_requsi_button',
              label: 'Cancel PR',
              functionName: "CancelPr('pr')"
            });
            
            scriptContext.form.clientScriptModulePath = "SuiteScripts/pr_cancel_cs.js";
          }
            
        
      }
    }
    return {
      beforeLoad: beforeLoad
    };
  });