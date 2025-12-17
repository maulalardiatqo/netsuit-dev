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
                const purchaseperKG = formSublist.getField({
                    id : 'custcol_abj_purchase_price_per_kg'
                })
                if (purchaseperKG && typeof purchaseperKG !== 'undefined' && purchaseperKG !== null) {
                    purchaseperKG.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
                const lastPurchase = formSublist.getField({
                    id : 'lastpurchaseprice'
                })
                if (lastPurchase && typeof lastPurchase !== 'undefined' && lastPurchase !== null) {
                    lastPurchase.updateDisplayType({
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
        var userObj = runtime.getCurrentUser();
        log.debug('Custom script ID of current user role: ' + userObj.role, userObj.role);
        var currentRole = userObj.role
        var form = context.form;
        var rec = context.newRecord;
        var recType = rec.type
        log.debug('recType', recType)
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            var cekFrom = rec.getValue('customform');
            log.debug('cekFrom', cekFrom)
            if(recType == 'purchaseorder'){
                if(currentRole == 1016 || currentRole == 1004 || currentRole == 1013 || currentRole == 1025 || currentRole == 1026 || currentRole == 1005 || currentRole == 1024){
                    hideField(form);
                }
                log.debug('recType PO')
            }
            if(recType == 'salesorder'){
                log.debug('recSO');
                if(currentRole == 1025 || currentRole == 1026 || currentRole == 1005 || currentRole == 1024){
                    hideField(form);
                    var discountTotal = form.getField({
                        id: 'discounttotal',
                    })
                    discountTotal.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    var discountRate = form.getField({
                        id: 'discountrate',
                    })
                    discountRate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            }
            

        }
        // if(context.type === context.UserEventType.VIEW){
        //     var cForm = rec.getValue('tranid');
        //     log.debug('cForm', cForm)
        //     if(cForm.indexOf('PR') !== -1){
        //         hideField(form);
        //     }
        // }
    }
return {
    beforeLoad: beforeLoad,
};
});