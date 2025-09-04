/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE ||
                context.type === context.UserEventType.EDIT ||
                context.type === context.UserEventType.VIEW) {
                    log.debug('trigger')
                const form = context.form;
                form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_tab_tax.js';
            }
        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    return { beforeLoad };
});
