/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/log'], function(record, log) {
    function doPost(requestBody) {
        try {
            var data = JSON.parse(requestBody);
            
            var salesOrder = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true
            });

            salesOrder.setValue({
                fieldId: 'entity',
                value: data.customerId
            });

            salesOrder.setValue({
                fieldId: 'trandate',
                value: new Date()
            });

            // Menyimpan Sales Order
            var salesOrderId = salesOrder.save();

            log.debug('Sales Order Created', 'Sales Order ID: ' + salesOrderId);

            return { success: true, salesOrderId: salesOrderId };
        } catch (e) {
            log.error('Error processing webhook', e);
            return { success: false, message: e.message };
        }
    }

    return {
        post: doPost
    };
});
