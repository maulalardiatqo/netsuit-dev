/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/config", "N/runtime", "N/error"], function(
    record,
    search,
    config,
    runtime,
    error
) {
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var user = runtime.getCurrentUser();
            var subsidiaryUser = user.subsidiary;
            log.debug('subsidiaryUser', subsidiaryUser);

            var recNew = context.newRecord;
            var currentSubs = recNew.getValue('subsidiary');
            log.debug('currentSubs', currentSubs);

            // Validasi jika subsidiaryUser dan currentSubs tidak sama
            if (subsidiaryUser !== currentSubs) {
                throw error.create({
                    name: 'SUBSIDIARY_MISMATCH',
                    message: 'Subsidiary user dan subsidiary pada record tidak sama. Harap sesuaikan sebelum menyimpan.',
                    notifyOff: false
                });
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
