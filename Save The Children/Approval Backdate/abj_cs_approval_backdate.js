/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/url', 'N/currentRecord', 'N/https', 'N/ui/message'],
    function(dialog, url, currentRecord, https, message) {
        
        let statusMessage = null;

        function pageInit(context) {}

        function changeDelegate() {
            const rec = currentRecord.get();
            const button = document.getElementById('custpage_set_delegate');
            const params = {
                id: rec.id,
                delegationApproval: rec.getValue('custentity_stc_subtitute_apprvl'),
                delDateFrom: rec.getValue('custentity_stc_delgtion_date_from'), 
                delDateTo: rec.getValue('custentity_stc_delegation_date_to')
            };

            if (button) button.disabled = true;

            statusMessage = message.create({
                title: "Proses Sedang Berjalan",
                message: "Mohon tunggu, sistem sedang memperbarui delegasi...",
                type: message.Type.INFORMATION
            });
            statusMessage.show();

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_approval_backdate', 
                deploymentId: 'customdeploy_abj_sl_approval_backdate'
            });
            console.log('params', params)
            https.post.promise({
                url: suiteletUrl,
                body: JSON.stringify(params)
            }).then(function(response) {
                const taskId = JSON.parse(response.body).taskId;
                checkTaskStatus(taskId);
            }).catch(function(e) {
                console.error("Error triggering M/R", e);
            });
        }

        function checkTaskStatus(taskId) {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_approval_backdate',
                deploymentId: 'customdeploy_abj_sl_approval_backdate',
                params: { action: 'checkStatus', taskId: taskId }
            });

            const interval = setInterval(function() {
                https.get.promise({ url: suiteletUrl }).then(function(response) {
                    const status = JSON.parse(response.body).status;
                    console.log("Current Status: " + status);

                    if (status === 'COMPLETE' || status === 'FAILED') {
                        clearInterval(interval);
                        statusMessage.hide();
                        
                        dialog.alert({
                            title: 'Selesai',
                            message: status === 'COMPLETE' ? 'Proses delegasi berhasil.' : 'Proses gagal.'
                        }).then(function() {
                            location.reload(); 
                        });
                    }
                });
            }, 5000); 
        }

        return {
            pageInit: pageInit,
            changeDelegate: changeDelegate
        };
    });