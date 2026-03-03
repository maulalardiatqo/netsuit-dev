/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/log'], (serverWidget, log) => {

    const beforeLoad = (scriptContext) => {
        try {
            const form = scriptContext.form;
            const SUBLIST_ID = 'recmachcustrecord_tar_id_ter';
            
            const fieldsToHide = [
                { id: 'custrecord_tar_diem', label: 'Diem' },
                { id: 'custrecord_tar_item_diem', label: 'Item Diem' },
                { id: 'custrecord_tar_expctd_date_depart', label: 'Expected date of departure' },
                { id: 'custrecord_tar_expctd_date_rtn', label: 'Expected date of return' },
                { id: 'custrecord_tar_advance', label: 'Advance' },
                { id: 'custrecord_tar_prcntg', label: 'Percentage (%)' }
            ];

            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                const hideContentField = form.addField({
                    id: 'custpage_hide_sublist_fields',
                    label: 'Hide Sublist Fields CSS',
                    type: serverWidget.FieldType.INLINEHTML
                });
                let cssStyles = '<style>';
                fieldsToHide.forEach(field => {
                    cssStyles += `
                        td[data-label="${field.label}"] {
                            color: transparent !important;
                            font-size: 0 !important;
                        }
                        td[data-label="${field.label}"] * {
                            display: none !important;
                        }
                    `;
                });
                cssStyles += '</style>';

                hideContentField.defaultValue = cssStyles;
            }

            if (scriptContext.type === scriptContext.UserEventType.EDIT || 
                scriptContext.type === scriptContext.UserEventType.CREATE) {
                
                const sublistObj = form.getSublist({ id: SUBLIST_ID });
                
                if (sublistObj) {
                    fieldsToHide.forEach(field => {
                        const fieldObj = sublistObj.getField({ id: field.id });
                        if (fieldObj) {
                            fieldObj.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            });
                        }
                    });
                }
            }

        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    };

    return { beforeLoad };
});