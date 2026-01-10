/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/search', 'N/runtime'], function (currentRecord, search, runtime) {

    function formatDateDDMMYYYY(dateStr) {
        if (!dateStr) return null;
        var parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }

    function getParam(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    // --- FUNGSI REKURSIF UTAMA ---
    function processLine(index, data, rec) {
        var sublistId = 'recmachcustrecord_tar_e_id';

        if (index >= data.length) {
            console.log('Semua baris selesai.');
            return;
        }

        try {
            var rowData = data[index];
            rec.selectNewLine({ sublistId: sublistId });

            // --- 1. SET DATA DASAR (Non-Sourcing) ---
            // Bagian Search Category saya skip biar kode lebih pendek dan fokus ke masalah
            if (rowData.date) rec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expense_date', value: formatDateDDMMYYYY(rowData.date) });
            if (rowData.amount) rec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_amount', value: rowData.amount });
            // ... set field dasar lainnya (memo, cost center, project code, dll) ...

            // --- 2. SET DONOR (TRIGGER FILTER) ---
            if (rowData.project) {
                console.log('1. Setting Donor: ' + rowData.project);
                rec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tare_donor',
                    value: rowData.project
                });
            }

            // --- 3. TIMEOUT PERTAMA: TUNGGU PROJECT TASK LIST SIAP ---
            // Kita beri waktu NetSuite memuat ulang dropdown Project Task berdasarkan Donor
            setTimeout(function () {
                
                // --- 4. SET PROJECT TASK (TRIGGER SOURCING BU) ---
                if (rowData.projectTask) {
                    console.log('2. (Setelah Jeda 1) Setting Project Task: ' + rowData.projectTask);
                    try {
                        rec.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_tare_project_task',
                            value: Number(rowData.projectTask), // Pastikan Number
                            // forceSyncSourcing: true, // Opsional: kadang membantu
                            ignoreFieldChange: false // Biarkan sourcing BU jalan
                        });
                    } catch (ePt) {
                        console.log('Gagal set PT', ePt);
                    }
                }

                // --- 5. TIMEOUT KEDUA: TUNGGU BUSINESS UNIT SOURCING ---
                // Kita beri waktu lagi untuk NetSuite mengisi Business Unit otomatis
                setTimeout(function() {
                    
                    console.log('3. (Setelah Jeda 2) Override Business Unit & Commit');

                    // --- 6. SET BUSINESS UNIT (OVERRIDE) ---
                    if (rowData.bussinessUnit) {
                        rec.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_ter_business_unit',
                            value: rowData.bussinessUnit,
                            ignoreFieldChange: true // Timpa paksa
                        });
                    }

                    // Set field sisa lainnya (SOF, DEA, DRC, dll) di sini
                    if (rowData.sof) rec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_source_of_funding', value: rowData.sof });

                    // --- 7. COMMIT ---
                    rec.commitLine({ sublistId: sublistId });

                    // --- 8. LANJUT KE BARIS BERIKUTNYA ---
                    processLine(index + 1, data, rec);

                }, 500); // Jeda Kedua (Tunggu BU) - misal 0.5 detik

            }, 800); // Jeda Pertama (Tunggu Filter Donor -> PT) - misal 0.8 detik

        } catch (e) {
            console.error('Error processing line ' + index, e);
            processLine(index + 1, data, rec);
        }
    }

    function pageInit(context) {
        var rec = currentRecord.get();
        var payload = getParam('dataParamsString');
        if (!payload) return;
        var data = JSON.parse(decodeURIComponent(payload));
        if (!data || !data.length) return;

        // Set Header
        if (data[0].idTor) rec.setValue({ fieldId: 'custrecord_tar_link_to_tor', value: data[0].idTor });
        rec.setValue({ fieldId: 'custrecord_tar_staf_name', value: runtime.getCurrentUser().id });
        if (data[0].date) rec.setValue({ fieldId: 'custrecord_tar_date', value: formatDateDDMMYYYY(data[0].date) });

        // Start Loop
        processLine(0, data, rec);
    }

    return {
        pageInit: pageInit
    };
});