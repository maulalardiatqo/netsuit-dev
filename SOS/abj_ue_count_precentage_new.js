/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record', 'N/task', 'N/runtime'], function (url, log, record, task, runtime) {
    function afterSubmit(context) {
        try {
            if (runtime.executionContext === runtime.ContextType.MAP_REDUCE) {
                log.debug('Skipped', 'Triggered by Map/Reduce, skipping to prevent infinite loop.');
                return;
            }

            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const recType = newRec.type;
                const recId = newRec.id;

                const initialLineCount = newRec.getLineCount({ sublistId: 'item' });
                
                if (initialLineCount > 80) {
                    log.debug('Line Count > 80', `Delegating record ${recId} to Map/Reduce Script`);
                    
                    const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_abj_mr_count_precentage', 
                        params: {
                            'custscript_sos_rec_id': recId,
                            'custscript_sos_rec_type': recType
                        }
                    });
                    const mrTaskId = mrTask.submit();
                    log.debug('Map/Reduce Task Submitted', 'Task ID: ' + mrTaskId);
                    
                    return; // Hentikan proses UE disini
                }

                // ==========================================
                // LOGIC ORIGINAL (Jika line <= 50)
                // ==========================================
                const rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                
                log.debug('triggered', 'Processing in User Event (Lines <= 50)');
                
                const transactionType = rec.getValue({ fieldId: 'custbody_sos_transaction_types' });
                const locationHeader = rec.getValue('location');
                const sbu = rec.getValue('class');
                log.debug('transactionType', transactionType);
                
                if (transactionType !== '3' && transactionType !== '12') return;

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
                        rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_sis_percentage' })
                    ) || 0;

                    var amountAfterDisc;
                    var discountAmountAfter = parseFloat(
                        rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_after_disc' })
                    ) || 0;

                    if (discountAmountAfter == 0) {
                        var discAmt = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_disc_amount' }) || 0;
                        var grsAmt = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt' }) || 0;
                        amountAfterDisc = Number(grsAmt) - Number(discAmt);

                        rec.setCurrentSublistValue({
                            sublistId: 'item', fieldId: 'custcol_sos_amount_after_disc', value: amountAfterDisc
                        });
                    } else {
                        amountAfterDisc = discountAmountAfter;
                    }
                    
                    var taxRate = Number(rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1' })) || 0;
                    var discHeader1amt = parseFloat(rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_disc_header1_amount' })) || 0;
                    log.debug('percentage', percentage)
                    log.debug('amountAfterDisc', amountAfterDisc)
                    log.debug('discHeader1amt', discHeader1amt)
                    const chargeAmount = (percentage * (amountAfterDisc - discHeader1amt)) / 100;
                    log.debug('chargeAmount', chargeAmount)
                    const amountAfterCharge = amountAfterDisc - chargeAmount - discHeader1amt;
                    const amountAfterChargeExtax = taxRate ? amountAfterCharge / (1 + taxRate / 100) : amountAfterCharge;

                    totalChargeAmount += chargeAmount;

                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_charge_amount', value: chargeAmount });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_after_charge', value: amountAfterCharge });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_af_char_ex_tax', value: amountAfterChargeExtax });

                    if (taxRate) {
                        taxCode = rec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode' });
                    }
                    
                    rec.commitLine({ sublistId: 'item' });
                }

                if(totalChargeAmount > 0){
                    totalChargeAmount = totalChargeAmount * -1;
                    rec.selectNewLine({ sublistId: 'item' });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: '331983' }); 
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1 });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxCode });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value: totalChargeAmount });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: locationHeader });
                    if(sbu){
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: sbu });
                    }
                    rec.commitLine({ sublistId: 'item' });
                }
                rec.save();
            }
        } catch(e) {
            log.error('Error in UE afterSubmit', e);
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});