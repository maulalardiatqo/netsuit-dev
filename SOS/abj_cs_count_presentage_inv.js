/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {

    function validateLine(context) {
        try {
            const rec = context.currentRecord;
            const transactionType = rec.getValue({ fieldId: 'custbody_sos_transaction_types' });
            console.log('transactionType', transactionType)
            if (transactionType !== '3') {
                return true; 
            }
            if (context.sublistId !== 'item') return true;

            let percentage = parseFloat(rec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_sos_sis_percentage'
            })) || 0;

            let amountAfterDisc = parseFloat(rec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_sos_amount_after_disc'
            })) || 0;

            if (amountAfterDisc === 0) {
                let discAmt = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sos_disc_amount'
                }) || 0;
                let grsAmt = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt'
                }) || 0;
                amountAfterDisc = Number(grsAmt) - Number(discAmt);
                rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sos_amount_after_disc',
                    value: amountAfterDisc
                });
            }

            if (percentage) {
                let taxRate = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'taxrate1'
                }) || 0;

                const chargeAmount = (percentage * amountAfterDisc) / 100;
                const amountAfterCharge = amountAfterDisc - chargeAmount;
                const amountAfterChargeExtax = amountAfterCharge / (1 + (taxRate/100));

                rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sos_charge_amount',
                    value: chargeAmount
                });
                rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sos_amount_after_charge',
                    value: amountAfterCharge
                });
                rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sos_amount_af_char_ex_tax',
                    value: amountAfterChargeExtax
                });
            }

            return true; // lanjutkan commit line
        } catch (e) {
            console.log('validateLine error', e);
            return true;
        }
    }

    return {
        validateLine: validateLine
    };
});
