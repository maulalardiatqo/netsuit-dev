/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/http', 'N/record', 'N/crypto', 'N/error', 'N/search', 'N/task'], function(log, http, record, crypto, error, search, task) {

    function handleCreateRefund(context){
        try {
            var requestBody = JSON.parse(context.request.body);
            var refundRecord = record.create({
                type : "customrecord_cash_refund",
                isDynamic: true,
            });

            // customer
            refundRecord.setValue({
                fieldId: "custrecord_cr_customer",
                value: 2922
            });
            var dateIsel = requestBody.order_date
            log.debug('dateIsel', dateIsel)
            var dateNs = convertToNetSuiteDate(dateIsel);
            log.debug('dateNs', dateNs)
            // date
            refundRecord.setValue({
                fieldId: "custrecord_cr_date",
                value: dateNs
            });
            // currency
            refundRecord.setValue({
                fieldId: "custrecord_cr_currency",
                value: 1
            });
            // name
            refundRecord.setValue({
                fieldId: "name",
                value: requestBody.order_reference
            });
            // memo
            refundRecord.setValue({
                fieldId: "custrecord_cr_memo",
                value: requestBody.notes || ""
            });
            // memo iseller
            refundRecord.setValue({
                fieldId: "custrecord_cr_memo_iseller",
                value: requestBody.notes || ""
            });
            
            // subsidiary
            refundRecord.setValue({
                fieldId: "custrecord_cr_subsidiary",
                value: 7
            });
            // location
            refundRecord.setValue({
                fieldId: "custrecord_cr_location",
                value: 130
            });
            // Class
            refundRecord.setValue({
                fieldId: "custrecord_cr_class",
                value: 29
            });
            // channel
            refundRecord.setValue({
                fieldId: "custrecord_cr_channel",
                value: 3
            });
            requestBody.refund_details.forEach(detail =>{
                refundRecord.selectNewLine({ sublistId: 'recmachcustrecord_cr_id' });

                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_item',
                    value: detail.sku
                });
                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_qty',
                    value: detail.quantity_refund
                });
                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_rate',
                    value: detail.sell_price
                });
                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_tax_code',
                    value: 2224
                });
                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_unit',
                    value: 1
                });
                refundRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_cr_id',
                    fieldId: 'custrecord_crd_amount',
                    value: Number(detail.sell_price) * Number(detail.quantity_refund)
                });

                refundRecord.commitLine({ sublistId: 'recmachcustrecord_cr_id' });
            });
            refund = refundRecord.save();
            if(refund){
                log.debug('refund', refund)
            

                // Send success response
                context.response.write({
                    output: JSON.stringify({
                        status: 'success',
                        message: 'Data received and processed successfully!'
                    })
                });
            }
        } catch (error) {
           log.debug('Error Handle Create Refund', error) 
        }
    }

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

    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                var cekRefund = context.request.parameters.refund;
                log.debug('cekRefund', cekRefund)
                if(cekRefund){
                    var refund = handleCreateRefund(context);
                    return;
                }
                var requestBody = JSON.parse(context.request.body);
                var requestHeader = context.request.headers;
                if (requestBody && Object.keys(requestBody).length > 0) {
                    // Kondisi jika ada datanya
                    log.debug('Data ada', requestBody);
                    log.debug('requestHeader', requestHeader)
                    log.debug('Parsed requestBody', requestBody);
                    
                    var timestamp = requestHeader['Timestamp'];
                    var apiKey = requestHeader['APIKey'];
                    var signature = requestHeader['Signature'];
                    // Create a new custom record
                    var orderId = requestBody.order_reference
                    log.debug('orderId', orderId)
                    var dataSearch = search.create({
                        type: 'customrecord_cs_iseller',
                        filters: [
                            ['name', 'is', orderId]
                        ],
                        columns: ['internalid']
                    });
            
                    var res = dataSearch.run().getRange({ start: 0, end: 1 });
                    log.debug('res', res)
                    if (res.length > 0) {
                        log.debug("record already created");
                    }else {
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
                        cekTransaction.forEach(transaction => {
                            const paymentTypeName = transaction.gateway;
                            const amount = transaction.amount;
                            allTransaction.push({
                                paymentTypeName: paymentTypeName,
                                amount : amount
                            })
                        });
                        log.debug('cekTransaction', cekTransaction);
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
                            value: orderId
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
                                var promName = ''
                                var amountPromotion = 0
                                if(cekPromotion.length > 0){
                                    cekPromotion.forEach((prom =>{
                                        var nameProm = prom.promotion_name
                                        var amountProm = prom.promotion_amount2
                                        promName = nameProm
                                        amountPromotion += amountProm
                                        
                                    }))
                                }
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
                            
                            if(totalAmountPromotion > 0){
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
                    }
                     
                    
                } else {
                    // Kondisi jika datanya kosong
                    log.debug('Data kosong', requestBody);
                }
                
               
            } catch (e) {
                log.error('Error', e.message);
                context.response.write({
                    output: JSON.stringify({
                        status: 'error',
                        message: e.message
                    })
                });
            }
        } else {
            context.response.write({
                output: JSON.stringify({
                    status: 'error',
                    message: 'Only POST requests are accepted'
                })
            });
        }
    }

    return {
        onRequest: onRequest
    };
});
