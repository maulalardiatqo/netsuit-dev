/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        console.log('init masuk');
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
        var soId = rec.id;
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_abj_sl_call_mr_so', 
            deploymentId: 'customdeploy_abj_sl_call_mr_so' 
        });
    
        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({ soId: soId }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            processMsg.hide();
            console.log('Response from Suitelet:', response.body);
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
                    title: "Error",
                    message: "Error"
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
        createRec: createRec
    };
});
