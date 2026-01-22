/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/log'],
    
    function(message, log) {

        const CONFIG = {
            SUBLIST_ID: 'recmachcustrecord_tar_e_id',
            FIELDS_TO_TOGGLE: [
                'custrecord_tar_item_diem', 
                'custrecord_tar_expctd_date_rtn', 
                'custrecord_tar_expctd_date_depart', 
                'custrecord_tar_prcntg'
            ]
        };

        function pageInit(context){}

        /**
         * Dijalankan saat baris dipilih/diinisialisasi.
         * Tujuannya: Set status disable sesuai data yang sudah tersimpan.
         */
        function lineInit(context) {
            try {
                if (context.sublistId === CONFIG.SUBLIST_ID) {
                    toggleDiemFields(context.currentRecord, context.sublistId);
                }
            } catch (e) {
                log.error('Error in lineInit', e);
            }
        }

        /**
         * Dijalankan saat user merubah value field.
         * Tujuannya: Merubah status disable secara realtime saat checkbox diklik.
         */
        function fieldChanged(context) {
            try {
                if (context.sublistId === CONFIG.SUBLIST_ID && context.fieldId === 'custrecord_tar_diem') {
                    toggleDiemFields(context.currentRecord, context.sublistId);
                }
            } catch (e) {
                log.error('Error in fieldChanged', e);
            }
        }

        // --- Helper Function untuk Logic Disable/Enable ---
        function toggleDiemFields(rec, sublistId) {
            const isDiem = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_diem' });
            
            // Jika Diem = True, maka Disable = False (Enable)
            // Jika Diem = False, maka Disable = True (Disable)
            const shouldDisable = (isDiem === true || isDiem === 'T') ? false : true;

            CONFIG.FIELDS_TO_TOGGLE.forEach(fieldId => {
                const fieldObj = rec.getSublistField({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: rec.getCurrentSublistIndex({ sublistId: sublistId })
                });

                // Pastikan field object ditemukan sebelum set property
                if (fieldObj) {
                    fieldObj.isDisabled = shouldDisable;
                    
                    // Optional: Kosongkan nilai jika didisable agar data bersih
                    if (shouldDisable) {
                        rec.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: '', ignoreFieldChange: true });
                    }
                }
            });
        }

        function validateLine(context) {
            try {
                const rec = context.currentRecord;
                const sublistId = context.sublistId;

                if (sublistId !== CONFIG.SUBLIST_ID) return true;

                const isDiem = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_diem' });
                
                if (isDiem === true || isDiem === 'T') {
                    const itemDiem = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_item_diem' });
                    const dateRtn = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expctd_date_rtn' });
                    const dateDepart = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expctd_date_depart' });
                    const pctRaw = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_prcntg' });

                    if (!itemDiem || !dateRtn || !dateDepart || (pctRaw === '' || pctRaw === null || pctRaw === undefined)) {
                        alert("Since 'Diem' is checked, you must fill in:\n- Item Diem\n- Expected Date Depart\n- Expected Date Return\n- Percentage");
                        return false; 
                    }
                }
                return true;

            } catch (e) {
                log.error('Error in validateLine', e);
                return true; 
            }
        }

        function saveRecord(context){
            try {
                const rec = context.currentRecord;
                const sublistId = CONFIG.SUBLIST_ID;
                const lineCount = rec.getLineCount({ sublistId: sublistId });
                
                let itemPercentageMap = {};

                for (let i = 0; i < lineCount; i++) {
                    const itemDiem = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_item_diem', line: i });
                    let pctRaw = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_prcntg', line: i });
                    
                    let pctVal = parseFloat(pctRaw) || 0;
                    if (typeof pctRaw === 'string' && pctRaw.includes('%')) {
                        pctVal = parseFloat(pctRaw.replace('%', ''));
                    }

                    if (itemDiem) {
                        if (!itemPercentageMap[itemDiem]) {
                            itemPercentageMap[itemDiem] = 0;
                        }
                        itemPercentageMap[itemDiem] += pctVal;
                    }
                }

                for (let itemId in itemPercentageMap) {
                    if (itemPercentageMap[itemId] > 100) {
                        alert(`Validation Error: Total Percentage for Item Diem (ID: ${itemId}) exceeds 100%. Current total: ${itemPercentageMap[itemId]}%`);
                        return false;
                    }
                }

                return true; 

            } catch (e) {
                log.error('Error in saveRecord', e);
                alert('An unexpected error occurred: ' + e.message);
                return false; 
            }
        }

        return {
            pageInit: pageInit,
            lineInit: lineInit,        // Tambahkan ini
            fieldChanged: fieldChanged, // Tambahkan ini
            validateLine: validateLine,
            saveRecord: saveRecord
        };
    }
);