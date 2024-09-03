/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
   
    function beforeLoad(context) {
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            var rec = context.newRecord;
            var form = context.form;
            var cekFrom = rec.getValue('customform');
           
            log.debug('cekFrom', cekFrom)
            
            if(cekFrom != 138){
                try {
            
                    const formSublist = form.getSublist({
                        id: "item"
                    });
                    if (formSublist) {
                        const customers = formSublist.getField({
                            id: "customer"
                        });
                        if (customers && typeof customers !== 'undefined' && customers !== null) {
                            customers.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                        const abjCustomer = formSublist.getField({
                            id: "custcol_abj_customer_line"
                        });
                        if (abjCustomer && typeof abjCustomer !== 'undefined' && abjCustomer !== null) {
                            abjCustomer.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                        const noSo = formSublist.getField({
                            id: "custcol_abj_no_so"
                        });
                        if (noSo && typeof noSo !== 'undefined' && noSo !== null) {
                            noSo.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                        const poCust = formSublist.getField({
                            id: "custcol_abj_po_customer"
                        });
                        if (poCust && typeof poCust !== 'undefined' && poCust !== null) {
                            poCust.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                    }
                } catch(error) {
                    log.error({
                        title: 'Error occurred when hiding field',
                        details: JSON.stringify({
                            sublistId: "item"
                        })
                    });
                }
            }
            

        }
        
    }
return {
    beforeLoad: beforeLoad,
};
});