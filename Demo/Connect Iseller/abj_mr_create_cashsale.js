/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/task'], function(record, search, log, runtime, task) {

    function getInputData(context) {
        var currentScript = runtime.getCurrentScript();
        var dataToProcess = currentScript.getParameter({ name: 'custscript_input_data' });
        log.debug('dataToProcess', dataToProcess)
        return [
            {
                dataToProcess : dataToProcess,
                cekData : 'cek data'
            }
        ]
        
    }

   function map(context){
        var infoData = JSON.parse(context.value); 
        var data = JSON.parse(infoData.dataToProcess);
        log.debug('data', data)
        var uniqueKey = data.order_reference;  
        log.debug('uniqueKey', uniqueKey)

        var isLocked = checkLock(uniqueKey);

        if (isLocked) {
            log.audit('Data is locked, skipping', uniqueKey);
            return; // Data terkunci, lewati proses ini
        }

        // Lock data untuk proses ini
        lockData(uniqueKey);

        // Jika data belum terkunci, lanjutkan ke Reduce stage
        context.write({
            key: uniqueKey,
            value: data
        });
   }

    function reduce(context) {
        function convertToNetSuiteDate(dateTimeString) {
            if (!dateTimeString) {
                throw new Error("Invalid date string");
            }
        
            const dateObject = new Date(dateTimeString);
        
            // Validate the created date
            if (isNaN(dateObject)) {
                throw new Error("Invalid date format");
            }
        
            return dateObject;
        }
        try {
            var uniqueKey = context.key;
            var dataRek = context.values.map(JSON.parse);
            log.debug('dataRek', dataRek)
            dataRek.forEach((requestBody) => {
                var customRecord = record.create({
                    type: 'customrecord_cs_iseller',
                    isDynamic: true,
                });
                var exIdCust = requestBody.external_customer_id
                log.debug('exIdCust', exIdCust)
                if(exIdCust){
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters: [
                            ["entityid", "is", exIdCust]
                        ],
                        columns: [
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                    });
                     
                    var results = customerSearchObj.run().getRange({start: 0, end: 1});
                    if (results.length > 0) {
                        var internalId = results[0].getValue({name: "internalid"});
                        log.debug('internalId cust', internalId)
                        customRecord.setValue({
                            fieldId: "custrecord_cs_customer",
                            value: internalId
                        });
                    } else {
                        customRecord.setValue({
                            fieldId: "custrecord_cs_customer",
                            value: 2922
                        });
                    }
                }else{
                    customRecord.setValue({
                        fieldId: "custrecord_cs_customer",
                        value: 2922
                    });
                }
                var totalAmount = requestBody.total_amount
                var allTransaction = [];
                var cekTransaction = requestBody.transactions;
                log.debug('cekTransaction', cekTransaction);
                cekTransaction.forEach(transaction => {
                    const paymentTypeName = transaction.gateway;
                    const amount = transaction.amount;
                    allTransaction.push({
                        paymentTypeName: paymentTypeName,
                        amount : amount
                    })
                });
                
                log.debug('allTransaction', allTransaction)
                
                var dateIsel = requestBody.order_date
                log.debug('dateIsel', dateIsel)
                var dateNs = convertToNetSuiteDate(dateIsel);
                log.debug('dateNs', dateNs)
                customRecord.setValue({
                    fieldId: "custrecord_cs_date",
                    value: dateNs
                });
                
                customRecord.setValue({
                    fieldId: "name",
                    value: uniqueKey
                });
                // customRecord.setValue({
                //     fieldId: "custrecord_cs_order_id",
                //     value: requestBody.order_id
                // });
                customRecord.setValue({
                    fieldId: "custrecord_cs_memo",
                    value: requestBody.notes || ""
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_sales_channel",
                    value: 3
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_subsidiaries",
                    value: 7
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_location",
                    value: 130
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_payment_status",
                    value: requestBody.payment_status || ""
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_fulfillment_status",
                    value: requestBody.fulfillment_status || ""
                });
                var discountTotal = requestBody.total_discount_amount
                log.debug('discountTotal', discountTotal)
                // Process order details
                var allDiscount = []
                var errMsg = ''
                var commitedLine = 0
                var amountItem = 0
                var allPromotion = []
                var totalAmountPromotion = 0
                if (requestBody.order_details && Array.isArray(requestBody.order_details)) {
                    requestBody.order_details.forEach((detail) => {
                        customRecord.selectNewLine({ sublistId: 'recmachcustrecord_csd_id' });
    
                        var upcCode = detail.sku;
                        var idItem;
                        var discountLine = detail.discounts
                        log.debug('discountLine', discountLine)
                        // Search for item by UPC Code
                        var itemSearchObj = search.create({
                            type: "item",
                            filters: [["internalid", "is", upcCode]],
                            columns: ["internalid", "upccode"]
                        });
                        var searchResults = itemSearchObj.run().getRange({ start: 0, end: 1 });
    
                        if (searchResults && searchResults.length > 0) {
                            var result = searchResults[0];
                            idItem = result.getValue({ name: "internalid" });
                            log.debug("Item Found", `Internal ID: ${idItem}, UPC Code: ${upcCode}`);
                        } else {
                            errMsg = 'Item Not Found In Netsuite in SKU' + upcCode
                        }
    
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_item',
                            value: idItem || ''
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_qty',
                            value: detail.quantity
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_unit',
                            value: 1
                        }); 
                        var cekPromotion = detail.promotions;
                        log.debug('cekPromotion', cekPromotion)
                        var promName = ''
                        var amountPromotion = 0
                        if(cekPromotion.length > 0){
                            log.debug('masuk cekPromotion')
                            cekPromotion.forEach((prom =>{
                                var nameProm = prom.promotion_name
                                var amountProm = prom.promotion_amount
                                log.debug('amountProm', amountProm)
                                promName = nameProm
                                amountPromotion += amountProm
                                
                            }))
                        }
                        log.debug('amountPromotion', amountPromotion)
                        totalAmountPromotion += Number(amountPromotion)
                        log.debug('promName', promName)
                        allPromotion.push(promName)
                        var rate = 0
                        var amountTotal = 0
    
                        // if(amountPromotion > 0){
                        //     rate = Number(detail.base_price) - Number(amountPromotion)
                        //     amountTotal = (Number(detail.base_price) * Number(detail.quantity)) - amountPromotion
                        //     customRecord.setCurrentSublistValue({
                        //         sublistId: 'recmachcustrecord_csd_id',
                        //         fieldId: 'custrecord_csd_description',
                        //         value: promName || ''
                        //     });
                            
                        // }else{
                            
                            
                        // }
                        rate = Number(detail.base_price)
                        amountTotal = Number(detail.base_price) * Number(detail.quantity)
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_rate',
                            value: rate
                        });
                        
                        
                        amountItem += amountTotal
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_amount',
                            value: amountTotal
                        });
                        
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_tax_code',
                            value: 2224
                        });
                        allDiscount.push({
                            discountLine : discountLine
                        })
    
                        customRecord.commitLine({ sublistId: 'recmachcustrecord_csd_id' });
                        commitedLine = commitedLine + 1
                    });
                } else {
                    log.error('Order Details Missing or Invalid', 'No order details found in requestBody');
                }
    
                log.debug('allDiscount', allDiscount)
                log.debug('allDiscountlength', allDiscount.length)
                log.debug('commitedLine', commitedLine)
                var realDiscount = Number(amountItem) - Number(totalAmount) - Number(totalAmountPromotion)|| 0
                log.debug('realDiscount', realDiscount);
                    var discountDesc = '';
                    var totalDiscAmount = 0;
                    var uniqueDiscountNames = new Set(); 
    
                    allDiscount.forEach(function(discountItem) {
                        if (Array.isArray(discountItem.discountLine)) {
                            discountItem.discountLine.forEach(function(line) {
                                var discountName = line.discount_name;
                                var discountAmount = line.discount_amount;
    
                                totalDiscAmount += discountAmount;
    
                                if (!uniqueDiscountNames.has(discountName)) {
                                    uniqueDiscountNames.add(discountName);
                                }
                                log.debug('Discount Name', discountName);
                                log.debug('Discount Amount', discountAmount);
                            });
                        }
                    });
                    discountDesc = Array.from(uniqueDiscountNames).join(', ');
                    log.debug('discountDesc', discountDesc);
                    log.debug('totalDiscAmount', totalDiscAmount)
                    var cekDiscountAmountHeader = requestBody.total_discount_amount;
                    log.debug('cekDiscountAmountHeader', cekDiscountAmountHeader)
                    if(cekDiscountAmountHeader > 0){
                        if(realDiscount > 0){
                            customRecord.selectNewLine({ sublistId: 'recmachcustrecord_csd_id' });
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_item',
                                value: 2818
                            });
                            
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_qty',
                                value: 1
                            });
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_unit',
                                value: 1
                            }); 
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_description',
                                value: discountDesc
                            });
                            
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_rate',
                                value: -(realDiscount)
                            });
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_amount',
                                value: -(realDiscount)
                            });
                            
                            customRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_csd_id',
                                fieldId: 'custrecord_csd_tax_code',
                                value: 2224
                            });
                            customRecord.commitLine({ sublistId: 'recmachcustrecord_csd_id' });
                        }
                    }
                    log.debug('totalAmountPromotion', totalAmountPromotion)
                    if(totalAmountPromotion > 0){
                        log.debug('masuk promotion')
                        customRecord.selectNewLine({ sublistId: 'recmachcustrecord_csd_id' });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_item',
                            value: 3219
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_qty',
                            value: 1
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_unit',
                            value: 1
                        }); 
                        log.debug('allPromotion', allPromotion)
                        const promString = allPromotion.join(', ');
                        log.debug('promstring', promString)
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_description',
                            value: promString
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_rate',
                            value: -(totalAmountPromotion)
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_amount',
                            value: -(totalAmountPromotion)
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_tax_code',
                            value: 2224
                        });
                        customRecord.commitLine({ sublistId: 'recmachcustrecord_csd_id' });
                    }
                allTransaction.forEach(trans=>{
                    var paymentMethon = trans.paymentTypeName
                    var amountPayment = trans.amount
                    var itemId 
                    if(paymentMethon == 'cash'){
                        itemId = 2812
                    }else if(paymentMethon == 'external_credit'){
                        itemId = 2828
                    }else{
                        itemId = 2829
                    }
                    customRecord.selectNewLine({ sublistId: 'recmachcustrecord_csd_id' });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_item',
                            value: itemId
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_qty',
                            value: 1
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_unit',
                            value: 1
                        }); 
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_description',
                            value: 'Payment Method' + paymentMethon
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_rate',
                            value: -(amountPayment)
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_amount',
                            value: -(amountPayment)
                        });
                        
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_tax_code',
                            value: 2224
                        });
                        customRecord.commitLine({ sublistId: 'recmachcustrecord_csd_id' });
                })
                customRecord.setValue({
                    fieldId : 'custrecord_cs_memo_iseller',
                    value : errMsg
                })
                var saveCustRec = customRecord.save();
                log.debug('saveCustRec', saveCustRec)
            })
            
            unlockData(uniqueKey);

        } catch (e) {
            log.error('Error in reduce stage', e);
            unlockData(context.key); // Pastikan untuk membuka kunci jika terjadi error
        }
    }

    function checkLock(uniqueKey) {
        var lockSearch = search.create({
            type: 'customrecord_data_lock', 
            filters: [
                ['custrecord_lock_key', 'is', uniqueKey] 
            ],
            columns: ['internalid']
        });

        var searchResult = lockSearch.run().getRange({ start: 0, end: 1 });
        return searchResult.length > 0; // Jika ditemukan, berarti terkunci
    }

    function lockData(uniqueKey) {
        // Buat Custom Record Lock untuk mengunci data
        var lockRecord = record.create({
            type: 'customrecord_data_lock'
        });
        lockRecord.setValue({ fieldId: 'custrecord_lock_key', value: uniqueKey });
        lockRecord.setValue({ fieldId: 'custrecord_lock_status', value: 'locked' }); // Status terkunci
        lockRecord.save();
    }

    function unlockData(uniqueKey) {
        // Hapus Custom Record Lock setelah selesai atau jika error
        var lockSearch = search.create({
            type: 'customrecord_data_lock', // Custom record untuk lock
            filters: [
                ['custrecord_lock_key', 'is', uniqueKey]
            ],
            columns: ['internalid']
        });

        var lockResult = lockSearch.run().getRange({ start: 0, end: 1 });
        if (lockResult.length > 0) {
            record.delete({
                type: 'customrecord_data_lock',
                id: lockResult[0].id
            });
        }
    }

    function summarize(summary) {
        summary.mapSummary.errors.iterator().each(function(key, error, executionNo) {
            log.error({
                title: 'Error with key: ' + key + ', execution number: ' + executionNo,
                details: error
            });
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
