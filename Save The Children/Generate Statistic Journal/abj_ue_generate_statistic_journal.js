/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([], () => {
    const beforeLoad = (context) => {
        const { form, type, UserEventType } = context;

        if (type === UserEventType.VIEW) {
            form.addButton({
                id: 'custpage_btn_create_je',
                label: 'Create Journal Entry',
                functionName: 'createJe' 
            });
            
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_generate_statistic_journal.js';
        }
    };

    return { beforeLoad };
});