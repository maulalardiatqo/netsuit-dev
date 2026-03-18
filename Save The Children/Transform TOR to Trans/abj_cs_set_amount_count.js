/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/log'], (log) => {

    const SUBLIST_ID = 'recmachcustrecord_tori_id';
    const FIELDS = {
        UNIT_COST: 'custrecord_tor_unit_cost',
        QUANTITY: 'custrecord_tor_quantity',
        AMOUNT: 'custrecord_tori_amount'
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
            console.log('totalAmount', totalAmount)
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

    return {
        fieldChanged
    };

});