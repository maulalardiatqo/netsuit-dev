/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], 
function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {

    function pageInit(context) {
        console.log("Page init: script aktif");
    }
    
    function createSof() {
        console.log('Mulai proses create SOF...');
        var records = currentRecord.get();
        var recId = records.id;
        console.log('recId', recId);

        const button = document.getElementById('custpage_btn_transform');
        if (button) {
            // Disable button dan tampilkan pesan loading
            button.disabled = true;
            button.value = 'Sedang Diproses...';

            var processMsg = message.create({
                title: "Processing",
                message: "Sedang membuat record SOF, mohon tunggu...",
                type: message.Type.INFORMATION
            });
            processMsg.show();

            // Jalankan proses dengan sedikit delay agar UI sempat update
            setTimeout(function () {
                try {
                    processTransaction(processMsg, recId, button);
                } catch (e) {
                    processMsg.hide();
                    console.error("Error", e);
                    dialog.alert({
                        title: "Error",
                        message: "Terjadi kesalahan: " + e.message
                    });
                    // Aktifkan kembali tombol
                    button.disabled = false;
                    button.value = 'Create SOF';
                }
            }, 500);
        }
    }

    function processTransaction(processMsg, recId, button) {
        try {
            var recLoad = record.load({
                type: "opportunity",
                id: recId
            });

            console.log('Transform data dari Opportunity...');
            var titel = recLoad.getValue('title') || "";
            var company = recLoad.getValue('entity') || "";
            var details = recLoad.getValue('memo') || "";
            var projectTotal = recLoad.getValue('projectedtotal') || "";
            var date = recLoad.getValue('custbody_stc_tar_date') || "";
            var icr = recLoad.getValue('custbody_stc_icr') || "";

            console.log('Data yang diambil:', { titel, company, details, projectTotal, date, icr });

            if (!titel) {
                processMsg.hide();
                dialog.alert({
                    title: "Gagal Membuat Record",
                    message: "Field 'Title' tidak ditemukan pada Opportunity ini."
                });
                button.disabled = false;
                button.value = 'Create SOF';
                return;
            }

            // Create record custom SOF
            var recCreate = record.create({
                type: "customrecord_cseg_stc_sof"
            });
            recCreate.setValue({ fieldId: "name", value: titel });
            recCreate.setValue({ fieldId: "custrecord8", value: company });
            recCreate.setValue({ fieldId: "custrecord3", value: details });
            recCreate.setValue({ fieldId: "custrecord4", value: projectTotal });
            recCreate.setValue({ fieldId: "custrecord5", value: date });
            recCreate.setValue({ fieldId: "custrecord12", value: icr });
            recCreate.setValue({ fieldId: "custrecordstc_sof_createdfrom", value: recId });

            var sofId = recCreate.save();

            processMsg.hide();

            if (sofId) {
                // Jika berhasil
                recLoad.setValue({
                    fieldId: "cseg_stc_sof",
                    value: sofId
                });
                recLoad.save();

                var successMsg = message.create({
                    title: "Success",
                    message: "Record SOF berhasil dibuat (ID: " + sofId + ")",
                    type: message.Type.CONFIRMATION
                });
                successMsg.show({ duration: 5000 });

                console.log("SOF berhasil dibuat dengan ID:", sofId);

                setTimeout(function () {
                    window.location.reload();
                }, 1500);

            } else {
                dialog.alert({
                    title: "Gagal Membuat Record",
                    message: "Record SOF gagal dibuat. Silakan coba lagi."
                });
                button.disabled = false;
                button.value = 'Create SOF';
            }
        } catch (e) {
            processMsg.hide();
            console.error("Error saat membuat SOF:", e);
            dialog.alert({
                title: "Error",
                message: "Terjadi kesalahan saat membuat record SOF: " + e.message
            });
            button.disabled = false;
            button.value = 'Create SOF';
        }
    }

    return {
        pageInit: pageInit,
        createSof: createSof,
    };
});
