/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function hideField(form){
        try {
            var subtotal = form.getField({
                id: 'subtotal',
            })
            if (subtotal && typeof subtotal !== 'undefined' && subtotal !== null) {
                subtotal.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var total = form.getField({
                id: 'total',
            })
            if (total && typeof total !== 'undefined' && total !== null) {
                total.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var taxtotal = form.getField({
                id: 'taxtotal',
            })
            if (taxtotal && typeof taxtotal !== 'undefined' && taxtotal !== null) {
                taxtotal.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            const formSublist = form.getSublist({
                id: "item"
            });
            if (formSublist) {
                const amount = formSublist.getField({
                    id: "amount"
                });
                if (amount && typeof amount !== 'undefined' && amount !== null) {
                    amount.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const rate = formSublist.getField({
                    id: "rate"
                });
                if (rate && typeof rate !== 'undefined' && rate !== null) {
                    rate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const grossamt = formSublist.getField({
                    id: "grossamt"
                });
                if (grossamt && typeof grossamt !== 'undefined' && grossamt !== null) {
                    grossamt.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const tax1amt = formSublist.getField({
                    id: "tax1amt"
                });
                if (tax1amt && typeof tax1amt !== 'undefined' && tax1amt !== null) {
                    tax1amt.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const taxcode = formSublist.getField({
                    id: "taxcode"
                });
                if (taxcode && typeof taxcode !== 'undefined' && taxcode !== null) {
                    taxcode.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const taxrate1 = formSublist.getField({
                    id: "taxrate1"
                });
                if (taxrate1 && typeof taxrate1 !== 'undefined' && taxrate1 !== null) {
                    taxrate1.updateDisplayType({
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
    function beforeLoad(context) { 
        var currentRole = runtime.getCurrentUser().role; 
        var allowedRoles = [1016, 1004, 1013, 1025, 1026, 1005, 1024, 1076, 1077, 1081, 1083, 1084, 1079, 1078, 1085]; 
        if ( [context.UserEventType.EDIT, context.UserEventType.CREATE, context.UserEventType.VIEW].includes(context.type) && allowedRoles. includes(Number(currentRole)) ) {
            var form = context.form; hideField(form); 
        } 
    }
return {
    beforeLoad: beforeLoad,
};
});