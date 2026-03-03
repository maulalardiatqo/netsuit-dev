/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/log'], (dialog, log) => {

    /**
     * Fungsi ini berjalan saat user menekan tombol Save pada record.
     * @param {Object} scriptContext
     */
    const saveRecord = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const SUBLIST_ID = 'recmachcustrecord_tar_id_ter';
        const FIELD_ID = 'custrecord_ter_attachment';

        try {
            const lineCount = currentRecord.getLineCount({
                sublistId: SUBLIST_ID
            });

            for (let i = 0; i < lineCount; i++) {
                const attachmentValue = currentRecord.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: FIELD_ID,
                    line: i
                });

                if (!attachmentValue) {
                    dialog.alert({
                        title: 'Missing Attachment',
                        message: `Mohon isi field Attachment pada baris ke-${i + 1} sebelum menyimpan.`
                    });
                    
                    return false; 
                }
            }

            return true; 
        } catch (e) {
            log.error('Error in saveRecord', e.message);
            return true; 
        }
    };

    return {
        saveRecord: saveRecord
    };
});