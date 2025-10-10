/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    var records = currentRecord.get();
        function pageInit(context) {
            console.log("test in");
        }
        
        function createSof() {
            console.log('cek create')
            const button = document.getElementById('custpage_btn_transform');
            if (button) {
                button.disabled = true;
                button.value = 'Sedang Diproses...';

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
        } 
        function processTransaction(){
            console.log('transform');
            var records = currentRecord.get();
            
        }
        return {
            pageInit: pageInit,
            createSof : createSof,
        };
    }); 
    