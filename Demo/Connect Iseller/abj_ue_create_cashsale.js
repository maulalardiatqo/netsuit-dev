/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error'], (record, log, error) => {
    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE) {
            try{
                log.debug('trigerred')
                const newRecord = context.newRecord;
                var idIsell = newRecord.id
                log.debug('idIsell', idIsell)
                // Ambil data dari custrecord_cs_customer
                var dateRec = newRecord.getValue('custrecord_cs_date');
                var customer = newRecord.getValue('custrecord_cs_customer');
                var memo = newRecord.getValue('custrecord_cs_memo');
                var subsidiary = newRecord.getValue('custrecord_cs_subsidiaries');
                var location = newRecord.getValue('custrecord_cs_location');
                var salesChanel = newRecord.getValue('custrecord_cs_sales_channel');
                var memoIseller = newRecord.getValue('custrecord_cs_memo_iseller');
                var allDataItem = []
                var cekItem = newRecord.getLineCount({sublistId : 'recmachcustrecord_csd_id'});
                if(cekItem > 0){
                    for(var i = 0; i < cekItem; i++){
                        var item = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_item',
                            line : i
                        })
                        var qty = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_qty',
                            line : i
                        })
                        var rate = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_rate',
                            line : i
                        })
                        var taxCode = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_tax_code',
                            line : i
                        })
                        var Unit = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_unit',
                            line : i
                        })
                        var amount = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_csd_id',
                            fieldId : 'custrecord_csd_amount',
                            line : i
                        })
                        allDataItem.push({
                            item : item,
                            qty : qty,
                            rate : rate,
                            taxCode : taxCode,
                            Unit : Unit,
                            amount : amount
                        })
                    }
                    
                }
                // Buat Cash Sale baru
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
                allDataItem.forEach(function(data) {
                    cashSale.selectNewLine({ sublistId: 'item' });
                    log.debug('item', data.item)
                    cashSale.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: data.item 
                    });
                    log.debug('qty', data.qty)
                    cashSale.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: data.qty 
                    });
                    cashSale.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: data.rate 
                    });
                    cashSale.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: data.taxCode 
                    });
                    cashSale.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: data.amount 
                    });
                    cashSale.commitLine({ sublistId: 'item' });
    
                })
                const cashSaleId = cashSale.save();
                log.debug('Cash Sale Created', `Cash Sale ID: ${cashSaleId}`);
                var recCustRec = record.load({
                    type: 'customrecord_cs_iseller',
                    id : idIsell,
                    isDynamic: true,
                })
                if(cashSaleId){
                    recCustRec.setValue({
                        fieldId : 'custrecord_cs_transaction_no',
                        value : cashSaleId
                    });
                    recCustRec.setValue({
                        fieldId : 'custrecord_cs_status',
                        value : 'Success'
                    })
                }else{
                    recCustRec.setValue({
                        fieldId : 'custrecord_cs_status',
                        value : 'Error'
                    })
                    recCustRec.setValue({
                        fieldId : 'custrecord_cs_memo_iseller',
                        value : 'Error when create Cash Sale'
                    })
                }
                var saveRec = recCustRec.save();
                log.debug('saveRec', saveRec)
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});
