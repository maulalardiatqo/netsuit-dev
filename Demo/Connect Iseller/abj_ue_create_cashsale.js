/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error'], (record, log, error) => {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            try {
                log.debug('Triggered');
                const newRecord = context.newRecord;
                const idIsell = newRecord.id;
                log.debug('idIsell', idIsell);

                // Ambil data dari record custom
                const dateRec = newRecord.getValue('custrecord_cs_date');
                const customer = newRecord.getValue('custrecord_cs_customer');
                const memo = newRecord.getValue('custrecord_cs_memo');
                const subsidiary = newRecord.getValue('custrecord_cs_subsidiaries');
                const location = newRecord.getValue('custrecord_cs_location');
                const salesChanel = newRecord.getValue('custrecord_cs_sales_channel');
                const memoIseller = newRecord.getValue('custrecord_cs_memo');

                const allDataItem = [];
                const cekItem = newRecord.getLineCount({ sublistId: 'recmachcustrecord_csd_id' });

                if (cekItem > 0) {
                    for (let i = 0; i < cekItem; i++) {
                        const item = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_item',
                            line: i
                        });
                        const qty = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_qty',
                            line: i
                        });
                        const rate = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_rate',
                            line: i
                        });
                        const taxCode = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_tax_code',
                            line: i
                        });
                        const unit = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_unit',
                            line: i
                        });
                        const amount = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_amount',
                            line: i
                        });
                        const description = newRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_description',
                            line : i
                        })

                        allDataItem.push({ item, qty, rate, taxCode, unit, amount, description });
                    }
                }

                let idSuccesCreate = null;
                let errorMessage = null;

                try {
                    const cashSale = record.create({
                        type: record.Type.CASH_SALE,
                        isDynamic: true
                    });

                    cashSale.setValue({ fieldId: 'entity', value: customer });
                    cashSale.setValue({ fieldId: 'memo', value: memoIseller });
                    cashSale.setValue({ fieldId: 'trandate', value: dateRec });
                    cashSale.setValue({ fieldId: 'subsidiary', value: subsidiary });
                    cashSale.setValue({ fieldId: 'location', value: location });
                    cashSale.setValue({ fieldId: 'custbody_abj_cashsale_cust_rec', value: idIsell });
                    cashSale.setValue({ fieldId: 'custbody_csegafa_channel', value: salesChanel });
                    cashSale.setValue({fieldId: 'account', value : 423})
                    var totalAmount = 0
                    allDataItem.forEach((data) => {
                        cashSale.selectNewLine({ sublistId: 'item' });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: data.item });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: data.qty });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: data.rate });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: data.taxCode });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: data.amount });
                        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: data.description });
                        totalAmount += Number(data.amount)
                        cashSale.commitLine({ sublistId: 'item' });
                    });

                    idSuccesCreate = cashSale.save();
                    log.debug('Cash Sale Created', `Cash Sale ID: ${idSuccesCreate}`);
                } catch (e) {
                    log.error('Error Creating Cash Sale', e.message);
                    errorMessage = e.message;
                }

                // Update record custom
                const recCustRec = record.load({
                    type: 'customrecord_cs_iseller',
                    id: idIsell,
                    isDynamic: true,
                });

                if (idSuccesCreate) {
                    recCustRec.setValue({ fieldId: 'custrecord_cs_transaction_no', value: idSuccesCreate });
                    recCustRec.setValue({ fieldId: 'custrecord_cs_status', value: 'Success' });
                } else {
                    recCustRec.setValue({ fieldId: 'custrecord_cs_status', value: 'Error' });
                    recCustRec.setValue({ fieldId: 'custrecord_cs_memo_iseller', value: errorMessage || 'Unknown error during Cash Sale creation.' });
                }

                const saveRec = recCustRec.save();
                log.debug('Record Updated', saveRec);
            } catch (e) {
                log.error('Unexpected Error', e.message);
            }
        }
    }
    return {
        afterSubmit
    };
});
