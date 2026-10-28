/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/runtime'], function (record, log, runtime) {

    // 1. Ambil Parameter dari User Event
    function getInputData() {
        try {
            const scriptObj = runtime.getCurrentScript();
            const recId = scriptObj.getParameter({ name: 'custscript_sos_rec_id' });
            const recType = scriptObj.getParameter({ name: 'custscript_sos_rec_type' });

            if (!recId || !recType) {
                log.error('Missing Params', 'No Record ID or Type provided.');
                return [];
            }

            // Return array berisi 1 object agar diproses di Map stage
            return [{
                id: recId,
                type: recType
            }];
        } catch (e) {
            log.error('Error in getInputData', e);
            return [];
        }
    }

    // 2. Proses Record dengan Retry Mechanism
    function map(context) {
        const data = JSON.parse(context.value);
        const recId = data.id;
        const recType = data.type;

        const maxRetries = 3; // Batas percobaan ulang
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            attempt++;
            try {
                log.debug(`Attempt ${attempt}`, `Processing Record ID: ${recId}`);

                // Load record versi paling terbaru di database
                const rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: false
                });

                const transactionType = rec.getValue({ fieldId: 'custbody_sos_transaction_types' });
                const locationHeader = rec.getValue('location');
                const sbu = rec.getValue('class');

                if (transactionType !== '3' && transactionType !== '12') return;

                var lineCount = rec.getLineCount({ sublistId: 'item' });

                // Remove specific lines
                for (let i = lineCount - 1; i >= 0; i--) {
                    const itemId = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    if (itemId == '2062' || itemId == '331983') {
                        rec.removeLine({
                            sublistId: 'item',
                            line: i
                        });
                    }
                }

                lineCount = rec.getLineCount({ sublistId: 'item' });
                var totalChargeAmount = 0;
                var taxCode = '';

                // Calculate amounts
                for (let i = 0; i < lineCount; i++) {
                    let percentage = parseFloat(
                        rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_sis_percentage', line: i })
                    ) || 0;

                    var amountAfterDisc;
                    var discountAmountAfter = parseFloat(
                        rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_after_disc', line: i })
                    ) || 0;

                    if (discountAmountAfter == 0) {
                        var discAmt = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_disc_amount', line: i }) || 0;
                        var grsAmt = rec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i }) || 0;
                        amountAfterDisc = Number(grsAmt) - Number(discAmt);

                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_after_disc', line: i, value: amountAfterDisc });
                    } else {
                        amountAfterDisc = discountAmountAfter;
                    }

                    if (percentage) {
                        var taxRate = Number(rec.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i })) || 0;
                        var discHeader1amt = parseFloat(rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_disc_header1_amount', line: i })) || 0;

                        const chargeAmount = (percentage * (amountAfterDisc - discHeader1amt)) / 100;
                        const amountAfterCharge = amountAfterDisc - chargeAmount - discHeader1amt;
                        const amountAfterChargeExtax = taxRate ? amountAfterCharge / (1 + taxRate / 100) : amountAfterCharge;

                        totalChargeAmount += chargeAmount;

                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_charge_amount', line: i, value: Number(chargeAmount.toFixed(2)) });
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_after_charge', line: i, value: Number(amountAfterCharge.toFixed(2)) });
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sos_amount_af_char_ex_tax', line: i, value: Number(amountAfterChargeExtax.toFixed(2)) });

                        if (taxRate) {
                            taxCode = rec.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i });
                        }
                    }
                }

                // Add summary line
                if (totalChargeAmount > 0) {
                    totalChargeAmount = (totalChargeAmount * -1);
                    totalChargeAmount = Number(totalChargeAmount.toFixed(2));
                    
                    var newLineIndex = rec.getLineCount({ sublistId: 'item' });

                    rec.setSublistValue({ sublistId: 'item', fieldId: 'item', line: newLineIndex, value: '331983' });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: newLineIndex, value: 1 });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'price', line: newLineIndex, value: -1 });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: newLineIndex, value: totalChargeAmount });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'amount', line: newLineIndex, value: totalChargeAmount });
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: newLineIndex, value: totalChargeAmount });

                    if (taxCode) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: newLineIndex, value: taxCode });
                    }
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'location', line: newLineIndex, value: locationHeader });
                    if (sbu) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'class', line: newLineIndex, value: sbu });
                    }
                }

                // Save record dengan parameter pengaman
                const savedId = rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug('Success', `Record ${savedId} updated successfully on attempt ${attempt}`);
                success = true; // Berhasil save, keluar dari loop while

            } catch (e) {
                if (e.name === 'RCRD_HAS_BEEN_CHANGED' && attempt < maxRetries) {
                    log.debug('Race Condition Detected', `Record changed by another process. Retrying attempt ${attempt + 1} of ${maxRetries}...`);
                    // Biarkan loop berlanjut untuk me-load ulang record versi paling baru
                    var waitTime = new Date().getTime() + 5000;
                    while (new Date().getTime() < waitTime) {
                        // Loop kosong ini hanya untuk menghabiskan waktu tanpa memakan Usage Point
                    }
                } else {
                    log.error(`Failed on attempt ${attempt}`, e);
                    break; // Keluar dari loop jika error tipe lain atau retry sudah habis
                }
            }
        }
    }

    // 3. Tangani Error jika terjadi kegagalan
    function summarize(summary) {
        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }
        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});