/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        log.debug("HELLO BEFORE LOAD")
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var recType = rec.type;
            var currentUser = runtime.getCurrentUser();

            log.debug('rectype', recType)
            log.debug('ROLE', currentUser.role)
            log.debug('status', rec.getValue({ fieldId: 'status' }))
            log.debug('PRINT FLAG', rec.getValue({ fieldId: 'custbody_rda_print_faktur' }));
            // var currentUserRole = runtime.getCurrentUser().role;
            var salesType = rec.getText('cseg_rda_sales_type');
            // if(recType === 'invoice' && salesType === "Cash") return;
            if (recType === 'itemfulfillment' && (rec.getValue({ fieldId: 'status' }) == 'Delivered' || rec.getValue({ fieldId: 'status' }) == 'Picked') && currentUser.role !== 3 && currentUser.role !== 1149	) return;
            if (currentUser.role !== 3 && currentUser.role !== 1149
                & rec.getValue({ fieldId: 'custbody_rda_print_faktur' })) return;
                log.debug('button show')
            form.addButton({
                id: 'custpage_rda_button_print_invoice_fullfill',
                label: "Print",
                functionName: "printPDF('"+salesType+"')"
            });
            // context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_coll_man.js"
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_invoice_item_fullfill.js"
        }
    }
    return {
        beforeLoad: beforeLoad,
    };
});
