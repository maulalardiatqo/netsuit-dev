/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/log', 'N/https', 'N/crypto', 'N/runtime'], function(record, log, https, crypto, runtime) {
    
    function onRequest(context) {
       
        if (context.request.method === 'GET') {
            log.debug('trigerred')
            var headers = context.request.headers;
            var body = context.request.body;
            
            var timestamp = headers['Timestamp'];
            var signature = headers['Signature'];
            var apiKey = 'd57e72e99557459984a8b3ea6219c97e'; 
            
            // Verifikasi signature
            var computedSignature = computeSignature(apiKey, body, timestamp);
            
            if (signature === computedSignature) {
                try {
                    var data = JSON.parse(body);
                    log.debug('data', data)
                    // Simpan data ke Custom Record
                    // var customRecord = record.create({
                    //     type: 'customrecord_iseller_order', // Ganti dengan tipe Custom Record yang sesuai
                    //     isDynamic: true
                    // });
                    
                    // // Contoh memasukkan data ke dalam Custom Record
                    // customRecord.setValue({
                    //     fieldId: 'custrecord_external_customer_id', 
                    //     value: data.external_customer_id
                    // });
                    
                    // customRecord.setValue({
                    //     fieldId: 'custrecord_order_id',
                    //     value: data.order_id
                    // });
                    
                    // customRecord.setValue({
                    //     fieldId: 'custrecord_total_amount',
                    //     value: data.total_amount
                    // });

                    // // Simpan custom record
                    // var recordId = customRecord.save();
                    // log.debug('Custom Record Created', 'Record ID: ' + recordId);
                    
                    // // Setelah data masuk ke custom record, lanjutkan ke proses Cash Sales jika diperlukan
                    // // Implementasi Cash Sales...

                    // context.response.write('Success');
                } catch (e) {
                    log.error('Error Processing Webhook', e);
                    context.response.write('Error processing data');
                }
            } else {
                log.error('Invalid Signature', 'The signature does not match');
                context.response.write('Invalid signature');
            }
        } else {
            context.response.write('Only POST requests are allowed');
        }
    }
    
    /**
     * Fungsi untuk menghitung signature menggunakan APIKey, JsonBody, dan Timestamp
     */
    function computeSignature(apiKey, jsonBody, timestamp) {
        var input = apiKey + jsonBody + timestamp;
        var hash = crypto.createHash({ algorithm: crypto.HashAlg.SHA_256 }).update(input).digest();
        return hash.toString(crypto.Encoding.HEX).toUpperCase();
    }

    return {
        onRequest: onRequest
    };
});
