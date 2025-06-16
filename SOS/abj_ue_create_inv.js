/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const newRecord = context.newRecord;
                const itemFulfillmentId = newRecord.id;

                const transactionType = newRecord.getValue({ fieldId: 'custbody_sos_transaction_types' });

                if (parseInt(transactionType) !== 2) {
                    log.debug('SKIP Transform', 'custbody_sos_transaction_types != 2');
                    return;
                }

                const salesOrderId = newRecord.getValue({ fieldId: 'createdfrom' });
                if (!salesOrderId) {
                    log.error('Missing Sales Order', 'Item Fulfillment has no createdfrom reference');
                    return;
                }

                let fulfilledItems = {}; 
                const lineCount = newRecord.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    const itemId = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    const quantity = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

                    if (itemId && quantity > 0) {
                        fulfilledItems[itemId] = quantity;
                    }
                }

                if (Object.keys(fulfilledItems).length === 0) {
                    log.error('No Fulfilled Items', 'Skipping invoice because no fulfilled items found.');
                    return;
                }

                const invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });
                invoiceRecord.setValue({
                    fieldId : 'customform',
                    value : '132'
                })
                invoiceRecord.setValue({
                    fieldId : 'custbody_sos_transaction_types',
                    value : '2'
                })
                const invoiceLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });

                for (let i = invoiceLineCount - 1; i >= 0; i--) {
                    invoiceRecord.selectLine({ sublistId: 'item', line: i });

                    const itemId = invoiceRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });

                    if (!fulfilledItems[itemId]) {
                        invoiceRecord.removeLine({ sublistId: 'item', line: i });
                    } else {
                        invoiceRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: fulfilledItems[itemId]
                        });
                        invoiceRecord.commitLine({ sublistId: 'item' });
                    }
                }

                const invoiceId = invoiceRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });

                log.audit('Invoice Created', `Invoice ID ${invoiceId} created from Sales Order ${salesOrderId}, only for fulfilled items.`);
            }
        } catch (e) {
            log.error({
                title: 'Error creating invoice from fulfillment',
                details: e.message || JSON.stringify(e)
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
