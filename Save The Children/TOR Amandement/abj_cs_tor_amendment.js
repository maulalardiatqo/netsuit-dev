/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/url", "N/currentRecord", "N/ui/message", "N/ui/dialog", "N/https", "N/record"], 
function (url, currentRecord, message, dialog, https, record) {
    var isProcessing = false;
    function pageInit(context) {
        console.log("Page init: script aktif");
    }
    function disableButton() {
        var btn = document.getElementById('custpage_btn_transform_pr');
        if (btn) {
            btn.disabled = true;
            btn.value = 'Processing...'; 
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.6';
        }
    }

    function enableButton() {
        var btn = document.getElementById('custpage_btn_transform_pr');
        if (btn) {
            btn.disabled = false;
            btn.value = 'TOR Amendment'; 
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        }
    }
    function amandement() {
        if (isProcessing) {
            console.log("Proses sedang berjalan, klik diabaikan.");
            return;
        }

        isProcessing = true;
        disableButton();

        var processingMsg = message.create({
            title: 'Please Wait',
            message: 'Request is processing on the server...',
            type: message.Type.INFORMATION
        });
        processingMsg.show();

        try {
            var records = currentRecord.get();
            var recId = records.id;
            var recType = records.type;
            var loadRec = record.load({
                type : recType,
                id : recId
            })
            var cekAmendList = loadRec.getValue('custrecord_abj_tor_amendment_list');
            console.log('cekAmendList', cekAmendList)
            var idToSend = recId; 
            if (cekAmendList && cekAmendList.length > 0) {
                var maxId = Math.max.apply(null, cekAmendList.map(Number));
                idToSend = Number(maxId.toString()); 
                console.log('Data amend list ditemukan. Menggunakan ID terbesar:', idToSend);
            } else {
                console.log('Amend list kosong. Menggunakan recId saat ini:', idToSend);
            }

            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_tor_amendment', 
                deploymentId: 'customdeploy_abj_sl_tor_amendment' 
            });

            https.post.promise({
                url: suiteletUrl,
                body: JSON.stringify({
                    recId: idToSend,
                    recType: recType,
                    source : recId
                })
            }).then(function(response) {
                processingMsg.hide();
                var result = JSON.parse(response.body);

                if (result.success) {
                    dialog.alert({
                        title: 'Success',
                        message: 'Record has been successfully created with no ' + result.newTorNo
                    }).then(function() {
                        location.reload(); 
                    });
                } else {
                    isProcessing = false;
                    enableButton();
                    dialog.alert({
                        title: 'Error',
                        message: 'Failed to create record: ' + result.message
                    });
                }
            }).catch(function(err) {
                isProcessing = false;
                enableButton();
                processingMsg.hide();
                dialog.alert({
                    title: 'System Error',
                    message: 'Connection to server failed: ' + err.message
                });
            });

        } catch (e) {
            isProcessing = false;
            enableButton();
            processingMsg.hide();
            console.error('Error in amandement trigger:', e.message);
        }
    }
    
    return {
        pageInit: pageInit,
        amandement: amandement
    }
});