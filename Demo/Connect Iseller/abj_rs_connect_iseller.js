/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/crypto', 'N/log', 'N/error'], (record, crypto, log, error) => {

    function post(requestBody) {
        try {
            log.debug('triggered')
            const apiKey = 'd57e72e99557459984a8b3ea6219c97e';
            const signatureHeader = requestBody.headers['Signature'];
            const timestamp = requestBody.headers['Timestamp'];
            const jsonBody = JSON.stringify(requestBody.body);

            const inputString = `${apiKey}${jsonBody}${timestamp}`;
            log.debug('inputString', inputString)
            const generatedSignature = crypto.createHash({
                algorithm: crypto.HashAlg.SHA256
            }).update(inputString).digest('hex').toUpperCase();

            if (generatedSignature !== signatureHeader) {
                throw error.create({
                    name: 'SIGNATURE_VALIDATION_FAILED',
                    message: 'Signature validation failed.',
                    notifyOff: false
                });
            }

            // Save data to Custom Record
            const orderData = requestBody.body;
            log.debug('orderData', orderData)
            // const customRecord = record.create({ type: 'customrecord_order_data' });
            
            // customRecord.setValue({ fieldId: 'custrecord_order_id', value: orderData.order_id });
            // customRecord.setValue({ fieldId: 'custrecord_customer_name', value: `${orderData.customer_first_name} ${orderData.customer_last_name}` });
            // customRecord.setValue({ fieldId: 'custrecord_total_amount', value: orderData.total_amount });
            // customRecord.setValue({ fieldId: 'custrecord_payment_status', value: orderData.payment_status });
            // customRecord.save();

            // return { success: true, message: 'Data saved successfully.' };

        } catch (e) {
            log.error('Error in RESTlet', e.message);
            return { success: false, message: e.message };
        }
    }

    return { post };
});
