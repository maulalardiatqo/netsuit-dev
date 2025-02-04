/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], function (serverWidget, runtime) {
    function beforeLoad(context) {
        try {
            // Hanya berjalan dalam mode VIEW atau EDIT
            if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY || context.type === context.UserEventType.XEDIT) {
                var userRole = runtime.getCurrentUser().role;
                log.debug('user role', userRole)
                var restrictedRoles = [1024, 1025, 1026];

                if (restrictedRoles.includes(userRole)) {
                    log.debug('masuk restric')
                    var form = context.form;
                    var formSublist = form.getSublist({ id: "inventory" });

                    if (formSublist) {
                        // Sembunyikan field "currentvalue"
                        var currentValueField = formSublist.getField({ id: "currentvalue" });
                        if (currentValueField) {
                            currentValueField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }

                        // Sembunyikan field "unitcost"
                        var unitCostField = formSublist.getField({ id: "unitcost" });
                        if (unitCostField) {
                            unitCostField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
