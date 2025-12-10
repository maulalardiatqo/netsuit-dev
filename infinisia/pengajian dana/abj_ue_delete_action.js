/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], (serverWidget) => {

    const beforeLoad = (scriptContext) => {
        const form = scriptContext.form;
        const type = scriptContext.type;
        const record = scriptContext.newRecord

        if (type === scriptContext.UserEventType.VIEW || 
            type === scriptContext.UserEventType.EDIT) {

            try {
                form.removeButton('delete');
                var approvalLevel = record.getValue('custrecord_approval_level');

                form.addButton({
                    id: 'custpage_delete',
                    label: "Delete",
                    functionName: "deleteRecord()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/bj_cs_validate_pengajuandana.js"
            } catch (e) {
                log.error('Remove Delete Button Error', e);
            }
        }
    };

    return { beforeLoad };
});
