/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], (serverWidget, runtime) => {

  const beforeLoad = (context) => {
    const form = context.form;
    var currentRole = runtime.getCurrentUser().role;
    // Optional: hanya hide ketika View misalnya
    if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
      try {
        log.debug('currentRole', currentRole)
        if(currentRole != 3 && currentRole != 1011){
            context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_related_record.js ';
        }
       
  
      } catch (e) {
        log.error('Hide Sublist Error', e);
      }
    }
  };

  return { beforeLoad };
});
