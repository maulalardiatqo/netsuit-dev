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
        var cForm = rec.getValue('tranid');
        log.debug('cForm', cForm)
        var status = rec.getValue('approvalstatus');
        log.debug('status', status)
        if(cForm.indexOf('PR') !== -1){
            // var cekLinePR = rec.getLineCount({
            //     sublistId : 'recmachcustrecord_iss_pr_parent'
            // })
            // log.debug('cekLinePR', cekLinePR)
            // if(cekLinePR > 0){
             const userRole = runtime.getCurrentUser().role;
             if(userRole == 1019 || userRole == 3){
                form.addButton({
                    id: 'custpage_button_pr',
                    label: "Print PR Purchasing",
                    functionName: "printPDFPRPurchase()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_po.js "
             }
             if(userRole != 1019){
                form.addButton({
                    id: 'custpage_button_pr',
                    label: "Print PR",
                    functionName: "printPDFPR()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_po.js "
             }
                
            // }
               
           
        }else{
            //if(status == '2'){
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Print PO",
                    functionName: "printPDF()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_po.js "
            //}
        }
       
        
    }
}
return {
    beforeLoad: beforeLoad,
};
});