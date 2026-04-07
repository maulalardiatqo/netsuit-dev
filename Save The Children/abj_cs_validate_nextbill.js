/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {
    function pageInit(context) {
    }

    function alertValidation() {
        dialog.alert({
            title: 'Validasi Gagal',
            message: 'Prosentase Spending Amount Belum memenuhi Remarks'
        });
    }

    return {
        pageInit: pageInit,
        alertValidation: alertValidation
    };
});