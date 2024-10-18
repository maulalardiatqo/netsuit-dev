/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function beforeLoad(context) {
        var userObj = runtime.getCurrentUser();
        log.debug('Custom script ID of current user role: ' + userObj.role, userObj.role);
        var currentRole = userObj.role
        var form = context.form;
        var rec = context.newRecord;
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            var bankName = form.getField({
                id: 'sbankname',
            })
            if (bankName && typeof bankName !== 'undefined' && bankName !== null) {
                bankName.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var bankAccNumb = form.getField({
                id: 'sbankcompanyid',
            })
            if (bankAccNumb && typeof bankAccNumb !== 'undefined' && bankAccNumb !== null) {
                bankAccNumb.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var bankRNumber = form.getField({
                id: 'sbankroutingnumber',
            })
            if (bankRNumber && typeof bankRNumber !== 'undefined' && bankRNumber !== null) {
                bankRNumber.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }

        }
        
    }
return {
    beforeLoad: beforeLoad,
};
});