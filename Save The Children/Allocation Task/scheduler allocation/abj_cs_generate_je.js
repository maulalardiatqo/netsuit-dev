/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/https', 'N/ui/message', 'N/currentRecord', 'N/record'], 
function(url, https, message, currentRecord, record) {

    function pageInit(context) {
    }

    function triggerMapReduce() {
        var rec = currentRecord.get();
        var transId = rec.id;
        var recLoad = record.load({
            type : rec.type,
            id : rec.id
        })
        var allocateType = recLoad.getValue('custbody_abj_allocation_type')
        console.log('allocateType', allocateType)
        var loadingMsg = message.create({
            title: 'Processing',
            message: 'Sedang men-trigger pembuatan Journal di background, mohon tunggu...',
            type: message.Type.INFORMATION 
        });
        loadingMsg.show();

        try {
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_generate_je',
                deploymentId: 'customdeploy_abj_sl_generate_je'
            });

            var response = https.post({
                url: suiteletUrl,
                body: { 
                    recordId: transId,
                    allocateType : allocateType
                 }
            });

            loadingMsg.hide(); 

            if (response.body === 'SUCCESS') {
                alert('Proses Generate Journal sedang berjalan di background (Map/Reduce). Silakan cek halaman ini beberapa saat lagi.');
                location.reload(); 
            } else {
                alert('Gagal memanggil Map/Reduce: ' + response.body);
            }

        } catch (e) {
            loadingMsg.hide();
            alert('Error: ' + e.message);
        }
    }

    return {
        pageInit: pageInit,
        triggerMapReduce: triggerMapReduce 
    };
});