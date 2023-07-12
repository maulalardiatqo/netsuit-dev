/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log'], (runtime, log) => {
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.VIEW) {

      var rec = scriptContext.newRecord;
        var status = rec.getValue({
          fieldId: "status",
        });
        
        log.debug("status", status);

          var form = scriptContext.form ;
                   form.removeButton({
                     id :'createpo',
                    });
     
        if(status == "Pending Order"){
          const objForm = scriptContext.form;
          objForm.addButton({
            id: 'custpage_purchase_req_button',
            label: 'Generate Purchase Order',
            functionName: "createPO('po')"
          });
          scriptContext.form.clientScriptModulePath = "SuiteScripts/po_create_cs.js";
        }
          
      
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});