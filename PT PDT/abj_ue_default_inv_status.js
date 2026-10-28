/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log'], (log) => {

    const beforeSubmit = (context) => {
        try {
            const { type, UserEventType, newRecord } = context;

            if (
                type !== UserEventType.CREATE &&
                type !== UserEventType.EDIT &&
                type !== UserEventType.COPY
            ) {
                return;
            }

            const recType = newRecord.type;
            const TARGET_STATUS_VALUE = 2; // Value untuk default status

            // 2. Logic untuk ITEM RECEIPT (Subrecord di Sublist 'item')
            if (recType === 'itemreceipt') {
                const lineCount = newRecord.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    const hasInventoryDetail = newRecord.hasSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: i
                    });

                    if (hasInventoryDetail) {
                        const inventoryDetailRec = newRecord.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });

                        updateInventoryStatus(inventoryDetailRec, TARGET_STATUS_VALUE);
                    }
                }
            } 
            
            // 3. Logic untuk WORK ORDER COMPLETION (Subrecord di Header/Body)
            else if (recType === 'workordercompletion') {
                const hasHeaderInventoryDetail = newRecord.hasSubrecord({
                    fieldId: 'inventorydetail'
                });

                if (hasHeaderInventoryDetail) {
                    const inventoryDetailRec = newRecord.getSubrecord({
                        fieldId: 'inventorydetail'
                    });

                    updateInventoryStatus(inventoryDetailRec, TARGET_STATUS_VALUE);
                }
            }

        } catch (e) {
            log.error({
                title: 'Error in beforeSubmit - Inventory Status Defaulting',
                details: e.message || e.toString()
            });
        }
    };

    /**
     * @param {Record} inventoryDetailRec
     * @param {Number} targetStatus
     */
    const updateInventoryStatus = (inventoryDetailRec, targetStatus) => {
        const assignmentCount = inventoryDetailRec.getLineCount({
            sublistId: 'inventoryassignment'
        });

        for (let j = 0; j < assignmentCount; j++) {
            inventoryDetailRec.setSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                line: j,
                value: targetStatus
            });
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };

});