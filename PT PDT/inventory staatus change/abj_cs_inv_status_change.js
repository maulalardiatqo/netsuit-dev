/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/https', 'N/ui/message', 'N/url'], function(currentRecord, dialog, https, message, url) {

    function pageInit(context) {}

    function setInventoryItemAction() {
        let rec = currentRecord.get();

       let payload = {
            recordId: rec.id || null, 
            location: rec.getValue('location'),
            status: rec.getValue('previousstatus'),
            revisedStatus: rec.getValue('revisedstatus'), 
            subsidiary: rec.getValue('subsidiary'),
            item: rec.getValue('custbody_pdt_item'),
            initialLot: rec.getValue('custbody_pdt_initial_lot_number')
        };
        if (!payload.location || !payload.status || !payload.revisedStatus || !payload.subsidiary || !payload.item || !payload.initialLot) {
            dialog.alert({ 
                title: 'Validasi', 
                message: 'Harap isi: Location, Previous Status, Revised Status, Subsidiary, Item, dan Initial Lot Number.' 
            });
            return;
        }

        let loadingMsg = message.create({ title: 'Memproses...', message: 'Sedang men-generate Inventory Detail, mohon tunggu.', type: message.Type.INFORMATION });
        loadingMsg.show();

        let suiteletUrl = '/app/site/hosting/scriptlet.nl?script=1316&deploy=1'; 

        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify(payload)
        }).then(function(response) {
            loadingMsg.hide();
            let resBody = JSON.parse(response.body);

            if (resBody.success) {
                window.onbeforeunload = null; 
                
                let recordUrl = url.resolveRecord({
                    recordType: 'inventorystatuschange',
                    recordId: resBody.recordId,
                    isEditMode: false
                });
                
                window.location.href = recordUrl;
            } else {
                dialog.alert({ title: 'Gagal', message: 'Error dari Server: ' + resBody.message });
            }
        }).catch(function(err) {
            loadingMsg.hide();
            dialog.alert({ title: 'Error Koneksi', message: 'Gagal menghubungi server: ' + err.message });
        });
    }

    return { pageInit: pageInit, setInventoryItemAction: setInventoryItemAction };
});