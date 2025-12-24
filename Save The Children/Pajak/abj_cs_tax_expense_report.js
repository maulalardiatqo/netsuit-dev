/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function fieldChanged(context){
        try{
            var currentRecordObj = context.currentRecord;
            var sublistFieldName = context.fieldId;
            var sublistName = context.sublistId;
            var expReportTye = currentRecordObj.getValue('custbody_stc_expense_report_type');
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

       
        return true
    }
    return{
        fieldChanged : fieldChanged,
        validateLine : validateLine,
        saveRecord : saveRecord
    }
});