/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function beforeLoad(context) {
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var totalPr = form.getField({
                id: 'total',
            })
            totalPr.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
        }
    }
return {
    beforeLoad: beforeLoad,
};
});