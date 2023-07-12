/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log'], (runtime, log) => {
    function beforeLoad(scriptContext) {
        try {
            const recCurrent = scriptContext.newRecord;
            const objForm = scriptContext.form;
            const stStatus = recCurrent.getValue({
                fieldId: 'shipmentstatus'
            });
          	log.debug("shipmentstatus", stStatus);
            if (stStatus === 'received' || stStatus === 'partiallyReceived') {
                objForm.addButton({
                    id: 'custpage_allocate_landed_cost_button',
                    label: 'Allocate Landed Cost',
                    functionName: 'openForm'
                });
            }
        } catch(error) {
            log.error({
                title: 'beforeLoad_allocate_landed_cost_button',
                details: error.message
            });
        }
        scriptContext.form.clientScriptModulePath = "SuiteScripts/is_allocate_landed_cost_cs.js";
    }
    return {
        beforeLoad: beforeLoad
    };
});