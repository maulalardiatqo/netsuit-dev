/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/log', 'N/ui/dialog'], (log, dialog) => {

    const SUBLIST_ID = 'recmachcustrecord_tori_id';
    const FIELDS = {
        UNIT_COST: 'custrecord_tor_unit_cost',
        QUANTITY: 'custrecord_tor_quantity',
        AMOUNT: 'custrecord_tori_amount',
        TRANSACTION_TYPE: 'custrecord_tor_transaction_type', // Field baru untuk tipe transaksi
        RPV_VENDOR: 'custrecord_tor_rpv_vendor'             // Field baru untuk vendor
    };

    /**
     * @param {Record} currentRecord 
     */
    const calculateSublistAmount = (currentRecord) => {
        try {
            const unitCost = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: FIELDS.UNIT_COST
            }) || 0;

            const quantity = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: FIELDS.QUANTITY
            }) || 0;

            const totalAmount = unitCost * quantity;
            console.log('totalAmount', totalAmount);
            
            currentRecord.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: FIELDS.AMOUNT,
                value: totalAmount,
                ignoreFieldChange: true 
            });
        } catch (e) {
            log.error('calculateSublistAmount', e.message);
        }
    };

    /**
     * Entry Point: fieldChanged
     * @param {Object} scriptContext
     */
    const fieldChanged = (scriptContext) => {
        const { currentRecord, sublistId, fieldId } = scriptContext;
        if (sublistId !== SUBLIST_ID) return;

        const triggerFields = [FIELDS.UNIT_COST, FIELDS.QUANTITY];
        
        if (triggerFields.includes(fieldId)) {
            calculateSublistAmount(currentRecord);
        }
    };

    /**
     * Entry Point: validateLine
     * @param {Object} scriptContext
     * @return {Boolean} 
     */
    const validateLine = (scriptContext) => {
        const { currentRecord, sublistId } = scriptContext;

        if (sublistId !== SUBLIST_ID) return true;

        try {
            const transactionType = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: FIELDS.TRANSACTION_TYPE
            });

            if (Number(transactionType) === 5) {
                const rpvVendor = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: FIELDS.RPV_VENDOR
                });

                if (!rpvVendor) {
                    dialog.alert({
                        title: 'Peringatan Validasi',
                        message: 'Vendor wajib diisi untuk Request Payment Vendor!'
                    });

                    return false; 
                }
            }
        } catch (e) {
            log.error('Error pada validateLine', e.message);
        }

        return true; 
    };

    return {
        fieldChanged,
        validateLine
    };

});