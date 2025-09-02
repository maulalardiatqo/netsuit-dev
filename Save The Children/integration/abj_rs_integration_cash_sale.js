/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', 'N/search', 'N/runtime'], (record, log, error, format, search, runtime) => {
    function ensureNegative(amount) {
        const num = Number(amount) || 0;
        return num > 0 ? -num : num;
    }
    const createCashSale = (data) => {
        try {
            log.debug('data create', data)
            const createRec = record.create({
                type: "cashsale",
                isDynamic: true
            });
            createRec.setValue({
                fieldId: "entity",
                value: data.entity.internalId,
                ignoreFieldChange: false,
            });
            var dateConverted = new Date(data.tranDate);
            log.debug('dateConverted', dateConverted)
            createRec.setValue({
                fieldId: "trandate",
                value: dateConverted,
                ignoreFieldChange: false,
            });
            if(data.memo){
                createRec.setValue({
                    fieldId: "memo",
                    value: data.memo,
                    ignoreFieldChange: false,
                });
            }
            createRec.setValue({
                fieldId: "class",
                value: data.class.internalId,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                fieldId: "department",
                value: data.department.internalId,
                ignoreFieldChange: false,
            });
            if(data.sof.internalId){
                createRec.setValue({
                    fieldId: "cseg_stc_sof",
                    value: data.sof.internalId,
                    ignoreFieldChange: false,
                });
            }
            var items = data.items
            if(items.length > 0){
                for (var i = 0; i < items.length; i++) {
                    let itemID = data.items[i].item.internalId;
                    log.debug('itemID', itemID)
                    createRec.selectNewLine({ sublistId: 'item' })
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: itemID,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "pricelevels",
                        value: "-1",
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: data.items[i].itemDescription,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: data.items[i].quantity,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "taxcode",
                        value: "5",
                    });
                    createRec.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'grossamt',
                        value : data.items[i].amount
                    });
                    var amtLine = createRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
                    log.debug('amtLine', amtLine)
                    var rateSet = Number(amtLine) / Number(data.items[i].quantity);
                    log.debug('rateSet', rateSet);
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: rateSet,
                        ignoreFieldChange : true
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "class",
                        value: data.items[i].class.internalId,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "department",
                        value: data.items[i].department.internalId,
                    });
                    var sofId = data.items[i].sof.internalId
                    if(sofId){
                        createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: sofId,
                        });
                    }
                    createRec.commitLine({ sublistId: 'item' });
                    
                }
            }
            const payments = data?.payments || [];
            payments.forEach(payment => {
                var itemId = payment?.item?.internalId || null;
                var amountPayment = ensureNegative(payment.amount)
                var classId = payment.class.internalId
                var departmentId = payment.department.internalId
                log.debug('itemId', itemId);
                createRec.selectNewLine({ sublistId: 'item' })
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    value: itemId,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "pricelevels",
                    value: "-1",
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "taxcode",
                    value: "5",
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: amountPayment,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: amountPayment,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "class",
                    value: classId,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "department",
                    value: departmentId,
                });
                var sofId = data.items[i].sof.internalId
                    if(sofId){
                        createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: sofId,
                        });
                    }
                createRec.commitLine({ sublistId: 'item' });

            });
            const cashSaleId = createRec.save({ enableSourcing: true, ignoreMandatoryFields: false });
            log.debug('cashSaleId', cashSaleId)
            return {
                status: true,
                cashSaleId: cashSaleId
            };
        }catch(e){
            log.debug('error', e)
            return {
                status: false,
                message: e.message || JSON.stringify(e.message)
            }
        }
    }
    const updateCashSale = (data) =>{
        try {
            log.debug('data create', data)
            const createRec = record.create({
                type: "cashsale",
                isDynamic: true
            });
            createRec.setValue({
                fieldId: "entity",
                value: data.entity.internalId,
                ignoreFieldChange: false,
            });
            var dateConverted = new Date(data.tranDate);
            log.debug('dateConverted', dateConverted)
            createRec.setValue({
                fieldId: "trandate",
                value: dateConverted,
                ignoreFieldChange: false,
            });
            if(data.memo){
                createRec.setValue({
                    fieldId: "memo",
                    value: data.memo,
                    ignoreFieldChange: false,
                });
            }
            createRec.setValue({
                fieldId: "class",
                value: data.class.internalId,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                fieldId: "department",
                value: data.department.internalId,
                ignoreFieldChange: false,
            });
            if(data.sof.internalId){
                createRec.setValue({
                    fieldId: "cseg_stc_sof",
                    value: data.sof.internalId,
                    ignoreFieldChange: false,
                });
            }
            var items = data.items
            if(items.length > 0){
                for (var i = 0; i < items.length; i++) {
                    let itemID = data.items[i].item.internalId;
                    log.debug('itemID', itemID)
                    createRec.selectNewLine({ sublistId: 'item' })
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: itemID,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "pricelevels",
                        value: "-1",
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: data.items[i].itemDescription,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: data.items[i].quantity,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "taxcode",
                        value: "5",
                    });
                    createRec.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'grossamt',
                        value : data.items[i].amount
                    });
                    var amtLine = createRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
                    log.debug('amtLine', amtLine)
                    var rateSet = Number(amtLine) / Number(data.items[i].quantity);
                    log.debug('rateSet', rateSet);
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: rateSet,
                        ignoreFieldChange : true
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "class",
                        value: data.items[i].class.internalId,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "department",
                        value: data.items[i].department.internalId,
                    });
                    var sofId = data.items[i].sof.internalId
                    if(sofId){
                        createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: sofId,
                        });
                    }
                    createRec.commitLine({ sublistId: 'item' });
                    
                }
            }
            const payments = data?.payments || [];
            payments.forEach(payment => {
                var itemId = payment?.item?.internalId || null;
                var amountPayment = ensureNegative(payment.amount)
                var classId = payment.class.internalId
                var departmentId = payment.department.internalId
                log.debug('itemId', itemId);
                createRec.selectNewLine({ sublistId: 'item' })
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    value: itemId,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "pricelevels",
                    value: "-1",
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "taxcode",
                    value: "5",
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: amountPayment,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: amountPayment,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "class",
                    value: classId,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "department",
                    value: departmentId,
                });
                createRec.commitLine({ sublistId: 'item' });

            });
            const cashSaleId = createRec.save({ enableSourcing: true, ignoreMandatoryFields: false });
            log.debug('cashSaleId', cashSaleId)
            return {
                status: true,
                cashSaleId: cashSaleId
            };
        }catch(e){
            log.debug('error', e)
            return {
                status: false,
                message: e.message || JSON.stringify(e.message)
            }
        }
    }
    return{
        post: (context) => {
            try{
                log.audit('Received Data', JSON.stringify(context));
                if(context.transactionType == "cashsale"){
                    result = createCashSale(context.data);
                }
                log.debug('result', result)
                if(result.status){
                    return {
                        status: 'success',
                        message: 'Cash Sales created successfully.',
                        data: result.cashSaleId
                    };
                }else{
                    return {
                        status: 'Error',
                        message: result.message,
                    };
                }
                
            }catch(e){
                log.debug('error', e)
                var result = {
                    status: false,
                    message: e.message || JSON.stringify(e)
                };

                throw new Error(result.message);
            }
        },
        put: (context) => {
            try{

            }catch(e){
                log.debug('error', e)
            }
        }
    }
});