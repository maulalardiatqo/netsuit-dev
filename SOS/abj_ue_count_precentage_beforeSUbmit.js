/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function beforeSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const rec = context.newRecord;

                log.debug('triggered');
                const transactionType = rec.getValue({ fieldId: 'custbody_sos_transaction_types' });
                const locationHeader = rec.getValue({ fieldId: 'location' });
                const source = rec.getValue('source')
                log.debug('source', source)
                const sbu = rec.getValue({ fieldId: 'class' });
                
                log.debug('transactionType', transactionType);
                if (transactionType !== '3' && transactionType !== '12') return;

                var lineCount = rec.getLineCount({ sublistId: 'item' });

                // Loop dari bawah ke atas untuk removeLine
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
                    let percentage = parseFloat(
                        rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_sis_percentage',
                            line: i
                        })
                    ) || 0;

                    var amountAfterDisc;
                    var discountAmountAfter = parseFloat(
                        rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_after_disc',
                            line: i
                        })
                    ) || 0;
                    log.debug('discountAmountAfter', discountAmountAfter)
                     var amount = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        }) || 0;
                        
                        var rate = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        }) || 0;
                         var tax1amt = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'tax1amt',
                            line: i
                        }) || 0;
                        var taxrate1 = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        }) || 0;
                        var quantity = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }) || 0;
                        var grsAmt = 0
                        if(source == 'CSV'){
                            var custRate = rec.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol_sos_custom_rate',
                                line : i,
                            }) || 0
                            grsAmt = Number(amount) + Number(taxrate1)
                        }else{
                            grsAmt = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                line: i
                            }) || 0;
                        }
                        
                        log.debug('data line untuk calculate', {grsAmt : grsAmt, amount : amount, rate : rate, tax1amt : tax1amt, taxrate1 : taxrate1, quantity : quantity});
                        
                    if (discountAmountAfter == 0) {
                        var discAmt = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_disc_amount',
                            line: i
                        }) || 0;
                        log.debug('discAmt', discAmt);
                       
                        amountAfterDisc = Number(grsAmt) - Number(discAmt);

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_after_disc',
                            line: i,
                            value: amountAfterDisc
                        });
                    } else {
                        amountAfterDisc = discountAmountAfter;
                    }
                    
                    log.debug('amountAfterDisc', amountAfterDisc);
                    
                    if (percentage) {
                        var taxRate = Number(
                            rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxrate1',
                                line: i
                            })
                        ) || 0;
                        
                        var discHeader1amt = parseFloat(rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_disc_header1_amount',
                            line: i
                        })) || 0;
                        log.debug('percentage', percentage)
                        log.debug('discHeader1amt', discHeader1amt);
                        
                        const chargeAmount = (percentage * (amountAfterDisc - discHeader1amt)) / 100;
                        log.debug('chargeAmount', { 
                            chargeAmount: chargeAmount, 
                            percentage: percentage, 
                            amountAfterDisc: amountAfterDisc, 
                            discHeader1amt: discHeader1amt 
                        });
                        
                        const amountAfterCharge = amountAfterDisc - chargeAmount - discHeader1amt;
                        const amountAfterChargeExtax = taxRate ? amountAfterCharge / (1 + taxRate / 100) : amountAfterCharge;

                        totalChargeAmount += chargeAmount;

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_charge_amount',
                            line: i,
                            value: chargeAmount
                        });

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_after_charge',
                            line: i,
                            value: amountAfterCharge
                        });

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_amount_af_char_ex_tax',
                            line: i,
                            value: amountAfterChargeExtax
                        });

                        if (taxRate) {
                            taxCode = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i
                            });
                        }
                    }
                }

                log.debug('totalChargeAMount', totalChargeAmount);
                if (totalChargeAmount > 0) {
                    totalChargeAmount = totalChargeAmount * -1;
                    log.debug('totalChargeAMount', totalChargeAmount);
                    
                    // Mendapatkan index dari baris baru (ujung paling bawah)
                    var newLineIndex = rec.getLineCount({ sublistId: 'item' });

                    // Set nilai langsung ke index baris baru tersebut
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'item', line: newLineIndex, value: '331983' });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'price', line: newLineIndex, value: -1 });
                    
                    if (taxCode) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: newLineIndex, value: taxCode });
                    }
                    
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: newLineIndex, value: totalChargeAmount });
                    
                    if (locationHeader) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'location', line: newLineIndex, value: locationHeader });
                    }
                    
                    if (sbu) {
                        log.debug('sbu', sbu);
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'class', line: newLineIndex, value: sbu });
                    }
                }
                // Hapus rec.save() karena otomatis disimpan oleh proses beforeSubmit
            }
        } catch (e) {
            log.debug('error', e);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});