/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Target Record: Work Order Completion (workordercompletion)
 * Trigger: afterSubmit
 */
define(['N/record', 'N/log'], (record, log) => {

    const afterSubmit = (scriptContext) => {
        const { type, UserEventType, newRecord } = scriptContext;
        if (type !== UserEventType.CREATE && type !== UserEventType.COPY && type !== UserEventType.EDIT) {
            return;
        }

        try {
            const woCompletionId = newRecord.id;
            const tranDate = newRecord.getValue({ fieldId: 'trandate' });
            if (!tranDate) {
                log.debug('Skipped', 'Transaction Date is empty.');
                return;
            }
            const woCompletionRec = record.load({
                type: record.Type.WORK_ORDER_COMPLETION,
                id: woCompletionId,
                isDynamic: false 
            });

            let isUpdated = false;
            if (woCompletionRec.hasSubrecord({ fieldId: 'inventorydetail' })) {
                const invDetailRec = woCompletionRec.getSubrecord({ fieldId: 'inventorydetail' });
                const lineCount = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                for (let i = 0; i < lineCount; i++) {
                    const currentMfgDate = invDetailRec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'custitemnumber_aln_manufactured_date',
                        line: i
                    });

                    let needsUpdate = false;
                    if (!currentMfgDate) {
                        needsUpdate = true;
                    } else if (currentMfgDate.getTime() !== tranDate.getTime()) {
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        invDetailRec.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'custitemnumber_aln_manufactured_date',
                            line: i,
                            value: tranDate
                        });
                        isUpdated = true;
                    }
                }
            }

            if (isUpdated) {
                const savedId = woCompletionRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.audit('Success', `Updated Inventory Detail WOC ID: ${savedId}`);
            } else {
                log.debug('No Changes', `Dates already match trandate for WOC ID: ${woCompletionId}`);
            }

        } catch (e) {
            log.error({
                title: 'Error in afterSubmit - Update WOC InvDetail',
                details: e.message
            });
        }
    };

    return {
        afterSubmit
    };
});