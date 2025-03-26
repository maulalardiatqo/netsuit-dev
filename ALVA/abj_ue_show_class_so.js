/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], (record) => {
    const fieldId = 'cseg_abjproj_cust_'; // ID field yang ingin diubah menjadi normal

    /**
     * Before Load function to enable the field.
     * @param {Object} context
     * @param {Record} context.newRecord - The new record instance.
     * @param {string} context.type - The type of operation (create, edit, view, copy).
     * @param {Form} context.form - The current form instance.
     */
    const beforeLoad = (context) => {
        try {
            const { form, type } = context;

            // Check if the operation is create, edit, or copy
            if (type === 'create' || type === 'edit' || type === 'copy') {
                const field = form.getField({ id: fieldId });
                log.debug('field', field);
                if (field) {
                    field.updateDisplayType({ displayType: 'normal' }); 
                } else {
                    log.warning(`Field ${fieldId} tidak ditemukan`, 'Pastikan field tersedia pada form ini.');
                }
            }
        } catch (error) {
            log.error('Error enabling field:', error);
        }
    };

    return {
        beforeLoad
    };
});
