/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
      if (context.type === context.UserEventType.VIEW) {
        var form = context.form;
        var rec = context.newRecord;
        var currentUserRole = runtime.getCurrentUser().role;
        var cekMail = rec.getValue('custbody_abj_email_recipients');
        log.debug('cekMail', cekMail);
        if(cekMail){
            form.addButton({
                id: 'custpage_button_print_so',
                label: "Send Email",
                functionName: "sendMail()"
            });
        }
        form.addButton({
            id: 'custpage_button_print_so',
            label: "Print SO",
            functionName: "printPDF()"
        });

        context.form.clientScriptModulePath = "SuiteScripts/abj_so_print_cs.js"
      }
    }
    return {
      beforeLoad: beforeLoad,
    };
  });