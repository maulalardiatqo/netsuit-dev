/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    const beforeSubmit = (scriptContext) => {
        if (scriptContext.type !== scriptContext.UserEventType.CREATE && 
            scriptContext.type !== scriptContext.UserEventType.EDIT) {
            return;
        }

        const currentRecord = scriptContext.newRecord;
        const transactionType = currentRecord.type;

        if (transactionType === 'expensereport') {
            const sublistId = 'expense';
            const lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            
            let expenseGroupMap = {};
            let limitGroupMap = {};

            for (let i = 0; i < lineCount; i++) {
                let sofId = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'customer', 
                    line: i
                });

                let lineAmount = parseFloat(currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'amount',
                    line: i
                })) || 0;

                let lineLimitFromTor = parseFloat(currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_amount_limit_from_tor', 
                    line: i
                })) || 0;

                if (sofId) {
                    sofId = sofId.toString();

                    if (!expenseGroupMap[sofId]) {
                        expenseGroupMap[sofId] = 0;
                    }
                    expenseGroupMap[sofId] += lineAmount;

                    limitGroupMap[sofId] = lineLimitFromTor;
                }
            }

            log.debug('Expense Group Validation Data', {
                expenseGroupMap: expenseGroupMap,
                limitGroupMap: limitGroupMap
            });
            Object.keys(expenseGroupMap).forEach((sofKey) => {
                let totalInputAmount = expenseGroupMap[sofKey];
                let maxLimitTOR = limitGroupMap[sofKey] || 0;

                if (maxLimitTOR > 0 && totalInputAmount > maxLimitTOR) {
                    throw `[VALIDASI GAGAL] Total pengajuan Expense untuk SOF/Project ID (${sofKey}) sebesar Rp ${totalInputAmount.toLocaleString()} melebihi batas sisa kuota budget TOR sebesar Rp ${maxLimitTOR.toLocaleString()}. \n\nMohon sesuaikan kembali nominal pada baris item Anda.`;
                }
            });

            return; 
        }

        // =================================================================
        // LOGIKA STANDAR UNTUK TRANSAKSI LAIN (BERDASARKAN TOTAL HEADER)
        // =================================================================
        let maxAmountLimit = 0;
        
        if (transactionType === 'customrecord_tar') {
            maxAmountLimit = parseFloat(currentRecord.getValue('custrecord_amount_from_tor')) || 0;
        } else {
            maxAmountLimit = parseFloat(currentRecord.getValue('custbody_amount_from_tor')) || 0;
        }

        log.debug('Check Limit (Header Mode)', { transactionType, maxAmountLimit });

        if (maxAmountLimit > 0) {
            let sublistId = '';
            let lineFieldId = '';

            if (transactionType === 'purchaseorder' || transactionType === 'purchaserequisition') {
                sublistId = 'item';
                lineFieldId = (transactionType === 'purchaseorder') ? 'amount' : 'estimatedamount';
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

            log.debug('Final Validation (Header Mode)', { total: totalLineAmount, limit: maxAmountLimit });

            if (totalLineAmount > maxAmountLimit) {
                throw `Total amount (${totalLineAmount.toLocaleString()}) melebihi nilai Amount from TOR (${maxAmountLimit.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`;
            }
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };
});