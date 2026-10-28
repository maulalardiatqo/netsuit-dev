/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Deskripsi: Handle button click, create IA asynchronously, and manage UI Messages.
 */
define(['N/record', 'N/ui/message', 'N/currentRecord', 'N/search', 'N/url', 'N/https'], (record, message, currentRecord, search, url, https) => {

    const pageInit = (context) => {};

    const createIA = async () => {
        let processingMsg;
        const btnId = 'custpage_btn_create_ia';
        const btnElement = document.getElementById(btnId);

        try {
            if (btnElement) btnElement.disabled = true;
            
            processingMsg = message.create({
                title: 'Processing...',
                message: 'Silakan tunggu, sistem sedang membuat Inventory Adjustment...',
                type: message.Type.INFORMATION
            });
            processingMsg.show();

            const currRec = currentRecord.get();
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_create_ia', 
                deploymentId: 'customdeploy_abj_sl_create_ia'
            });

            // Kirim request ke Suitelet
            const response = await https.post.promise({
                url: suiteletUrl,
                body: JSON.stringify({
                    recId: currRec.id,
                    recType: currRec.type
                })
            });

            // Parse hasil dari Suitelet
            const result = JSON.parse(response.body);

            if (result.success) {
                processingMsg.hide();
                
                const successMsg = message.create({
                    title: 'Success',
                    message: `Berhasil membuat Inventory Adjustment. Memuat ulang halaman...`,
                    type: message.Type.CONFIRMATION
                });
                successMsg.show();

                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error create IA:', error);
            
            if (processingMsg) processingMsg.hide();
            if (btnElement) btnElement.disabled = false;

            const errorMsg = message.create({
                title: 'Error Creating IA',
                message: error.message || 'Terjadi kesalahan pada Server.',
                type: message.Type.ERROR
            });
            errorMsg.show();
        }
    };
    return { 
        pageInit, 
        createIA 
    };
});