/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function pageInit(context) {
        log.debug('init masuk');
        var records = currentRecord.get();
    }
    function createRec(context) {
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
                console.log("Error", e);
                dialog.alert({
                    title: "Error",
                    message: e.message
                });
            }
        }, 500); 
    }
    function processTransaction(processMsg){
        var records = currentRecord.get();
        var rec = records;
        var soId = rec.id;
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_abj_sl_call_mr_so', 
            deploymentId: 'customdeploy_abj_sl_call_mr_so' 
        });
        console.log('soId', soId)
        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({ soId: soId }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            processMsg.hide();
            log.debug('Response from Suitelet:', response.body);
            var result = JSON.parse(response.body);
            if (result.success) {
                dialog.alert({
                    title: "Success",
                    message: "Creating Inventory Transfer, Please Wait for a Moment, Then Refresh the Page to See the Result."
                }).then(function () {
                    window.location.reload();
                });
            } else {
                dialog.alert({
                    title: result.success ? "Success" : "Error",
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
            // throw e
        });
    }
    
    return {
        pageInit: pageInit,
        createRec: createRec
    };
});
