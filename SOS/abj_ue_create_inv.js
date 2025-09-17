/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const newRecord = context.newRecord;
                const transactionType = newRecord.getValue({ fieldId: 'custbody_sos_transaction_types' });
                const dateTrans = newRecord.getValue('trandate')
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

                const salesOrder = record.load({
                    type: record.Type.SALES_ORDER,
                    id: salesOrderId,
                    isDynamic: false
                });

                let discMap = {};
                let taxToSet = '';
                let totalDiscAmount = 0;

                const soLineCount = salesOrder.getLineCount({ sublistId: 'item' });
                for (let i = 0; i < soLineCount; i++) {
                    const itemId = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

                    if (fulfilledItems[itemId]) {
                        const discAmount = parseFloat(salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sos_disc_amount',
                            line: i
                        })) || 0;

                        discMap[itemId] = discAmount;
                        totalDiscAmount += discAmount;

                        const taxRate = salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        });
                        const taxCode = salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: i
                        });

                        const rateNum = parseFloat((taxRate || '').toString().replace('%', '')) || 0;
                        if (rateNum !== 0 && !taxToSet) {
                            taxToSet = taxCode;
                        }
                    }
                }

                if (totalDiscAmount > 0) {
                    totalDiscAmount = -totalDiscAmount;
                }

                const invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });
                log.debug('dateTrans', dateTrans)
                invoiceRecord.setValue({ fieldId: 'customform', value: '132' });
                invoiceRecord.setValue({ fieldId: 'custbody_sos_transaction_types', value: '2' });
                invoiceRecord.setValue({ fieldId: 'approvalstatus', value: '2' });
                invoiceRecord.setValue({ fieldId: 'trandate', value : dateTrans})

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
