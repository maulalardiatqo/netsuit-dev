/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/url", "N/currentRecord", "N/ui/message", "N/https", "N/ui/dialog"], 
(url, currentRecord, message, https, dialog) => {

    const pageInit = (context) => {
    };

    const createJe = () => {
        const currRec = currentRecord.get();
        const recordId = currRec.id;
        const recordType = currRec.type;
        const processingMsg = message.create({
            title: "Proses Sedang Berjalan",
            message: "Sedang membuat Journal Entry, mohon tunggu...",
            type: message.Type.CONFIRMATION
        });
        processingMsg.show();
        const btnCreateJe = document.getElementById('custpage_btn_create_je');
        if (btnCreateJe) btnCreateJe.disabled = true;

        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_abj_sl_generate_statistic_j', 
            deploymentId: 'customdeploy_abj_sl_generate_statistic_j',
            params: {
                recordId: recordId,
                recordType: recordType
            }
        });
        https.get.promise({ url: suiteletUrl })
            .then(response => {
                const result = JSON.parse(response.body);
                processingMsg.hide();

                if (result.status === 'success') {
                    dialog.alert({
                        title: 'Berhasil',
                        message: 'Berhasil Create JE: ' + (result.jeId || '')
                    }).then(() => {
                        location.reload(); 
                    });
                } else {
                    throw new Error(result.message || 'Gagal membuat Journal');
                }
            })
            .catch(e => {
                if (processingMsg) processingMsg.hide();
                
                const btnCreateJe = document.getElementById('custpage_btn_create_je');
                if (btnCreateJe) btnCreateJe.disabled = false;

                dialog.alert({
                    title: 'Gagal Create JE',
                    message: 'Terjadi kesalahan: ' + e.message
                }).then(() => {
                    location.reload(); 
                });
            });
    };

    return {
        pageInit: pageInit,
        createJe: createJe 
    };
});