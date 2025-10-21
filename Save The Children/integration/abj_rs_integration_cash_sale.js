/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', 'N/search', 'N/runtime'], (record, log, error, format, search, runtime) => {
    function createCustRec(reqBody, resBody, trxNumb, integrationStatus, scriptId, deploymentId, executionAs){
        var recCreate = record.create({
            type : "customtransaction_abj_integration_log"
        });
        recCreate.setValue({
            fieldId : "custbody_abj_request_body_int",
            value : reqBody
        })
        recCreate.setValue({
            fieldId : "custbody_abj_respons_body_int",
            value : resBody
        })
        recCreate.setValue({
            fieldId : "custbody_abj_trx_numb_int",
            value : trxNumb
        })
        var dateTime = new Date();
        log.debug('dateTime', dateTime)
        recCreate.setValue({
            fieldId : "custbody_abj_created_at_int",
            value : dateTime
        })
        recCreate.setValue({
            fieldId : "custbody_abj_integration_status",
            value : integrationStatus
        })
        recCreate.setValue({
            fieldId : "custbody_abj_script_id_int",
            value : scriptId
        })
        recCreate.setValue({
            fieldId : "custbody_abj_deployment_id_int",
            value : deploymentId
        })
         recCreate.setValue({
            fieldId : "custbody_execution_as",
            value : executionAs
        })
        var saveRecCreate = recCreate.save();
        log.debug('saveRecCreate', saveRecCreate);

    }
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
            if(data.entity.internalId){
                createRec.setValue({
                    fieldId: "entity",
                    value: data.entity.internalId,
                    ignoreFieldChange: false,
                });
            }else{
                createRec.setValue({
                    fieldId: "entity",
                    value: 20,
                    ignoreFieldChange: false,
                });
            }
            
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
                value: 114,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                fieldId: "department",
                value: 3,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                    fieldId: "cseg_stc_sof",
                    value: 66,
                    ignoreFieldChange: false,
                });
            // if(data.sof.internalId){
                
            // }
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
                        value: 114,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "department",
                        value: 3,
                    });
                    log.debug('beforSOF')
                    // var sofId = data.items[i].sof.internalId
                    // log.debug('sofId', sofId)
                    createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: 20,
                        });
                    createRec.commitLine({ sublistId: 'item' });
                    
                }
            }
            const payments = data?.payments || [];
            payments.forEach(payment => {
                var itemId = payment?.item?.internalId || null;
                var amountPayment = ensureNegative(payment.amount)
                var classId = payment.class.internalId
                var departmentId = payment.department.internalId
                var sofPayment = payment.sof.internalId
                log.debug('itemId', itemId);
                log.debug('amountPayment', amountPayment)
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
                    value: 114,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "department",
                    value: 3,
                });
                createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: 20,
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
    const updateCashSale = (data) => {
        try {
            log.debug('data Update', data)
            var idCashSale = data.cashSaleInternalId
            log.debug('idCashSale', idCashSale)

            const createRec = record.load({
                type: "cashsale",
                id: idCashSale,
                isDynamic: true
            });

            // ==== HEADER FIELDS ====
            if(data.entity.internalId){
                createRec.setValue({
                    fieldId: "entity",
                    value: data.entity.internalId,
                    ignoreFieldChange: false,
                });
            }else{
                createRec.setValue({
                    fieldId: "entity",
                    value: 20,
                    ignoreFieldChange: false,
                });
            }
            
            var dateConverted = new Date(data.tranDate);
            createRec.setValue({
                fieldId: "trandate",
                value: dateConverted,
                ignoreFieldChange: false,
            });
            if (data.memo) {
                createRec.setValue({
                    fieldId: "memo",
                    value: data.memo,
                    ignoreFieldChange: false,
                });
            }
            createRec.setValue({
                fieldId: "class",
                value: 114,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                fieldId: "department",
                value: 3,
                ignoreFieldChange: false,
            });
            createRec.setValue({
                fieldId: "cseg_stc_sof",
                value: 66,
                ignoreFieldChange: false,
            });
            

            // ==== CLEAR OLD LINES (items + payments) ====
            let lineCount = createRec.getLineCount({ sublistId: 'item' });
            for (let i = lineCount - 1; i >= 0; i--) {
                createRec.removeLine({
                    sublistId: 'item',
                    line: i,
                    ignoreRecalc: true
                });
            }

            // ==== ADD ITEMS ====
            const items = data.items || [];
            if (items.length > 0) {
                items.forEach(itemLine => {
                    let itemID = itemLine.item.internalId;
                    createRec.selectNewLine({ sublistId: 'item' });
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
                        value: itemLine.itemDescription,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: itemLine.quantity,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "taxcode",
                        value: "5",
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        value: itemLine.amount
                    });

                    let amtLine = createRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
                    let rateSet = Number(amtLine) / Number(itemLine.quantity);
                    createRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: rateSet,
                        ignoreFieldChange: true
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "class",
                        value: 114,
                    });
                    createRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "department",
                        value: 3,
                    });
                    createRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "cseg_stc_sof",
                            value: 20,
                        });
                    createRec.commitLine({ sublistId: 'item' });
                });
            }

            // ==== ADD PAYMENTS (as negative line items) ====
            const payments = data?.payments || [];
            payments.forEach(payment => {
                let itemId = payment?.item?.internalId || null;
                let amountPayment = ensureNegative(payment.amount);
                let classId = payment.class.internalId;
                let departmentId = payment.department.internalId;

                createRec.selectNewLine({ sublistId: 'item' });
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
                    value: 114,
                });
                createRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "department",
                    value: 3,
                });
                createRec.commitLine({ sublistId: 'item' });
            });

            // ==== SAVE RECORD ====
            const cashSaleId = createRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });
            log.debug('cashSaleId', cashSaleId)

            return { status: true, cashSaleId };
        } catch (e) {
            log.debug('error', e);
            return { status: false, message: e.message || JSON.stringify(e.message) };
        }
    };

    return{
        post: (context) => {
            try{
                log.audit('Received Data', JSON.stringify(context));
                var reqBody = JSON.stringify(context)
                if(context.transactionType == "cashsale"){
                    result = createCashSale(context.data);
                }
                log.debug('result', result)
                if(result.status){
                    createCustRec(reqBody, result, result.cashSaleId, 1, 409, 1, 'Create')
                    return {
                        status: 'success',
                        message: 'Cash Sales created successfully.',
                        data: result.cashSaleId
                    };
                }else{
                    createCustRec(reqBody, result, '', 2, 409, 1, 'Create')
                    return {
                        status: 'error',
                        message: result.message,
                    };
                }
                
            }catch(e){
                log.debug('error', e)
                createCustRec(reqBody, result, '', 2, 409, 1, 'Create')
                var result = {
                    status: 'error',
                    message: e.message || JSON.stringify(e)
                };

                throw new Error(result.message);
            }
        },
        put: (context) => {
            try{
                log.audit('Received Data', JSON.stringify(context));
                var reqBody = JSON.stringify(context)
                if(context.transactionType == "cashsale"){
                    if(context.data.cashSaleInternalId){
                        if(data.isVoid == true){

                        }else{
                            result = updateCashSale(context.data);
                        }
                        
                    }else{
                        createCustRec(reqBody, result, '', 1, 409, 1, 'Update')
                        return {
                            status: 'error',
                            message: result.message,
                        };
                    }
                    
                }
                log.debug('result', result)
                if(result.status){
                    createCustRec(reqBody, result, result.cashSaleId, 1, 409, 1, 'Update')
                    return {
                        status: 'success',
                        message: 'Cash Sales updated successfully.',
                        data: result.cashSaleId
                    };
                }else{
                    createCustRec(reqBody, result, '', 2, 409, 1, 'Update')
                    return {
                        status: 'error',
                        message: result.message,
                    };
                }
                
            }catch(e){
                log.debug('error', e)
                createCustRec(reqBody, result, '', 2, 409, 1, 'Update')
                var result = {
                    status: 'error',
                    message: e.message || JSON.stringify(e)
                };

                throw new Error(result.message);
            }
        }
    }
});