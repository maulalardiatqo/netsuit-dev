/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const recType = newRec.type;
                const recId = newRec.id;

                const rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                log.debug('triggered')
                const transactionType = rec.getValue({ fieldId: 'custbody_sos_transaction_types' });
                const locationHeader = rec.getValue('location');
                const sbu = rec.getValue('class');
                if (transactionType !== '3') return;

                var lineCount = rec.getLineCount({ sublistId: 'item' });

                for (let i = lineCount - 1; i >= 0; i--) {
                    const itemId = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    if (itemId == '2062' || itemId == '331983') {
                        log.debug('Remove line', i);
                        rec.removeLine({
                            sublistId: 'item',
                            line: i
                        });
                    }
                }
                lineCount = rec.getLineCount({ sublistId: 'item' });
                var totalChargeAmount = 0;
                var taxCode = '';

                for (let i = 0; i < lineCount; i++) {

                    rec.selectLine({ sublistId: 'item', line: i });

                    let percentage = parseFloat(
                        rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_sis_percentage'
                        })
                    ) || 0;

                    var amountAfterDisc;
                    var discountAmountAfter = parseFloat(
                        rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_after_disc'
                        })
                    ) || 0;

                    if (discountAmountAfter == 0) {
                        var discAmt = rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_disc_amount'
                        }) || 0;

                        var grsAmt = rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamt'
                        }) || 0;

                        amountAfterDisc = Number(grsAmt) - Number(discAmt);

                        rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_after_disc',
                            value: amountAfterDisc
                        });
                    } else {
                        amountAfterDisc = discountAmountAfter;
                    }

                    if (percentage) {
                        var taxRate = Number(
                            rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxrate1'
                            })
                        ) || 0;

                        const chargeAmount = (percentage * amountAfterDisc) / 100;
                        const amountAfterCharge = amountAfterDisc - chargeAmount;
                        const amountAfterChargeExtax =
                            taxRate ? amountAfterCharge / (1 + taxRate / 100) : amountAfterCharge;

                        totalChargeAmount += chargeAmount;

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

                        if (taxRate) {
                            taxCode = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode'
                            });
                        }
                    }

                    rec.commitLine({ sublistId: 'item' });
}

                log.debug('totalChargeAMount', totalChargeAmount);
                if(totalChargeAmount > 0){
                    totalChargeAmount = totalChargeAmount * -1
                    log.debug('totalChargeAMount', totalChargeAmount);
                    rec.selectNewLine({ sublistId: 'item' });

                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: '331983' }); 
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1 });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxCode });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value: totalChargeAmount });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: locationHeader });
                    if(sbu){
                        log.debug('sbu', sbu)
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: sbu });
                    }
                    

                    rec.commitLine({ sublistId: 'item' });
                }
                // Simpan record hasil update
                rec.save();
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});