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
        try {
            if (context.type === context.UserEventType.CREATE) {
                var user = runtime.getCurrentUser();
                var subsidiaryUser = user.subsidiary;
                var recNew = context.newRecord;
                var currentSubs = recNew.getValue('subsidiary');
                log.debug('currentSubs', currentSubs);
                log.debug('subsidiaryUser', subsidiaryUser)

                if (subsidiaryUser != 1 && subsidiaryUser != 3 && subsidiaryUser != currentSubs) {
                    throw error.create({ name: 'SUBSIDIARY_MISMATCH', message: 'Subsidiary user dan subsidiary pada record tidak sama. Harap sesuaikan sebelum menyimpan.' });
                }
            }
        } catch (e) {
            throw new Error(e.message);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
