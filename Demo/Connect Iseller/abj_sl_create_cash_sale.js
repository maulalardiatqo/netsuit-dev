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
                log.debug('requestBody', requestBody)
                // Timestamp dan APIKey dari header request iseller
                var timestamp = context.request.headers['Timestamp'];
                var apiKey = context.request.headers['APIKey'];
                var signature = context.request.headers['Signature'];

                // Verifikasi signature
                if (!isValidSignature(apiKey, requestBody, timestamp, signature)) {
                    throw new Error('Invalid Signature');
                }

                // Jika signature valid, lanjutkan proses lainnya
                log.debug('Valid Request', 'Signature is valid');

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

    // Fungsi untuk memverifikasi signature
    function isValidSignature(apiKey, jsonBody, timestamp, receivedSignature) {
        var inputString = apiKey + jsonBody + timestamp;
        
        // Perbaikan: Menyediakan algoritma hashing SHA-256
        var hash = crypto.createHash({ algorithm: crypto.HashAlg.SHA_256 });
        hash.update(inputString);
        
        // Mendapatkan hasil hash dan mengubahnya menjadi format hex
        var calculatedSignature = hash.digest().toString('hex').toUpperCase();
    
        // Bandingkan signature yang diterima dengan signature yang dihitung
        return calculatedSignature === receivedSignature;
    }

    return {
        onRequest: onRequest
    };

});
