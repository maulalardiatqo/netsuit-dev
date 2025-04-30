/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], (serverWidget, runtime) => {

    const beforeLoad = (context) => {
        const form = context.form;
        var currentRole = runtime.getCurrentUser().role;
        if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
            try {
            log.debug('currentRole', currentRole)
            if(currentRole != 3){
                context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_landedcost_tab_ir.js';
            }
            
        
            } catch (e) {
            log.error('Hide Sublist Error', e);
            }
        }
        };
  
    return { beforeLoad };
  });
  