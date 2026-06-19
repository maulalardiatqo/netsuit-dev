/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog', 'N/url', 'N/currentRecord', 'N/search', 'N/https'], (record, dialog, url, currentRecord, search, https) => {
    var rec = currentRecord.get()
    function pageInit(context) {
       
    }
    const onTriggerExport = () => {
        const rec = currentRecord.get();
        const recordId = rec.id;
        console.log('recordId', recordId)
        const recordType = rec.getValue('custrecord_stc_grant_module_prj_budg');
        const startDate = rec.getValue('custrecord_stc_start_date_prj_budg');
        const endDate = rec.getValue('custrecord_stc_end_date_prj_budg');

        const now = new Date();
        const timestamp = now.getFullYear() + 
            String(now.getMonth() + 1).padStart(2, '0') + 
            String(now.getDate()).padStart(2, '0') + '_' + 
            String(now.getHours()).padStart(2, '0') + 
            String(now.getMinutes()).padStart(2, '0') + 
            String(now.getSeconds()).padStart(2, '0');
        const fileToken = `${recordId}_${timestamp}`; 

        const btn = jQuery('#custpage_btn_export_excel');
        if (btn.length) {
            btn.prop('disabled', true).val('Sedang diproses...');
        }

        const baseUrl = url.resolveScript({
            scriptId: 'customscript_abj_sl_budget_pashing',
            deploymentId: 'customdeploy_abj_sl_budget_pashing'
        });
        console.log('params',{
            recordType : recordType, startDate : startDate, endDate : endDate
        })
        const startUrl = baseUrl + `&action=start&recId=${recordId}&recType=${recordType}&fileToken=${fileToken}&startDate=${startDate}&endDate=${endDate}`;

        https.get.promise({ url: startUrl })
            .then(response => {
                const resData = JSON.parse(response.body);
                if (resData.status === 'QUEUED') {
                    // Kirim fileToken ke fungsi checkStatus
                    checkStatus(resData.taskId, baseUrl, fileToken);
                } else {
                    throw new Error(resData.message || 'Gagal masuk antrean.');
                }
            })
            .catch(err => {
                console.error(err);
                dialog.alert({ title: 'Error', message: 'Gagal memulai proses ekspor: ' + err.message });
                if (btn.length) { btn.prop('disabled', false).val('Generate Excel'); }
            });
    };

    const checkStatus = (taskId, baseUrl, fileToken) => {
        const checkUrl = baseUrl + `&action=check&taskId=${taskId}&fileToken=${fileToken}`;
        
        const interval = setInterval(() => {
            https.get.promise({ url: checkUrl }).then(response => {
                const resData = JSON.parse(response.body);
                const btn = jQuery('#custpage_btn_export_excel');
                
                if (resData.status === 'COMPLETE' && resData.fileUrl) {
                    clearInterval(interval);
                    
                    dialog.alert({
                        title: 'Selesai',
                        message: 'Proses generate selesai. File akan otomatis terdownload.'
                    }).then(() => {
                        var link = document.createElement('a');
                        link.href = resData.fileUrl;
                        link.target = '_self';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        setTimeout(() => { window.location.reload(); }, 1500);
                    });
                } else if (resData.status === 'FAILED') {
                    clearInterval(interval);
                    dialog.alert({ title: 'Gagal', message: 'Proses ekspor gagal di backend.' });
                    if (btn.length) { btn.prop('disabled', false).val('Generate Excel'); }
                }
            }).catch(err => {
                console.error('Error polling:', err);
            });
        }, 5000); 
    };
    return {
        pageInit: pageInit,
        onTriggerExport : onTriggerExport
    };
});