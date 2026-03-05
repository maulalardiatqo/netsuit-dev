/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    const beforeSubmit = (scriptContext) => {
        // Jalankan hanya saat Create dan Edit
        if (scriptContext.type !== scriptContext.rowUserEventType?.CREATE && 
            scriptContext.type !== scriptContext.UserEventType.CREATE && 
            scriptContext.type !== scriptContext.UserEventType.EDIT) {
            return;
        }

        const currentRecord = scriptContext.newRecord;
        const transactionType = currentRecord.type;
        
        let maxAmountLimit = 0;
        
        // Ambil Header Amount
        if (transactionType === 'customrecord_tar') {
            maxAmountLimit = parseFloat(currentRecord.getValue('custrecord_amount_from_tor')) || 0;
        } else {
            maxAmountLimit = parseFloat(currentRecord.getValue('custbody_amount_from_tor')) || 0;
        }

        log.debug('Check Limit', { transactionType, maxAmountLimit });

        if (maxAmountLimit > 0) {
            let sublistId = '';
            let lineFieldId = '';

            // Mapping Sublist
            if (transactionType === 'purchaseorder' || transactionType === 'purchaserequisition') {
                sublistId = 'item';
                lineFieldId = (transactionType === 'purchaseorder') ? 'amount' : 'estimatedamount';
            } else if (transactionType === 'expensereport') {
                sublistId = 'expense';
                lineFieldId = 'amount';
            } else if (transactionType === 'customrecord_tar') {
                sublistId = 'recmachcustrecord_tar_e_id';
                lineFieldId = 'custrecord_tare_amount';
            }

            if (!sublistId) return;

            let totalLineAmount = 0;
            const lineCount = currentRecord.getLineCount({ sublistId: sublistId });

            for (let i = 0; i < lineCount; i++) {
                let lineVal = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: lineFieldId,
                    line: i
                }) || 0;
                
                totalLineAmount += parseFloat(lineVal);
            }

            log.debug('Final Validation', { total: totalLineAmount, limit: maxAmountLimit });

            // VALIDASI UTAMA
            if (totalLineAmount > maxAmountLimit) {
                throw `Total amount (${totalLineAmount.toLocaleString()}) melebihi nilai Amount from TOR (${maxAmountLimit.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`;
            }
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };
});