/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/ui/serverWidget"], (runtime, serverWidget) => {

    function beforeLoad(context) {
        var currentRole = runtime.getCurrentUser().role;
        var allowedRoles = [1010, 1012, 1063, 1048, 1066, 1028, 1055, 1076, 1077, 1081, 1083, 1084, 1079, 1078, 1085];

        if (
            [context.UserEventType.EDIT, context.UserEventType.CREATE, context.UserEventType.VIEW].includes(context.type) &&
            allowedRoles.includes(Number(currentRole))
        ) {
            var form = context.form;

            ['averagecost', 'totalvalue', 'cost', 'lastpurchaseprice'].forEach(function(fieldId) {
                var field = form.getField({
                    id: fieldId
                });

                if (field) {
                    field.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
