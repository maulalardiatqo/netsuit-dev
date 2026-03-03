/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/log'], (serverWidget, log) => {

    const beforeLoad = (scriptContext) => {
        try {
            const form = scriptContext.form;

            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                const hideContentField = form.addField({
                    id: 'custpage_hide_attachment_content',
                    label: 'Hide Content CSS',
                    type: serverWidget.FieldType.INLINEHTML
                });
                hideContentField.defaultValue = `
                    <style>
                        td[data-label="Attachment"] {
                            color: transparent !important;
                            font-size: 0 !important;
                        }
                        td[data-label="Attachment"] * {
                            display: none !important;
                        }
                        /* td.listheadertd[data-label="Attachment"] .listheader,
                        td.listheadertd[data-label="Attachment"] {
                            color: transparent !important;
                        }
                        */
                    </style>
                `;
            }

            if (scriptContext.type === scriptContext.UserEventType.EDIT || 
                scriptContext.type === scriptContext.UserEventType.CREATE) {
                
                const sublistObj = form.getSublist({ id: 'recmachcustrecord_tar_e_id' });
                if (sublistObj) {
                    const fieldObj = sublistObj.getField({ id: 'custrecord_ter_attachment' });
                    if (fieldObj) {
                        fieldObj.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    };

    return { beforeLoad };
});