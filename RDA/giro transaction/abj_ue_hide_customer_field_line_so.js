/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function beforeLoad(context) {
        var form = context.form;
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            const formSublist = form.getSublist({
                id: "recmachcustrecord_rda_giro_id"
            });
            if (formSublist) {
                const noSo = formSublist.getField({
                    id: "custrecord_rda_girodetail_customer"
                });

                if (noSo) {
                    noSo.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const invNumb = formSublist.getField({
                    id: "custrecord_rda_giro_invoicenum"
                });

                if (invNumb) {
                    invNumb.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const amt = formSublist.getField({
                    id: "custrecord_rda_giro_amountinvoice"
                });

                if (amt) {
                    amt.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            }
        }
        
    }

    return {
        beforeLoad: beforeLoad,
    };
});
