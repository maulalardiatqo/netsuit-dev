/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/http', 'N/record', 'N/crypto', 'N/error', 'N/search'], function(log, http, record, crypto, error, search) {

    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                
                // Parse request body
                var requestBody = JSON.parse(context.request.body);
                var requestHeader = context.request.headers;
                log.debug('Parsed requestBody', requestBody);
                function convertToNetSuiteDate(dateTimeString) {
                    if (!dateTimeString) {
                        throw new Error("Invalid date string");
                    }
                
                    // Create a Date object from the string
                    const dateObject = new Date(dateTimeString);
                
                    // Validate the created date
                    if (isNaN(dateObject)) {
                        throw new Error("Invalid date format");
                    }
                
                    return dateObject;
                }
                var timestamp = requestHeader['Timestamp'];
                var apiKey = requestHeader['APIKey'];
                var signature = requestHeader['Signature'];

                // Create a new custom record
                var customRecord = record.create({
                    type: 'customrecord_cs_iseller',
                    isDynamic: true,
                });

                customRecord.setValue({
                    fieldId: "custrecord_cs_customer",
                    value: 2922
                });
                var dateIsel = requestBody.order_date
                log.debug('dateIsel', dateIsel)
                var dateNs = convertToNetSuiteDate(dateIsel);
                log.debug('dateNs', dateNs)
                customRecord.setValue({
                    fieldId: "custrecord_cs_date",
                    value: dateNs
                });
                var orderId = requestBody.order_id
                customRecord.setValue({
                    fieldId: "name",
                    value: 'Order' + orderId
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_sales_channel",
                    value: 1
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_subsidiaries",
                    value: 7
                });
                customRecord.setValue({
                    fieldId: "custrecord_cs_location",
                    value: 131
                });
                // customRecord.setValue({
                //     fieldId: "custrecord_cs_class",
                //     value: 1
                // });

                // Process order details
                if (requestBody.order_details && Array.isArray(requestBody.order_details)) {
                    requestBody.order_details.forEach((detail) => {
                        customRecord.selectNewLine({ sublistId: 'recmachcustrecord_csd_id' });

                        var upcCode = detail.sku;
                        var idItem;

                        // Search for item by UPC Code
                        var itemSearchObj = search.create({
                            type: "item",
                            filters: [["upccode", "is", upcCode]],
                            columns: ["internalid", "upccode"]
                        });
                        var searchResults = itemSearchObj.run().getRange({ start: 0, end: 1 });

                        if (searchResults && searchResults.length > 0) {
                            var result = searchResults[0];
                            idItem = result.getValue({ name: "internalid" });
                            log.debug("Item Found", `Internal ID: ${idItem}, UPC Code: ${upcCode}`);
                        } else {
                            log.error("Item Not Found", `UPC Code: ${upcCode}`);
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
                            fieldId: 'custrecord_csd_rate',
                            value: detail.base_price
                        });
                        customRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_csd_id',
                            fieldId: 'custrecord_csd_amount',
                            value: detail.total_order_amount
                        });
                        customRecord.commitLine({ sublistId: 'recmachcustrecord_csd_id' });
                    });
                } else {
                    log.error('Order Details Missing or Invalid', 'No order details found in requestBody');
                }

                // Save custom record
                customRecord.save();

                // Send success response
                context.response.write({
                    output: JSON.stringify({
                        status: 'success',
                        message: 'Data received and processed successfully!'
                    })
                });
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
