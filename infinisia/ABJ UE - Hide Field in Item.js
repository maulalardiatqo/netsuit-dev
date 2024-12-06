/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/log'], function(runtime, serverWidget, log) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
            var currentUserRole = runtime.getCurrentUser().role;
            log.debug('Current User Role', currentUserRole);

            if (currentUserRole == 3) { // Ganti dengan ID role yang sesuai
                var form = context.form;

                var sublistIds = ['price1', 'price2', 'price3', 'price4', 'price5', 'price6'];

                sublistIds.forEach(function(sublistId) {
                    var sublist = form.getSublist({ id: sublistId });
                    if (sublist) {
                        try {
                            var fields = sublist.getFieldIds(); 
                            log.debug('Fields in Sublist', fields);

                            // fields.forEach(function(fieldId) {
                            //     var field = sublist.getField({ id: fieldId });
                            //     if (field) {
                            //         field.updateDisplayType({
                            //             displayType: serverWidget.FieldDisplayType.HIDDEN
                            //         });
                            //         log.debug('Field hidden');
                            //     }
                            // });
                        } catch (e) {
                            log.error('Error hiding fields in sublist', e);
                        }
                    }
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
