/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/runtime"], (runtime) => {

    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE ||
                context.type === context.UserEventType.EDIT ||
                context.type === context.UserEventType.VIEW) {
                const currentRole = runtime.getCurrentUser().role;
                const allowedRoles = [1011, 1009, 1012, 1063, 1010, 1, 2, 3];
                    log.debug('currentRole', currentRole)
                if (!allowedRoles.includes(currentRole)) {
                    const form = context.form;
                    form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_financial_tab_customer.js';
                    log.debug('called Cs')
                }
                
            }
        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    return { beforeLoad };
});
