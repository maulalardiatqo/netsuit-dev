/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function pageInit(scriptContext) {
        const rec = scriptContext.currentRecord;
        log.debug('trigerred');
        
        const urlParams = new URLSearchParams(window.location.search);
        let rawData = urlParams.get('dataParamsString');
        
        console.log('rawData dari URL:', rawData);

        if (!rawData) return;

        try {
            let data;
            
            // CEK: Apakah parameter ini adalah ID dari Record Temporary?
            if (rawData.indexOf('temp_id_') === 0) {
                const internalRecId = rawData.replace('temp_id_', '');
                console.log('Loading Temporary Record ID:', internalRecId);

                // Muat record temporary untuk mengambil JSON asli
                const tempLoad = record.load({
                    type: 'customrecord_temporary_data_transfer',
                    id: internalRecId
                });

                const realJsonData = tempLoad.getValue('custrecord_temp_json_data');
                if (realJsonData) {
                    data = JSON.parse(realJsonData);
                }
                try {
                    record.delete({
                        type: 'customrecord_temporary_data_transfer',
                        id: internalRecId
                    });
                    console.log('Temporary record ' + internalRecId + ' berhasil dihapus (Cleanup).');
                } catch (errDel) {
                    console.error('Housekeeping Failed:', errDel.message);
                }

            } else {
                data = JSON.parse(rawData);
            }

            if (data && data.length > 0) {
                
                data.forEach(function(item) {
                    if (item.description) {
                        try {
                            item.description = decodeURIComponent(item.description);
                        } catch (e) {
                            console.error('Fail to decode desc:', e.message);
                        }
                    }
                });

                processDataAsync(data, rec);
            }
            
            var cekDatetran = rec.getValue('trandate');
            console.log('cekDatetran', cekDatetran);

        } catch (e) {
            console.error('Error processing dataParamsString', e);
        }
    }

    async function processDataPOAsync(data, rec) {
        let totalAmount = 0;

        // --- 2. LOOPING INJEKSI BARIS ITEM ---
        for (let i = 0; i < data.length; i++) {
            let lineData = data[i];
            
            // Buat baris baru di sublist item
            rec.selectNewLine({ sublistId: 'item' });

            // Helper function untuk mempermudah set value
            const forceSet = (field, val, ignore) => {
                if (val !== null && val !== undefined && val !== '') {
                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: field,
                        value: val,
                        ignoreFieldChange: ignore
                    });
                }
            };

            try {
                // Field 'item' wajib diset dengan ignoreFieldChange: false 
                // agar NetSuite memuat default harga, pajak, dan satuan.
                if (lineData.item) {
                    forceSet('item', lineData.item, false);
                    // Beri jeda kecil agar NetSuite selesai meload data bawaan item tersebut
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Set Data Utama (Kuantitas & Harga)
                forceSet('quantity', lineData.qty, true);
                forceSet('rate', lineData.amount, true);
                forceSet('amount', lineData.amount, true);
                
                if (lineData.amount) {
                    totalAmount += Number(lineData.amount);
                    forceSet('estimaterate', lineData.amount, true);
                    forceSet('estimatedamount', lineData.amount, true);
                }

                // Set Data Pelengkap
                forceSet('units', lineData.uom, true);
                forceSet('description', lineData.description, true);
                forceSet('taxcode', '5', true);
                forceSet('currency', '1', true);
                
                // Set Klasifikasi & Custom Segment
                forceSet('department', lineData.costCenter, true);
                forceSet('class', lineData.projectCode, true);
                forceSet('cseg_stc_sof', lineData.sof, true);
                forceSet('cseg_paactivitycode', lineData.activityCode, true);
                forceSet('cseg1', lineData.bussinessUnit, true);
                forceSet('cseg_stc_drc_segmen', lineData.drc, true);
                forceSet('cseg_stc_segmentdea', lineData.dea, true);

                // Set Project & Task
                if (lineData.project) {
                    // Ignore false agar customer/project men-trigger rules bawaannya
                    forceSet('customer', lineData.project, false);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    forceSet('projecttask', lineData.projectTask, true);
                    forceSet('custrecord_tare_project_task', lineData.projectTask, true);
                }

                // Set Custom Column (Approval, Asset, dll)
                forceSet('custcol_stc_approval_status_line', '1', true);
                forceSet('custcol_stc_apprvl_sts_fa', '1', true);
                forceSet('custcol_stc_approver_linetrx', lineData.approver, true);
                forceSet('custcol_stc_approver_fa', lineData.approverFa, true);
                forceSet('custcol_stc_asset', '2', true);
                forceSet('custcolid_line_tor', lineData.idLine, true);

                // Simpan Baris
                rec.commitLine({ sublistId: 'item' });
                console.log('Baris PO ' + i + ' Berhasil Commit.');
                
            } catch (lineErr) {
                console.error('Gagal Commit Baris ' + i + ': ' + lineErr.message);
                // Batalkan baris jika terjadi error agar tidak nyangkut
                rec.cancelLine({ sublistId: 'item' }); 
            }

            // Jeda antar baris untuk menjaga kestabilan browser memori
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        // --- 3. SET TOTAL KE HEADER ---
        rec.setValue({
            fieldId: 'custbody_amount_from_tor',
            value: totalAmount,
            ignoreFieldChange: true
        });

        console.log('Injeksi PO Selesai. Total Amount:', totalAmount);
    }
    return{
        pageInit : pageInit
    }
})