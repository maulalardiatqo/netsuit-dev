/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {

        function beforeLoad(context) {
            try {
                if (context.type === context.UserEventType.EDIT) {
                    var newRecord = context.newRecord;
                    var rec_id = newRecord.getValue('id');
                    log.debug('rec_id', rec_id);

                    var currentUser = runtime.getCurrentUser();
                    var userRoleId = currentUser.role;
                    var userRoleName = currentUser.roleId;
                    log.debug('userRoleName', userRoleName);
                    log.debug('userRoleId', userRoleId)
                    if (userRoleId == 1016) { 
                        var form = context.form;
                        const itemSublist = form.getSublist({
                            id: "item"
                        });

                        if (itemSublist) {
                            var fieldIds = ['price', 'taxcode']; // Tambahkan semua field yang ingin di-disable
                            // fieldIds.forEach(function (fieldId) {
                            //     var field = itemSublist.getField({ id: fieldId });
                            //     if (field) {
                            //         field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                            //     }
                            // });
                            const taxCode = itemSublist.getField({
                                id: "taxcode"
                            });
                            log.debug('taxCode', taxCode)
                            if (taxCode && typeof taxCode !== 'undefined' && taxCode !== null) {
                                taxCode.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });
                            }
                            const price = itemSublist.getField({
                                id: "price"
                            });
                            if (price && typeof price !== 'undefined' && price !== null) {
                                price.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });
                            }
                            const grossAmount = itemSublist.getField({
                                id: "grossamt"
                            });
                            if (grossAmount && typeof grossAmount !== 'undefined' && grossAmount !== null) {
                                grossAmount.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });
                            }
                            const taxtAmt = itemSublist.getField({
                                id: "tax1amt"
                            });
                            if (taxtAmt && typeof taxtAmt !== 'undefined' && taxtAmt !== null) {
                                taxtAmt.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.DISABLED
                                });
                            }
                            // itemSublist.getField({ id: 'taxcode' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                            // itemSublist.getField({ id: 'price' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                            // itemSublist.getField({ id: 'grossamt' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                            // itemSublist.getField({ id: 'tax1amt' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                            
                        }
                    }

                }
            } catch (error) {
                log.error({
                    title: 'custpage_disablefieldso',
                    details: error.message
                });
            }
        }

        return {
            beforeLoad: beforeLoad
            //afterSubmit: afterSubmit
        }
    });
