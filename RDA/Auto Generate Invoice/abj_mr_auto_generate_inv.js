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
                return count < 100;
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
            log.debug('result', result);

            const fulfillmentId = result.values["GROUP(internalid)"]?.[0]?.value; 
            const soId = result.values["GROUP(appliedToTransaction.internalid)"]?.[0]?.value;
            const itemId = result.values["GROUP(item.internalid)"]?.[0]?.value;
            const qty = parseFloat(result.values["MAX(quantity)"]) || 0;
            const location = result.values["GROUP(location)"]?.[0]?.value; 

            log.debug('fulfillmentId', fulfillmentId);
            log.debug('soId', soId);
            log.debug('itemId', itemId);
            log.debug('qty', qty);

            if (!fulfillmentId || !soId || !itemId) {
                log.error('Data tidak lengkap', result);
                return;
            }
            context.write({
                key: fulfillmentId,
                value: { soId, itemId, qty, location }
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
        log.debug('location', location)

        try {
            log.audit(`Proses Fulfillment ID: ${fulfillmentId}`, `SO ID: ${soId}, Total line: ${linesData.length}`);

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
                log.debug('i', i);

                const currentItem = invoiceRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                const match = linesData.find(ld => String(ld.itemId) === String(currentItem));

                if (!match) {
                    invoiceRec.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                    continue;
                }

                invoiceRec.selectLine({ sublistId: 'item', line: i });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: match.qty
                });
                invoiceRec.commitLine({ sublistId: 'item' });
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
