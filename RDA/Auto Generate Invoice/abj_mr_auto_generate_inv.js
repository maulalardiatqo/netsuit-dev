/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    // SB : 
    // const SAVED_SEARCH_ID = 'customsearch1529';

    // Prod : 
    const SAVED_SEARCH_ID = 'customsearch1658';

    function parseToUTCDate(dateStr) {
       try {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
        } catch (e) {
            log.error('Error parseToLocalDate', e);
            return null;
        }
    }
    const getInputData = () => {
        try {
            const results = search.load({ id: SAVED_SEARCH_ID });

            return results;
        } catch (e) {
            log.error('Error Load Saved Search', e);
            return [];
        }
    };

    const map = (context) => {
        try {
            function getValue(values, ...possibleKeys) {
                for (let key of possibleKeys) {
                    if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
                        const val = values[key];
                        if (Array.isArray(val)) {
                            return val[0]?.value || val[0]?.text || null;
                        }
                        if (typeof val === 'object' && val.value !== undefined) {
                            return val.value;
                        }
                        return val;
                    }
                }
                return null;
            }

            const result = JSON.parse(context.value);
            const values = result.values;
            log.debug('result', result);
            const fulfillmentId = getValue(values, 'internalid');
            const soId = getValue(values, 'internalid.appliedToTransaction', 'appliedToTransaction.internalid');
            const disc1 = getValue(values, 'custcol_rda_disc1_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc1_');
            const disc2 = getValue(values, 'custcol_rda_disc2_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc2_');
            const disc3 = getValue(values, 'custcol_rda_disc3_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc3_');
            const disc4 = getValue(values, 'custcol_rda_disc4_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc4_');
            const disc5 = getValue(values, 'custcol_rda_disc5_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc5_');
            const disc6 = getValue(values, 'custcol_rda_disc6_.appliedToTransaction', 'appliedToTransaction.custcol_rda_disc6_');
            const itemId = getValue(values, 'internalid.item', 'item.internalid');
            const dateTrans = getValue(values, 'trandate');
            const qty = Number(getValue(values, 'quantity') || 0);
            const qty1 = Number(getValue(values, 'custcol_rda_quantity_1') || 0);
            const qty2 = Number(getValue(values, 'custcol_rda_quantity_2') || 0);
            const qty3 = Number(getValue(values, 'custcol_rda_quantity_3') || 0);
            const trandate = getValue(values, 'trandate');
            const location = getValue(values, 'location');
            const lineIdentifier =  getValue(values, 'line.appliedToTransaction', 'appliedToTransaction.line');

            log.debug('data search', {fulfillmentId : fulfillmentId, soId: soId, itemId : itemId, qty : qty, qty1 : qty1, qty2 : qty2, qty3 : qty3, disc1 : disc1, disc2 : disc2, disc3 : disc3, disc4 : disc4, disc5 :disc5, disc6 : disc6, location : location, lineIdentifier : lineIdentifier, trandate : trandate})

            if (!fulfillmentId || !soId || !itemId || !qty || !location || !lineIdentifier || !trandate) {
                log.error('Data tidak lengkap', result);
                return;
            }
            context.write({
                key: fulfillmentId,
                value: { soId, itemId, qty, location, lineIdentifier, qty1, qty2, qty3, disc1, disc2, disc3, disc4, disc5, disc6, trandate }
            });

        } catch (e) {
            log.error('Map Error', e);
        }
    };
    const reduce = (context) => {
        const fulfillmentId = context.key;
        const linesData = context.values.map(v => JSON.parse(v));
        const soId = linesData[0]?.soId;
        const location = linesData[0]?.location
        const lineIdentifier = linesData[0]?.lineIdentifier
        const trandate = linesData[0]?.trandate
        const trandateConvert = parseToUTCDate(trandate)
        log.debug('trandateConvert', trandateConvert)

        try {
            log.audit(`Proses Fulfillment ID: ${fulfillmentId}`, `SO ID: ${soId}, Total line: ${linesData.length}`);
            const adaQtyMinus = linesData.some(ld => ld.qty < 0);
            if (adaQtyMinus) {
                log.audit(`Skip Fulfillment ID ${fulfillmentId}`, `Dilewati karena ada qty negatif`);
                return; // tidak diproses lebih lanjut
            }
            const invoiceRec = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: soId,
                toType: record.Type.INVOICE,
                isDynamic: true
            });
            invoiceRec.setValue({
                fieldId : 'customform',
                value : '205'
            })
            invoiceRec.setValue({
                fieldId : 'location',
                value : location
            })
            invoiceRec.setValue({
                fieldId : 'trandate',
                value : trandateConvert
            })
            invoiceRec.setValue({
                fieldId : 'custbody_abj_rda_if_number_inv_trans',
                value : fulfillmentId
            })
            const lineCount = invoiceRec.getLineCount({ sublistId: 'item' });
            log.debug('lineCount', lineCount);
            for (let i = lineCount - 1; i >= 0; i--) {
                const currentItem = invoiceRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                const amount = invoiceRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });
                log.debug('amount', amount)
                const lineIdentifierInv = invoiceRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'orderline',
                    line: i
                });

                log.debug('lineIdentifierInv', lineIdentifierInv);

                const match = linesData.find(ld => 
                    String(ld.itemId) === String(currentItem) &&
                    String(ld.lineIdentifier) === String(lineIdentifierInv)
                );
                const protectedItems = [];
                const isProtected = protectedItems.includes(Number(currentItem));

                if (!match && !isProtected) {
                    invoiceRec.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                    continue;
                }

                if (match) {
                    invoiceRec.selectLine({ sublistId: 'item', line: i });
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: match.qty,
                        ignoreMandatoryFields : true
                    });
                    var cekAmount = invoiceRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    })
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_quantity_1',
                        value: match.qty1,
                        ignoreMandatoryFields : true
                    });
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_quantity_2',
                        value: match.qty2,
                        ignoreMandatoryFields : true
                    });
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_quantity_3',
                        value: match.qty3,
                        ignoreMandatoryFields : true
                    });
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc1_',
                        value: match.disc1,
                        ignoreMandatoryFields : true
                    });
                    var cekDisc1 = match.disc1
                    if(cekDisc1 && cekDisc1 != 0){
                        var amountDisc1 = (cekDisc1 / 100) * cekAmount
                        log.debug('amountDisc1', amountDisc1)
                        var remainamt1 = cekAmount - amountDisc1
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt1',
                            line: i,
                            value: remainamt1
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc1_amount',
                            value: amountDisc1,
                            ignoreMandatoryFields : true
                        });
                        cekAmount = cekAmount - amountDisc1
                    }
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc2_',
                        value: match.disc2,
                        ignoreMandatoryFields : true
                    });
                    var cekDisc2 = match.disc2
                    if(cekDisc2 && cekDisc2 != 0){
                        var amountDisc2 = (cekDisc2 / 100) * cekAmount
                        log.debug('amountDisc2', amountDisc2)
                        var remainamt2 = cekAmount - amountDisc2
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt2',
                            line: i,
                            value: remainamt2
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc2_amount',
                            value: amountDisc2,
                            ignoreMandatoryFields : true
                        });
                        cekAmount = cekAmount - amountDisc2
                    }
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc3_',
                        value: match.disc3,
                        ignoreMandatoryFields : true
                    });
                    var cekDsic3 = match.disc3
                    if(cekDsic3 && cekDsic3 != 0){
                        var amountDisc3 = (cekDsic3 / 100) * cekAmount
                        log.debug('amountDisc3', amountDisc3)
                        var remainamt3 = cekAmount - amountDisc3
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt3',
                            line: i,
                            value: remainamt3
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc3_amount',
                            value: amountDisc3,
                            ignoreMandatoryFields : true
                        });
                        cekAmount = cekAmount - amountDisc3
                    }
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc4_',
                        value: match.disc4,
                        ignoreMandatoryFields : true
                    });
                    var cekDisc4 = match.disc4
                    if(cekDisc4 && cekDisc4 != 0){
                        var amountDisc4 = (cekDisc4 / 100) * cekAmount
                        log.debug('amountDisc4', amountDisc4)
                        var remainamt4 = cekAmount - amountDisc3
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt4',
                            line: i,
                            value: remainamt4
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc4_amount',
                            value: amountDisc4,
                            ignoreMandatoryFields : true
                        });
                        cekAmount = cekAmount - amountDisc4
                    }
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc5_',
                        value: match.disc5,
                        ignoreMandatoryFields : true
                    });
                    var cekDisc5 = match.disc5
                    if(cekDisc5 && cekDisc5 != 0){
                        var amountDisc5 = (cekDisc5 / 100) * cekAmount
                        log.debug('amountDisc5', amountDisc5)
                        var remainamt5 = cekAmount - amountDisc5
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt5',
                            line: i,
                            value: remainamt5
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc5_amount',
                            value: amountDisc5,
                            ignoreMandatoryFields : true
                        });
                        cekAmount = cekAmount - amountDisc5
                    }
                    invoiceRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_disc6_',
                        value: match.disc6,
                        ignoreMandatoryFields : true
                    });
                    var cekDisc6 = match.disc6
                    if(cekDisc6 && cekDisc6 != 0){
                        var amountDisc6 = (cekDisc6 / 100) * cekAmount
                        log.debug('amountDisc6', amountDisc6)
                        var remainamt6 = cekAmount - amountDisc6
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_remain_amt6',
                            line: i,
                            value: remainamt6
                        });
                        invoiceRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_disc6_amount',
                            value: amountDisc6,
                            ignoreMandatoryFields : true
                        });
                    }
                    invoiceRec.commitLine({ sublistId: 'item' });
                }
            }


            const invId = invoiceRec.save({ enableSourcing: true, ignoreMandatoryFields: false });
            log.audit(`Invoice Created`, `Invoice ID: ${invId} dari Fulfillment ID: ${fulfillmentId} / SO ID: ${soId}`);
            if (invId) {
                record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: fulfillmentId,
                    values: {
                        custbody_rda_invoice_number: invId
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.audit('Item Fulfillment Updated', `Fulfillment ID ${fulfillmentId} diupdate dengan Invoice ID ${invId}`);
            }

        } catch (e) {
            log.error(`Gagal create invoice dari Fulfillment ${fulfillmentId}`, e);
        }
    };

    const summarize = (summary) => {
        log.audit('Summary Time', `Total Seconds: ${summary.seconds}`);
        log.audit('Summary Usage', `Total Usage: ${summary.usage}`);
        log.audit('Summary Yields', `Total Yields: ${summary.yields}`);

        if (summary.inputSummary?.errors) {
            summary.inputSummary.errors.iterator().each((key, err) => {
                log.error(`Input Error for Key: ${key}`, err);
                return true;
            });
        }

        if (summary.mapSummary?.errors) {
            summary.mapSummary.errors.iterator().each((key, err) => {
                log.error(`Map Error for Key: ${key}`, err);
                return true;
            });
        }

        if (summary.reduceSummary?.errors) {
            summary.reduceSummary.errors.iterator().each((key, err) => {
                log.error(`Reduce Error for Key: ${key}`, err);
                return true;
            });
        }
    };

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
