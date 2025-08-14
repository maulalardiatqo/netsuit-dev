/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const SAVED_SEARCH_ID = 'customsearch1529';

    const getInputData = () => {
        try {
            const searchObj = search.load({ id: SAVED_SEARCH_ID });
            
            const results = [];
            let count = 0;
            
            searchObj.run().each(result => {
                results.push(result);
                count++;
                return count < 5;
            });

            return results;
        } catch (e) {
            log.error('Error Load Saved Search', e);
            return [];
        }
    };

    const map = (context) => {
        try {
            const result = JSON.parse(context.value);
            const values = result.values;
            log.debug('result', result)
            const fulfillmentId = values.internalid?.[0]?.value || null;
            const soId = values["appliedToTransaction.internalid"]?.[0]?.value || null;
            const itemId = values["item.internalid"]?.[0]?.value || null;
            const qty = Number(values.quantity || 0);
            const location = values.location?.[0]?.value || null;
            const lineIdentifier = values.custcol_rda_line_identifier?.[0]?.value || values.custcol_rda_line_identifier || null;

            log.debug('fulfillmentId', fulfillmentId);
            log.debug('soId', soId);
            log.debug('itemId', itemId);
            log.debug('qty', qty);
            log.debug('location', location);
            log.debug('lineIdentifier', lineIdentifier);

            if (!fulfillmentId || !soId || !itemId || !qty || !location || !lineIdentifier) {
                log.error('Data tidak lengkap', result);
                return;
            }
            context.write({
                key: fulfillmentId,
                value: { soId, itemId, qty, location, lineIdentifier }
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
        log.debug('location', location)

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
                fieldId : 'location',
                value : location
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
                log.debug('currentItem', currentItem)
                log.debug('amount', amount)
                const lineIdentifierInv = invoiceRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_rda_line_identifier',
                    line: i
                });

                log.debug('lineIdentifierInv', lineIdentifierInv);

                const match = linesData.find(ld => 
                    String(ld.itemId) === String(currentItem) &&
                    String(ld.lineIdentifier) === String(lineIdentifierInv)
                );

                // const protectedItems = [38, 39, 11];
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
                        value: match.qty
                    });
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
