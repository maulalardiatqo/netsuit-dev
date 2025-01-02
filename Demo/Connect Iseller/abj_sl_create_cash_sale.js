/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/http', 'N/record', 'N/crypto', 'N/error'], function(log, http, record, crypto, error) {

    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                // Membaca body request POST dari iseller
                var requestBody = context.request.body;
                var requestHeader = context.request.headers
                log.debug('requestBody', requestBody)
                log.debug('requestHeader', requestHeader)
                // Timestamp dan APIKey dari header request iseller
                var timestamp = context.request.headers['Timestamp'];
                var apiKey = context.request.headers['APIKey'];
                var signature = context.request.headers['Signature'];
                var customRecord = record.create({
                    type: 'customrecord_cs_iseller'
                });
                customRecord.setValue({
                    fieldId : "custrecord_cs_customer",
                    value : requestBody.external_customer_id
                });
                customRecord.setValue({
                    fieldId : "custrecord_cs_date",
                    value : requestBody.order_date
                });
                requestBody.order_details.forEach((detail) => {
                    customRecord.selectNewLine({ sublistId: 'item' });
    
                    customRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: detail.sku // Assuming SKU maps to Item ID
                    });
                    customRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: detail.quantity
                    });
                    customRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: detail.base_price
                    });
    
                    customRecord.commitLine({ sublistId: 'item' });
                });
                // Jika signature valid, lanjutkan proses lainny

                // Proses data sesuai kebutuhan
                // Misalnya, simpan data ke record NetSuite
                // var customRecord = record.create({ type: 'customrecord_example' });
                // customRecord.setValue({ fieldId: 'custrecord_example_field', value: requestBody });
                // customRecord.save();

                // Kirimkan response sukses
                context.response.write({
                    output: JSON.stringify({
                        status: 'success',
                        message: 'Data received and processed successfully!'
                    })
                });

            } catch (e) {
                log.error('Error', e);
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
