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
                    log.debug('requestBody', requestBody)
                    var requestHeader = context.request.headers;
                    if (requestBody && Object.keys(requestBody).length > 0){
                        log.debug('masuk kondisi')
                        var mrTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_abj_mr_create_cash_sale',
                            deploymentId: 'customdeploy_abj_mr_create_cash_sale',
                            params: {
                                custscript_input_data: JSON.stringify(requestBody)
                            }
                        });
                        log.debug('mrTask', mrTask)
                        var taskId = mrTask.submit();
                        log.debug('Map/Reduce Task Submitted', taskId);
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
