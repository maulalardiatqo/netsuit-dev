/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/log'], (dialog, log) => {

    const saveRecord = (scriptContext) => {
        console.log('masuk eksekusi script')
        const currentRecord = scriptContext.currentRecord;
        const transactionType = currentRecord.type;
        
        log.debug('transactionTYpe', transactionType)
        var maxAmountLimit = 0
        if(transactionType == 'customrecord_tar'){
            maxAmountLimit = parseFloat(currentRecord.getValue({
                fieldId: 'custrecord_amount_from_tor'
            })) || 0;
        }else{
            maxAmountLimit = parseFloat(currentRecord.getValue({
                fieldId: 'custbody_amount_from_tor'
            })) || 0;
        }
        
        log.debug('maxAmountLimit', maxAmountLimit)
        if(maxAmountLimit && maxAmountLimit > 0){
                let sublistId = '';
                let lineFieldId = '';

                if (transactionType === 'purchaseorder') {
                    sublistId = 'item';
                    lineFieldId = 'amount';
                } else if (transactionType === 'purchaserequisition') {
                    sublistId = 'item';
                    lineFieldId = 'estimatedamount';
                } else if (transactionType === 'expensereport') {
                    sublistId = 'expense';
                    lineFieldId = 'amount';
                } else if(transactionType === 'customrecord_tar'){
                    sublistId = 'recmachcustrecord_tar_e_id';
                    lineFieldId = 'custrecord_tare_amount';
                }

                if (!sublistId) return true;

                try {
                    let totalLineAmount = 0;
                    const lineCount = currentRecord.getLineCount({ sublistId: sublistId });

                    for (let i = 0; i < lineCount; i++) {
                        const lineVal = currentRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: lineFieldId,
                            line: i
                        }) || 0;
                        
                        totalLineAmount += parseFloat(lineVal);
                    }

                    if (totalLineAmount > maxAmountLimit) {
                        dialog.alert({
                            title: 'Valiasi Amount',
                            message: `Total amount (${totalLineAmount.toLocaleString()}) melebihi nilai Amount from TOR (${maxAmountLimit.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`
                        });
                        return false; 
                    }

                    return true; 
                } catch (e) {
                    log.error('Error on Amount Validation', e.message);
                    return true; 
                }

        }
        return true
    };

    return {
        saveRecord: saveRecord
    };
});