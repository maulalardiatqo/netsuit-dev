/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        log.debug('init masuk');
    }
    function createInv(context) {
    // Disable button
    var button = document.getElementById('custpage_button_recreate');
    console.log('button')
    if (button) {
        console.log('masuk isbutton')
        button.disabled = true;
        button.innerText = 'Processing...'; // Optional: ubah teks tombol juga
    }

    var processMsg = message.create({
        title: "Processing",
        message: "On Process. Please wait...",
        type: message.Type.INFORMATION
    });
    processMsg.show();

    setTimeout(function () {
        try {
            processTransaction(processMsg);
        } catch (e) {
            processMsg.hide();
            
            // Enable button kembali jika error
            if (button) {
                    button.disabled = false;
                    button.innerText = 'Create Inventory Transfer';
                }

                log.error("Error", e);
                dialog.alert({
                    title: "Error",
                    message: "An unexpected error occurred: " + e.message
                });
            }
        }, 500);
    }

    function processTransaction(processMsg){
        var rec = records;
        var ifId = rec.id;
        console.log('ifId', ifId)
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_abj_sl_call_mr_if', 
            deploymentId: 'customdeploy_abj_sl_call_mr_if' 
        });
    
        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({ ifId: ifId }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            processMsg.hide();
            console.log('Response from Suitelet:', response.body);
            var result = JSON.parse(response.body);
            console.log('result', result)
            if (result.success) {
                dialog.alert({
                    title: result.success ? "Success" : "Failed",
                    message: result.message
                }).then(function () {
                    window.location.reload();
                });
            } else {
                dialog.alert({
                    title: result.success ? "Success" : "Failed",
                    message: result.message
                }).then(function () {
                    window.location.reload(); 
                });
            }
        }).catch(function (e) {
            processMsg.hide();
            log.error('Error in Suitelet request', e);
            dialog.alert({
                title: "Error",
                message: "Failed to communicate with Suitelet: " + e.message
            });
        });
    }
    
    return {
        pageInit: pageInit,
        createInv: createInv
    };
});
