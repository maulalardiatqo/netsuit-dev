/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
   function getNextFridayObject(dateString) {
        var parts = dateString.split('/');
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; 
        var year = parseInt(parts[2], 10);

        var d = new Date(year, month, day);

        var daysUntilFriday = (5 - d.getDay() + 7) % 7;

        if (daysUntilFriday === 0) {
            daysUntilFriday = 7;
        }

        d.setDate(d.getDate() + daysUntilFriday);

        return d;
    }
    // function pageInit(scriptContext) {
    //     const rec = scriptContext.currentRecord;
    //     log.debug('trigerred');
        
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const rawData = urlParams.get('dataParamsString');
        
    //     console.log('rawData', rawData);

    //     if (!rawData) return;

    //     try {
    //         const data = JSON.parse(rawData);
    //         if (data && data.length > 0) {
    //             processDataAsync(data, rec);
    //         }
    //         var cekDatetran = rec.getValue('trandate');
    //         console.log('cekDatetran', cekDatetran)
    //     } catch (e) {
    //         console.error('Error parsing dataParamsString', e);
    //     }
    // }
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

                // Bersihkan record temporary dari database agar tidak menumpuk
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
                // Jika isinya JSON biasa (fallback cara lama), langsung parse
                data = JSON.parse(rawData);
            }

            // Jalankan fungsi async bawaan Anda jika data berhasil didapatkan
            if (data && data.length > 0) {
                
                // --- Tambahan: Decode Deskripsi agar karakter % kembali normal ---
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
    function eksekusiHide(context){
        try {
                var headerApprover = document.querySelector('td[data-label="Approver FA"]');
                if (headerApprover) {
                    headerApprover.style.setProperty('display', 'none', 'important');
                    
                    var columnIndex = headerApprover.cellIndex;
                    
                    var tableEl = headerApprover.closest('table');
                    if (tableEl) {
                        var rows = tableEl.querySelectorAll('tr');
                        rows.forEach(function(row) {
                            if (row.cells[columnIndex]) {
                                row.cells[columnIndex].style.setProperty('display', 'none', 'important');
                            }
                        });
                    }
                }

                var headerStatus = document.querySelector('td[data-label="Approval Status FA"]');
                if (headerStatus) {
                    headerStatus.style.setProperty('display', 'none', 'important');
                    
                    var columnIndexStatus = headerStatus.cellIndex;
                    var tableElStatus = headerStatus.closest('table');
                    if (tableElStatus) {
                        var rowsStatus = tableElStatus.querySelectorAll('tr');
                        rowsStatus.forEach(function(row) {
                            if (row.cells[columnIndexStatus]) {
                                row.cells[columnIndexStatus].style.setProperty('display', 'none', 'important');
                            }
                        });
                    }
                }

                console.log('DOM Manipulation Sukses: Kolom Approver FA & Approval Status FA Berhasil Disembunyikan.');
            } catch (e) {
                console.error('Gagal eksekusi DOM manipulation:', e.message);
            }

    }  
    async function processDataAsync(data, rec) {
        let totalAmount = 0;

        for (let i = 0; i < data.length; i++) {
            let lineData = data[i];
            
            rec.selectNewLine({ sublistId: 'expense' });

            const forceSet = (field, val, ignore) => {
                if (val !== null && val !== undefined && val !== '') {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: field,
                        value: val,
                        ignoreFieldChange: ignore
                    });
                }
            };
            
            forceSet('category', '1', true);
            forceSet('expenseaccount', '281', true); 
            forceSet('currency', '1', true);
            
            if (data[0].date) {
                let parsedDate = parseDateString(data[0].date); // Pastikan fungsi parseDateString Anda sudah didefinisikan di bawah
                forceSet('expensedate', parsedDate, true);
            }

            if (lineData.project) {
                forceSet('customer', lineData.project, false); 
                
                await new Promise(resolve => setTimeout(resolve, 800));

                if (lineData.projectTask) {
                    rec.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'projecttask',
                        value: lineData.projectTask,
                        ignoreFieldChange: true 
                    });
                }
            }

            if (lineData.amount) {
                totalAmount += Number(lineData.amount);
                forceSet('amount', lineData.amount, true);
            }

            if (lineData.custcol_amount_limit_from_tor) {
                forceSet('custcol_amount_limit_from_tor', lineData.custcol_amount_limit_from_tor, true);
            }
            
            if (lineData.description) {
                forceSet('memo', lineData.description, true); // Teks otomatis rapi karena sudah didecode diatas
            }

            if (lineData.costCenter) forceSet('department', lineData.costCenter, true);
            if (lineData.projectCode) forceSet('class', lineData.projectCode, true);
            if (lineData.sof) forceSet('cseg_stc_sof', lineData.sof, true);
            if (lineData.activityCode) forceSet('cseg_paactivitycode', lineData.activityCode, true);
            if (lineData.bussinessUnit) forceSet('cseg1', lineData.bussinessUnit, true);
            if (lineData.drc) forceSet('cseg_stc_drc_segmen', lineData.drc, true);
            if (lineData.dea) forceSet('cseg_stc_segmentdea', lineData.dea, true);

            let finalAcc = rec.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'expenseaccount' });
            if (!finalAcc || finalAcc != '281') {
                forceSet('expenseaccount', '281', true);
            }

            try {
                rec.commitLine({ sublistId: 'expense' });
                console.log('Baris ' + i + ' Berhasil Commit. Task ID: ' + lineData.projectTask);
                log.debug('Line Committed', 'Index: ' + i);
            } catch (e) {
                console.error('Gagal Commit Baris ' + i + ': ' + e.message);
                log.debug('Commit Failed', e.message);
                rec.cancelLine({ sublistId: 'expense' });
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        rec.setValue({
            fieldId: 'custbody_amount_from_tor',
            value: totalAmount,
            ignoreFieldChange: true
        });
    } 
//     async function processDataAsync(data, rec) {
//     let totalAmount = 0;

//     for (let i = 0; i < data.length; i++) {
//         let lineData = data[i];
        
//         rec.selectNewLine({ sublistId: 'expense' });

//         const forceSet = (field, val, ignore) => {
//             if (val !== null && val !== undefined && val !== '') {
//                 rec.setCurrentSublistValue({
//                     sublistId: 'expense',
//                     fieldId: field,
//                     value: val,
//                     ignoreFieldChange: ignore
//                 });
//             }
//         };
        
//         forceSet('category', '1', true);
//         forceSet('expenseaccount', '281', true); 
//         forceSet('currency', '1', true);
        
//         if (data[0].date) {
//             let parsedDate = parseDateString(data[0].date);
//             forceSet('expensedate', parsedDate, true);
//         }

//         if (lineData.project) {
//             forceSet('customer', lineData.project, false); 
            
//             await new Promise(resolve => setTimeout(resolve, 800));

//             if (lineData.projectTask) {
//                 rec.setCurrentSublistValue({
//                     sublistId: 'expense',
//                     fieldId: 'projecttask',
//                     value: lineData.projectTask,
//                     ignoreFieldChange: true 
//                 });
//             }
//         }

//         if (lineData.amount) {
//             totalAmount += Number(lineData.amount);
//             forceSet('amount', lineData.amount, true);
//         }

//         // --- TAMBAHAN: SET VALUE UNTUK FIELD LIMIT TOR ---
//         if (lineData.custcol_amount_limit_from_tor) {
//             forceSet('custcol_amount_limit_from_tor', lineData.custcol_amount_limit_from_tor, true);
//         }
//         // -------------------------------------------------
        
//         if (lineData.description) {
//             forceSet('memo', lineData.description, true);
//         }

//         if (lineData.costCenter) forceSet('department', lineData.costCenter, true);
//         if (lineData.projectCode) forceSet('class', lineData.projectCode, true);
//         if (lineData.sof) forceSet('cseg_stc_sof', lineData.sof, true);
//         if (lineData.activityCode) forceSet('cseg_paactivitycode', lineData.activityCode, true);
//         if (lineData.bussinessUnit) forceSet('cseg1', lineData.bussinessUnit, true);
//         if (lineData.drc) forceSet('cseg_stc_drc_segmen', lineData.drc, true);
//         if (lineData.dea) forceSet('cseg_stc_segmentdea', lineData.dea, true);

//         let finalAcc = rec.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'expenseaccount' });
//         if (!finalAcc || finalAcc != '281') {
//             forceSet('expenseaccount', '281', true);
//         }

//         try {
//             rec.commitLine({ sublistId: 'expense' });
//             console.log('Baris ' + i + ' Berhasil Commit. Task ID: ' + lineData.projectTask);
//             log.debug('Line Committed', 'Index: ' + i);
//         } catch (e) {
//             console.error('Gagal Commit Baris ' + i + ': ' + e.message);
//             log.debug('Commit Failed', e.message);
//             rec.cancelLine({ sublistId: 'expense' });
//         }

//         await new Promise(resolve => setTimeout(resolve, 100));
//     }

//     rec.setValue({
//         fieldId: 'custbody_amount_from_tor',
//         value: totalAmount,
//         ignoreFieldChange: true
//     });
// }

    function parseDateString(dateStr) {
        var parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    function fieldChanged(context){
        try{
            var currentRecordObj = context.currentRecord;
            var sublistFieldName = context.fieldId;
            var sublistName = context.sublistId;
            var expReportTye = currentRecordObj.getValue('custbody_stc_expense_report_type');
            if(context.fieldId == 'custbody_stc_expense_report_type'){
                console.log('triggered')
                var expType = currentRecordObj.getValue('custbody_stc_expense_report_type');
                if(expType == '2' || expType == '3'){
                    eksekusiHide(context)
                }
            }
            if(expReportTye == '3' || expReportTye == '2'){
                if(sublistName == 'expense'){
                    if(sublistFieldName == 'custcol_stc_npwp_line'){
                        var nik = currentRecordObj.getCurrentSublistValue({
                            sublistId : 'expense',
                            fieldId : 'custcol_stc_npwp_line'
                        });
                        console.log('nik', nik);
                        if(nik){
                            var idTku = nik + '000000';
                            console.log('idTku', idTku)
                            if(idTku){
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId : 'expense',
                                    fieldId : 'custcol_stc_id_tku_penerima_penghasil',
                                    value : idTku
                                })
                            }
                        }
                    }
                    if(sublistFieldName == 'amount'){
                        var cekCategory = currentRecordObj.getCurrentSublistText({
                            sublistId : 'expense',
                            fieldId : 'category'
                        });
                        console.log('cekCategory', cekCategory);
                        if(cekCategory.includes('WHT') || cekCategory.includes('PPh')){
                            var amount = currentRecordObj.getCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount'
                            });

                            amount = parseFloat(amount) || 0;
                            console.log('amount', amount)
                            if (amount > 0) {
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    value: amount * -1,
                                    ignoreFieldChange: true
                                });
                                
                            }
                        }
                        
                    }
                    if (sublistFieldName === 'custcol_4601_witaxapplies') {

                        var applyingWht = currentRecordObj.getCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxapplies'
                        });
                        console.log('applyingWht', applyingWht)
                        if (applyingWht) {
                            console.log('masuk')
                            const suiteletUrl = url.resolveScript({
                                scriptId: "customscript_abj_sl_get_company_info",
                                deploymentId: "customdeploy_abj_sl_get_company_info",
                                params: {
                                }
                            });
                            console.log('suiteletUrl', suiteletUrl)
                            const response = https.get({ url: suiteletUrl });
                            console.log('response', response)
                            var idTkuPenjual = response.body;

                            console.log('idTKUPenjual', idTkuPenjual);

                            if (idTkuPenjual) {
                                console.log('masuk idTkuPenjual', idTkuPenjual)
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'custcol_stc_id_tku_pemotong_line',
                                    value: idTkuPenjual,
                                    ignoreFieldChange: true
                                });
                            }

                        } else {

                            currentRecordObj.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'custcol_stc_id_tku_pemotong_line',
                                value: '',
                                ignoreFieldChange: true
                            });
                        }
                    }

                    if(sublistFieldName == 'custcol_stc_kode_obj_pjk_line'){
                        var kodeObjectPajak = currentRecordObj.getCurrentSublistValue({
                            sublistId : 'expense',
                            fieldId : 'custcol_stc_kode_obj_pjk_line'
                        });
                        if(kodeObjectPajak){
                            var lookupKode = search.lookupFields({
                                type: "customrecord_stc_list_kode_objek_pajak",
                                id: kodeObjectPajak,
                                columns: ["custrecord_sos_tarif_obj_pajak"],
                            });
                            var tarif = lookupKode.custrecord_sos_tarif_obj_pajak;
                            console.log('tarif', tarif)
                            if(tarif){
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'custcol_stc_tarif_line',
                                    value: tarif,
                                    ignoreFieldChange: true
                                });
                            }
                        }
                    }
            
                }
            }
            if(context.fieldId == 'trandate'){
                var cekDate = currentRecordObj.getText('trandate');
                console.log('cekDate', cekDate)
                var nextFriday = getNextFridayObject(cekDate)
                console.log('nextFriday', nextFriday)
                if(nextFriday){
                    currentRecordObj.setValue({
                        fieldId : 'duedate',
                        value : nextFriday,
                        ignoreFieldChange : true
                    })
                }
            }
        }catch(e){
            log.debug('error', e)
        }
            
    }
    function validateLine(context){
        try{
            var currentRecordObj = context.currentRecord;
            var expReportTye = currentRecordObj.getValue('custbody_stc_expense_report_type');
            if(expReportTye == '3' || expReportTye == '2'){
                var sublistName = context.sublistId;

                if (sublistName !== 'expense') return true;

                var applyingWht = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_4601_witaxapplies'
                });

                if (!applyingWht) return true;

                var requiredFields = [
                    { id: 'custcol_stc_masa_pajak_line', label: 'Masa Pajak' },
                    { id: 'custcol_stc_tahun_pajak_line', label: 'Tahun Pajak' },
                    { id: 'custcol_stc_npwp_line', label: 'NIK / NPWP' },
                    { id: 'custcol_stc_vendor_name', label: 'Vendor Name' },
                    { id: 'custcol_stc_id_tku_pemotong_line', label: 'ID TKU Pemotong' },
                    { id: 'custcol_stc_id_tku_penerima_penghasil', label: 'ID TKU Penerima Penghasilan' },
                    { id: 'custcol_stc_fasilitas_line', label: 'Fasilitas' },
                    { id: 'custcol_stc_kode_obj_pjk_line', label: 'Kode Object Pajak' },
                    { id: 'custcol_stc_tarif_line', label: 'Tarif' },
                    { id: 'custcol_stc_jenis_dok_line', label: 'Jenis Dokumen' },
                    { id: 'custcol_stc_opsi_pembayaran_line', label: 'Opsi Pembayaran' }
                    
                ];

                for (var i = 0; i < requiredFields.length; i++) {
                    var field = requiredFields[i];

                    var value = currentRecordObj.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: field.id
                    });

                    if (value === '' || value === null || value === undefined) {
                        dialog.alert({
                            title: 'Warning!',
                            message: '<div style="color:red;">Field <b>' + field.label + '</b> tidak boleh kosong</div>'
                        });
                        return false;
                    }
                }
            }
           

            return true;
        }catch(e){
            log.debug('error', e)
        }
    }
    function saveRecord(context){
        var currentRecordObj = context.currentRecord;
        var expReportTye = currentRecordObj.getValue('custbody_stc_expense_report_type');
        if(expReportTye == '3' || expReportTye == '2'){
            var lineCount = currentRecordObj.getLineCount({
                sublistId: 'expense'
            });

            for (var i = 0; i < lineCount; i++) {

                var applyingWht = currentRecordObj.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_4601_witaxapplies',
                    line: i
                });

                if (applyingWht) {

                    if (i + 1 >= lineCount) {
                        dialog.alert({
                            title: 'Warning!',
                            message: '<div style="color:red;">Line WHT harus diikuti oleh line WHT / PPh di bawahnya</div>'
                        });
                        return false;
                    }


                    var nextCategory = currentRecordObj.getSublistText({
                        sublistId: 'expense',
                        fieldId: 'category',
                        line: i + 1
                    }) || '';

                    if (
                        !nextCategory.includes('WHT') &&
                        !nextCategory.includes('PPh')
                    ) {
                        dialog.alert({
                            title: 'Warning!',
                            message:
                                '<div style="color:red;">' +
                                'Line setelah WHT harus memiliki Category WHT atau PPh.<br>' +
                                'Error pada line ke-' + (i + 1) +
                                '</div>'
                        });
                        return false;
                    }
                }
            }
        }

        var cekDate = currentRecordObj.getText('trandate');
        console.log('cekDate', cekDate)
        var nextFriday = getNextFridayObject(cekDate)
        console.log('nextFriday', nextFriday)
        if(nextFriday){
            currentRecordObj.setValue({
                fieldId : 'duedate',
                value : nextFriday,
                ignoreFieldChange : true
            })
        }
        var cekExpType = currentRecordObj.getValue('custbody_stc_expense_report_type');
        if (cekExpType == '1') {
            var entity = currentRecordObj.getValue('entity');
            var cekTotalExp = parseFloat(currentRecordObj.getValue('total')) || 0;
            
            console.log('cekTotalExp', cekTotalExp);

            if (entity) {
                try {
                    const suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_abj_sl_get_employee_data',
                        deploymentId: 'customdeploy_abj_sl_get_employee_data',
                        params: {
                            employee_id: entity
                        }
                    });

                    const response = https.get({ url: suiteletUrl });
                    console.log('response', response)
                    if (response.body === 'no_data') {
                        return true; 
                    }
                    const data = JSON.parse(response.body);
                    console.log('data', data)
                    const empType = data.empType;
                    const isMaxAdvance = data.isMaxAdvance;
                    const maxAmount = data.maxAmount;
                    const lvEmployee = data.lvEmployee;

                    console.log('Data dari Suitelet:', data);
                    if (empType == '1' && (isMaxAdvance === true || isMaxAdvance === 'T')) {
                        if (cekTotalExp > maxAmount) {
                            alert('The advance amount can\'t be greater than Max Exclude Advance Amount (' + maxAmount + ')');
                            return false;
                        }
                    }
                    if (empType == '1' && (isMaxAdvance === false || isMaxAdvance === 'F')) {
                        
                        const level = lvEmployee.toString();

                        if (['4', '5', '6'].includes(level) && cekTotalExp > 30000000) {
                            console.log('masuk kondisi ini')
                            alert('The advance amount can\'t be greater than 30 million');
                            return false;
                        }

                        if (['2', '3'].includes(level) && cekTotalExp > 50000000) {
                            alert('The advance amount can\'t be greater than 50 million');
                            return false;
                        }
                    }
                } catch (e) {
                    console.error('Error calling Suitelet', e);
                }
            }
        }
         var currentUser = runtime.getCurrentUser();
        var userRole = currentUser.role;

        if (Number(userRole) === 15) {
            return true;
        }
        
        return validateApprover(context)
    }
        // =====================================================================
    // FUNGSI BUNGKUSAN UNTUK VALIDASI APPROVER
    // =====================================================================
    function validateApprover(scriptContext) {
        try {
            const rec = scriptContext.currentRecord;
            const recType = rec.type;
            const createdBy = rec.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
            const isNewRecord = !rec.id;
            const datecreated = isNewRecord ? new Date() : (rec.getValue('createddate') || new Date());

            let poType = null;
            if (recType === 'purchaseorder') {
                poType = rec.getValue('custbody_stc_po_type');
            }

            // PERBAIKAN DI SINI: Deteksi sublist tanpa menggunakan getSublists()
            const sublists = [];
            ['item', 'expense'].forEach(sublistId => {
                try {
                    const count = rec.getLineCount({ sublistId: sublistId });
                    if (count >= 0) {
                        sublists.push(sublistId);
                    }
                } catch (e) {
                    // Abaikan jika sublist tidak ada di tipe record ini
                }
            });

            // ---------------------------------------------------------------
            // PASS 1: baca semua line sekali jalan, kumpulkan id unik
            // ---------------------------------------------------------------
            const lineData = [];
            const sofIdSet = new Set();
            const deptIdSet = new Set();
            const itemIds = [];

            sublists.forEach(sublistId => {
                const lineCount = rec.getLineCount({ sublistId });
                for (let i = 0; i < lineCount; i++) {
                    const sofId = rec.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
                    if (!sofId) continue;

                    const costCenter = rec.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
                    const projectCode = rec.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';

                    let amountField;
                    if (sublistId === 'item') {
                        amountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
                    } else {
                        amountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
                        if (recType === 'purchaserequisition' || recType === 'purchasereq') amountField = 'estimatedamount';
                    }

                    const amount = parseFloat(rec.getSublistValue({ sublistId, fieldId: amountField, line: i })) || 0;
                    if (amount < 0) continue; 

                    let itemId = null;
                    if (sublistId === 'item') {
                        itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        if (itemId && itemIds.indexOf(itemId) === -1) itemIds.push(itemId);
                    }

                    sofIdSet.add(sofId);
                    if (costCenter) deptIdSet.add(costCenter);

                    lineData.push({ sublistId, line: i, sofId, costCenter, projectCode, amount, itemId });
                }
            });

            if (lineData.length === 0) return true; 

            const uniqueSofIds = Array.from(sofIdSet);
            const uniqueDeptIds = Array.from(deptIdSet);

            // ---------------------------------------------------------------
            // PASS 2: bulk reference lookup (masing-masing HANYA 1 call)
            // ---------------------------------------------------------------
            const itemAccountsMap = fetchItemAccountsBulk(itemIds);
            const sofCache = fetchSofBulk(uniqueSofIds);
            const deptCache = fetchDeptBulk(uniqueDeptIds);

            // ---------------------------------------------------------------
            // PASS 3: bentuk groupMap & financeMap (tanpa search tambahan)
            // ---------------------------------------------------------------
            const groupMap = {};
            const financeMap = {};

            lineData.forEach(ld => {
                const sofInfo = sofCache[ld.sofId] || { kreasi: false, finance: false };
                const isFinanceGrouping = sofInfo.finance;

                let groupLevel = 1;
                if (sofInfo.kreasi) {
                    groupLevel = 2;
                    if (ld.costCenter) {
                        const deptInfo = deptCache[ld.costCenter];
                        if (deptInfo && deptInfo.kreasi) groupLevel = 3;
                    }
                }

                const groupKey = groupLevel === 1
                    ? ld.sofId
                    : (groupLevel === 2 ? `${ld.sofId}_${ld.costCenter}` : `${ld.sofId}_${ld.costCenter}_${ld.projectCode}`);

                let account = '';
                if (ld.sublistId === 'item') {
                    account = (ld.itemId && itemAccountsMap[ld.itemId]) || '';
                } else {
                    const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
                    account = rec.getSublistValue({ sublistId: ld.sublistId, fieldId: fieldAcc, line: ld.line }) || '';
                }

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = {
                        sofId: ld.sofId, total: 0, account: account || null,
                        costCenter: ld.costCenter, projectCode: ld.projectCode,
                        groupLevel, isFinanceGrouping, lines: []
                    };
                }
                const g = groupMap[groupKey];
                g.total += ld.amount;
                if (!g.account && account) g.account = account;
                g.lines.push(ld.line);

                const finKey = isFinanceGrouping ? `${ld.sofId}_${ld.projectCode}` : ld.sofId;
                financeMap[finKey] = (financeMap[finKey] || 0) + ld.amount;
            });

            // ---------------------------------------------------------------
            // PASS 4: bulk search matrix (masing-masing HANYA 1 call)
            // ---------------------------------------------------------------
            const bhMatrixRows = fetchBudgetHolderMatrixBulk(uniqueSofIds);

            const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
            const isFinanceTipe = validFinanceTypes.indexOf(recType) !== -1;
            const finMatrixRows = isFinanceTipe ? fetchFinanceMatrixBulk(uniqueSofIds) : [];

            // ---------------------------------------------------------------
            // PASS 5: resolve approver mentah per group (in-memory, no search)
            // ---------------------------------------------------------------
            const groupResults = {};
            for (const key in groupMap) {
                const g = groupMap[key];
                const bh = resolveBudgetHolder(bhMatrixRows, g, createdBy);

                let fin = null;
                if (isFinanceTipe) {
                    const finKey = g.isFinanceGrouping ? `${g.sofId}_${g.projectCode}` : g.sofId;
                    const totalFinance = financeMap[finKey];
                    fin = resolveFinanceApprover(finMatrixRows, g.sofId, totalFinance, createdBy, recType, poType);
                }

                groupResults[key] = { bh, fin, lines: g.lines };
            }

            // ---------------------------------------------------------------
            // PASS 6: bulk cek substitute/delegasi untuk semua kandidat
            // ---------------------------------------------------------------
            const candidateIds = new Set();
            Object.keys(groupResults).forEach(key => {
                const r = groupResults[key];
                if (r.bh) candidateIds.add(r.bh);
                if (r.fin) candidateIds.add(r.fin);
            });
            const subCache = fetchSubstitutesBulk(Array.from(candidateIds));

            const missingLines = new Set();
            for (const key in groupResults) {
                let { bh, fin, lines } = groupResults[key];

                if (bh) {
                    const sub = applySubstitute(subCache[bh], datecreated);
                    if (sub) bh = sub;
                }
                if (fin) {
                    const sub = applySubstitute(subCache[fin], datecreated);
                    if (sub) fin = sub;
                }

                if (!bh || (isFinanceTipe && !fin)) {
                    lines.forEach(l => missingLines.add(l + 1)); 
                }
            }

            if (missingLines.size > 0) {
                const sortedLines = Array.from(missingLines).sort((a, b) => a - b);
                dialog.alert({
                    title: 'Approver Tidak Ditemukan',
                    message: 'Terdapat baris yang tidak mendapatkan approver (Budget Holder dan/atau Finance): baris '
                        + sortedLines.join(', ')
                        + '. Mohon periksa kembali SOF, Cost Center, atau Project Code pada baris tersebut sebelum menyimpan.'
                });
                return false;
            }

            return true;

        } catch (e) {
            log.error({ title: 'saveRecord validation error', details: e });
            dialog.alert({
                title: 'Validasi Gagal',
                message: 'Terjadi kesalahan saat memvalidasi approver: ' + (e && e.message ? e.message : e)
            });
            return false;
        }
    }

    // =====================================================================
    // HELPER FUNCTIONS (Di luar saveRecord agar kode rapi)
    // =====================================================================

    function isTrue(v) {
        return v === true || v === 'T' || v === 'true';
    }

    function fetchItemAccountsBulk(itemIds) {
        if (!itemIds.length) return {};
        try {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_get_item_in_bulk',
                deploymentId: 'customdeploy_abj_sl_get_item_in_bulk',
                params: { custscript_item_ids: JSON.stringify(itemIds) },
                returnExternalUrl: true
            });
            const response = https.get({ url: suiteletUrl });
            if (response.code === 200 && response.body && response.body.indexOf('<!DOCTYPE html>') === -1) {
                return JSON.parse(response.body);
            }
            log.error('Bulk Suitelet Error', 'Gagal memanggil suitelet. Response: ' + response.body);
        } catch (e) {
            log.error('HTTP Request Error', e.message);
        }
        return {};
    }

    function fetchSofBulk(sofIds) {
        const cache = {};
        if (!sofIds.length) return cache;
        const s = search.create({
            type: 'customrecord_cseg_stc_sof',
            filters: [['internalid', 'anyof', sofIds]],
            columns: ['internalid', 'custrecord_stc_sof_kreasi', 'custrecord_stc_grouping_for_finance']
        });
        s.run().each(res => {
            cache[res.getValue('internalid')] = {
                kreasi: isTrue(res.getValue('custrecord_stc_sof_kreasi')),
                finance: isTrue(res.getValue('custrecord_stc_grouping_for_finance'))
            };
            return true;
        });
        return cache;
    }

    function fetchDeptBulk(deptIds) {
        const cache = {};
        if (!deptIds.length) return cache;
        const s = search.create({
            type: 'department',
            filters: [['internalid', 'anyof', deptIds]],
            columns: ['internalid', 'custrecord_stc_kreasi']
        });
        s.run().each(res => {
            cache[res.getValue('internalid')] = {
                kreasi: isTrue(res.getValue('custrecord_stc_kreasi'))
            };
            return true;
        });
        return cache;
    }

    function fetchBudgetHolderMatrixBulk(sofIds) {
        const rows = [];
        if (!sofIds.length) return rows;
        const s = search.create({
            type: 'customrecord_stc_apprv_matrix_bdgt_holdr',
            filters: [
                ['custrecord_stc_sof', 'anyof', sofIds], 'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'custrecord_stc_sof',
                { name: 'custrecord_stc_max_limit_amnt', sort: search.Sort.ASC },
                'custrecord_stc_bdgt_hldr_approval',
                'custrecord_stc_bh_cost_center',
                'custrecord_stc_bh_project_code',
                'custrecord_stc_account'
            ]
        });
        s.run().each(res => {
            rows.push({
                sof: res.getValue('custrecord_stc_sof'),
                maxAmt: parseFloat(res.getValue('custrecord_stc_max_limit_amnt')) || 0,
                approver: res.getValue('custrecord_stc_bdgt_hldr_approval'),
                costCenter: res.getValue('custrecord_stc_bh_cost_center'),
                projectCode: res.getValue('custrecord_stc_bh_project_code'),
                account: res.getValue('custrecord_stc_account')
            });
            return true;
        });
        return rows;
    }

    function fetchFinanceMatrixBulk(sofIds) {
        const rows = [];
        if (!sofIds.length) return rows;
        const s = search.create({
            type: 'customrecord_stc_apprvl_mtrix_finance',
            filters: [
                ['custrecord_stc_sof_mtrx_finance', 'anyof', sofIds], 'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'custrecord_stc_sof_mtrx_finance',
                { name: 'custrecord_finance_max_amnt', sort: search.Sort.ASC },
                'custrecord_stc_apprvl_finance',
                'custrecord_stc_apprvl_finance_non_po'
            ]
        });
        s.run().each(res => {
            rows.push({
                sof: res.getValue('custrecord_stc_sof_mtrx_finance'),
                maxAmt: parseFloat(res.getValue('custrecord_finance_max_amnt')) || 0,
                apprPo: res.getValue('custrecord_stc_apprvl_finance'),
                apprNonPo: res.getValue('custrecord_stc_apprvl_finance_non_po')
            });
            return true;
        });
        return rows;
    }

    function fetchSubstitutesBulk(empIds) {
        const cache = {};
        if (!empIds.length) return cache;
        const s = search.create({
            type: 'employee',
            filters: [['internalid', 'anyof', empIds]],
            columns: [
                'internalid',
                'custentity_stc_subtitute_apprvl',
                'custentity_stc_delgtion_date_from',
                'custentity_stc_delegation_date_to'
            ]
        });
        s.run().each(res => {
            const subRaw = res.getValue('custentity_stc_subtitute_apprvl');
            cache[res.getValue('internalid')] = {
                substitute: subRaw ? String(subRaw).split(',')[0] : null,
                from: res.getValue('custentity_stc_delgtion_date_from'),
                to: res.getValue('custentity_stc_delegation_date_to')
            };
            return true;
        });
        return cache;
    }

    // =====================================================================
    // IN-MEMORY RESOLVERS
    // =====================================================================

    function resolveBudgetHolder(rows, g, createdBy) {
        const candidates = rows.filter(r => r.sof == g.sofId && r.maxAmt >= g.total);

        const tryMatch = (useAccount) => {
            const filtered = candidates
                .filter(r => useAccount ? (g.account && r.account == g.account) : !r.account)
                .sort((a, b) => a.maxAmt - b.maxAmt);

            for (const r of filtered) {
                if (g.groupLevel === 1 && !r.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
                if (g.groupLevel === 2 && r.costCenter == g.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
                if (g.groupLevel === 3 && r.costCenter == g.costCenter && r.projectCode == g.projectCode && r.approver != createdBy) return r.approver;
            }
            for (const r of filtered) {
                if (!r.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
            }
            return null;
        };

        if (g.account) {
            return tryMatch(true) || tryMatch(false);
        }
        return tryMatch(false);
    }

    function resolveFinanceApprover(rows, sofId, amount, createdBy, recordType, poType) {
        let rt = recordType;
        if (poType == 3) rt = 'non-po';
        const field = rt === 'purchaseorder' ? 'apprPo' : 'apprNonPo';

        const candidates = rows
            .filter(r => r.sof == sofId && r.maxAmt >= amount)
            .sort((a, b) => a.maxAmt - b.maxAmt);

        for (const r of candidates) {
            const approver = r[field];
            if (approver && approver != createdBy) return approver;
        }
        return null;
    }

    function applySubstitute(info, dateCreated) {
        if (!info || !info.substitute || !info.from || !info.to) return null;

        try {
            const dFromObj = format.parse({ value: info.from, type: format.Type.DATE });
            const dToObj = format.parse({ value: info.to, type: format.Type.DATE });
            const createdObj = dateCreated instanceof Date ? dateCreated : new Date(dateCreated);

            const toNum = (d) => {
                if (!d || isNaN(d.getTime())) return 0;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return parseInt(`${yyyy}${mm}${dd}`, 10);
            };

            let tglCreated = toNum(createdObj);
            let tglFrom = toNum(dFromObj);
            const tglTo = toNum(dToObj);

            if (tglCreated < tglFrom && (tglFrom - tglCreated === 1)) {
                tglFrom = tglCreated;
            }

            if (tglCreated >= tglFrom && tglCreated <= tglTo) {
                return info.substitute;
            }
        } catch (e) {
            log.debug('applySubstitute parse error', e.message);
        }
        return null;
    }
    return{
        fieldChanged : fieldChanged,
        validateLine : validateLine,
        saveRecord : saveRecord,
        pageInit : pageInit
    }
});