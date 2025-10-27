/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
        var form = context.form;
        var rec = context.newRecord;
        var recId = rec.id
        var currentUserRole = runtime.getCurrentUser().role;
        var cekType = rec.type
        log.debug('cekType', cekType)
            if(cekType == 'customrecord_tar'){
                form.addButton({
                    id: 'custpage_button_print_tar',
                    label: 'Print TAR',
                    functionName: "window.open('/app/site/hosting/scriptlet.nl?script=645&deploy=1&recid=' + nlapiGetRecordId())"
                });
                
            }
            if(cekType == 'customrecord_ter'){
                form.addButton({
                    id: 'custpage_button_print_tar',
                    label: 'Print TER',
                    functionName: "window.open('/app/site/hosting/scriptlet.nl?script=647&deploy=1&recid=' + nlapiGetRecordId())"
                });
            }
        }
}
return {
    beforeLoad: beforeLoad,
};
});