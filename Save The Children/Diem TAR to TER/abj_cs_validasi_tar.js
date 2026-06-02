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

        function pageInit(context){
            toggleDiemFields(context.currentRecord, 'recmachcustrecord_tar_e_id')
        }

        function lineInit(context) {
            try {
                if (context.sublistId === CONFIG.SUBLIST_ID) {
                    toggleDiemFields(context.currentRecord, context.sublistId);
                }
            } catch (e) {
                log.error('Error in lineInit', e);
            }
        }

        function fieldChanged(context) {
            try {
                if (context.sublistId === CONFIG.SUBLIST_ID && context.fieldId === 'custrecord_tar_diem') {
                    toggleDiemFields(context.currentRecord, context.sublistId);
                }
            } catch (e) {
                log.error('Error in fieldChanged', e);
            }
        }

        function toggleDiemFields(rec, sublistId) {
            const isDiem = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_diem' });
            const shouldDisable = (isDiem === true || isDiem === 'T') ? false : true;

            CONFIG.FIELDS_TO_TOGGLE.forEach(fieldId => {
                const fieldObj = rec.getSublistField({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: rec.getCurrentSublistIndex({ sublistId: sublistId })
                });

                if (fieldObj) {
                    fieldObj.isDisabled = shouldDisable;
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

        function saveRecord(context) {
            try {
                const rec = context.currentRecord;
                const sublistId = CONFIG.SUBLIST_ID;
                const lineCount = rec.getLineCount({ sublistId: sublistId });
                
                let itemPercentageMap = {};

                for (let i = 0; i < lineCount; i++) {
                    const isDiemRaw = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_diem', line: i });
                    const isDiem = (isDiemRaw === true || isDiemRaw === 'T');

                    if (isDiem) {
                        const itemDiem = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_item_diem', line: i });
                        const sof = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_donor', line: i });
                        const dateRtn = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expctd_date_rtn', line: i });
                        const dateDepart = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expctd_date_depart', line: i });
                        const pctRaw = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_prcntg', line: i });

                        if (!itemDiem || !dateRtn || !dateDepart || (pctRaw === '' || pctRaw === null || pctRaw === undefined)) {
                            alert(`Error on Line ${i + 1}: Since 'Diem' is checked, you must fill in Item Diem, Dates, and Percentage.`);
                            return false; 
                        }

                        let pctVal = parseFloat(pctRaw) || 0;
                        if (typeof pctRaw === 'string' && pctRaw.includes('%')) {
                            pctVal = parseFloat(pctRaw.replace('%', ''));
                        }

                        if (itemDiem) {
                            const groupKey = `${itemDiem}_${sof || 'NOSOF'}`;
                            if (!itemPercentageMap[groupKey]) {
                                itemPercentageMap[groupKey] = {
                                    itemId: itemDiem,
                                    sofId: sof || '-',
                                    totalPct: 0
                                };
                            }
                            itemPercentageMap[groupKey].totalPct += pctVal;
                        }
                    }
                }

                for (let key in itemPercentageMap) {
                    const group = itemPercentageMap[key];
                    if (group.totalPct > 100) {
                        alert(`Validation Error: Total Percentage for Item Diem (ID: ${group.itemId}) with SOF (ID: ${group.sofId}) exceeds 100%. Current total: ${group.totalPct}%`);
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
            lineInit: lineInit,        
            fieldChanged: fieldChanged, 
            validateLine: validateLine,
            saveRecord: saveRecord
        };
    }
);