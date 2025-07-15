/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/record", "N/currentRecord", "N/ui/message", "N/ui/dialog"], function(record, currentRecord, message, dialog) {
    function pageInit(){
        console.log('pageInit')
    }
    function fieldChange(){

    }
function clossedSO(soId) {
        dialog.confirm({
            title: 'Konfirmasi',
            message: 'Apakah Anda yakin ingin menutup (close) Sales Order ini?'
        }).then(function (result) {
            if (result) {
                try {
                    var soRec = record.load({
                        type: record.Type.SALES_ORDER,
                        id: soId,
                        isDynamic: false
                    });

                    var lineCount = soRec.getLineCount({ sublistId: 'item' });

                    for (var i = 0; i < lineCount; i++) {
                        soRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            line: i,
                            value: true
                        });
                    }

                    // Optional: ubah juga orderstatus jika diperlukan
                    // soRec.setValue({ fieldId: 'orderstatus', value: 'C' });

                    soRec.save();

                    dialog.alert({
                        title: 'Sukses',
                        message: 'Sales Order berhasil ditutup (Closed).'
                    }).then(function () {
                        window.location.reload();
                    });

                } catch (e) {
                    dialog.alert({
                        title: 'Error',
                        message: 'Gagal menutup Sales Order: ' + e.message
                    });
                }
            }
        }).catch(function () {
            dialog.alert({
                title: 'Dibatalkan',
                message: 'Penutupan Sales Order dibatalkan oleh pengguna.'
            });
        });
    }

    return {
        pageInit : pageInit,
        fieldChange : fieldChange,
        clossedSO: clossedSO
    };
});
