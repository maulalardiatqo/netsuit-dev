/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Deployment: 
 * 1. Purchase Requisition
 * 2. Purchase Order
 */
define(['N/runtime', 'N/record', 'N/log'], (runtime, record, log) => {

    const beforeSubmit = (context) => {
        const { newRecord, oldRecord, type, UserEventType } = context;

        try {
            // ==========================================
            // 1. LOGIKA SAAT CREATE
            // ==========================================
            if (type === UserEventType.CREATE) {
                const recType = newRecord.type;
                let requestorValue = null;

                if (recType === record.Type.PURCHASE_REQUISITION || recType === 'purchaserequisition') {
                    requestorValue = newRecord.getValue({ fieldId: 'entity' });
                } 
                else if (recType === record.Type.PURCHASE_ORDER || recType === 'purchaseorder') {
                    requestorValue = newRecord.getValue({ fieldId: 'employee' });
                }
                log.debug('requestorValue', requestorValue)
                if (requestorValue) {
                    newRecord.setValue({
                        fieldId: 'custbody_pdt_requestor',
                        value: requestorValue
                    });
                }
            }

            if (type === UserEventType.EDIT) {
                const currentUserRole = runtime.getCurrentUser().role;

                for (let i = 1; i <= 4; i++) {
                    const nameField = `custbody_pdt_approval${i}_name`;
                    const dateField = `custbody_pdt_approval${i}_date`;
                    const roleField = `custbody_pdt_approval${i}_role`;
                    
                    const oldName = oldRecord.getValue({ fieldId: nameField });
                    const newName = newRecord.getValue({ fieldId: nameField });

                    const oldDate = oldRecord.getValue({ fieldId: dateField });
                    const newDate = newRecord.getValue({ fieldId: dateField });
                    log.debug('date data', {oldDate : oldDate, newDate : newDate})
                    const isNameNewlyFilled = !oldName && newName;
                    const isDateNewlyFilled = !oldDate && newDate;
                    log.debug('name data', {oldName : oldName, newName : newName})
                    if (isNameNewlyFilled || isDateNewlyFilled) {
                        log.debug('masuk kondisi : Role : ', currentUserRole)
                        newRecord.setValue({
                            fieldId: roleField,
                            value: currentUserRole 
                        });
                    }
                }
            }

        } catch (error) {
            log.error({
                title: 'Error in beforeSubmit UserEvent',
                details: error.message || error.toString()
            });
        }
    };

    return {
        beforeSubmit
    };
});