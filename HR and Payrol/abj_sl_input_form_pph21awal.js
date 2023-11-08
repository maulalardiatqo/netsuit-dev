/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file"
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file
){
    
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: "Upload Masal PPh 21/26 Awal",
        });
        try{
            if (context.request.method === 'GET') {
                var choseFile = form.addField({
                    id: 'custpage_uploadfile',
                    type: serverWidget.FieldType.FILE,
                    label: 'Pilih File',
                });
                form.addSubmitButton({
                    label: 'Upload File'
                });
                context.response.writePage(form);
            }else{
                var fileObj = contextRequest.files.custpage_uploadfile;
                var fileName = fileObj.name;
                var fileContent = fileObj.getContents();
                
                log.debug('FileName', fileName);
                log.debug('FileContent', fileContent);

                var lines = fileContent.split('\n');
                var columnNames = lines[0].split(',');

                var data = [];
                for (var i = 1; i < lines.length; i++) {
                    var rowData = lines[i].split(',');
                    var rowObject = {};
                    for (var j = 0; j < columnNames.length; j++) {
                        rowObject[columnNames[j]] = rowData[j];
                    }
                    data.push(rowObject);
                }
                log.debug('Column Names', columnNames);
                log.debug('Data', data);

                for (var i = 0; i < data.length; i++) {
                    var rowData = data[i];
                    log.debug('Row ' + (i + 1), rowData);
                    var cekNo = rowData.No;
                    
                    if(cekNo){
                        log.debug('cekNo', cekNo);
                        var no = rowData.No;
                        var tahun = rowData.Tahun;
                        var idPersonalia = rowData["ID Personalia"];
                        var nama = rowData.Nama;
                        var idEmp = rowData[" internalid Personalia"];
                        var hireDate = rowData["Tanggal Mulai Kerja"];
                        var fromMonth = rowData["Dari Bulan"];
                        var toMonth = rowData["Sampai Bulan"];
                        var gaji = rowData["Gaji/Pensiun/THT"];
                        var tunjangan = rowData["Tunlangan PPh"];
                        var lainya = rowData["Tunjangan Lainnya"];
                        var lembur = rowData["Uang Lembur dan sebagainya"];
                        var honor = rowData["Honorarium dan Imbalan Lain Sejenisnya"];
                        var premi = rowData["Premi Asuransi yang Dibayar Pemberi Kerja"];
                        var natura = rowData["Penerimaan dalam Bentuk Natura dan Kenikmatan Lainnya yang Dikenakan Pemotongan PPh Pasal 21"];
                        var tantiem = rowData["Tantiem Bonus Gratifikasi Jasa Produksi dan THR"];
                        var iuran = rowData["Iuran Pensiun atau Iuran THT/JHT"];
                        var pph21terbayar = rowData["PPh21/26 Terbayar"];
                        var netobef = rowData["Penghasilan Neto Masa Sebelumnya"];
                        var pph21bef = rowData["PPh21 Yang Telah Dipotong Masa Sebelumnya"];
                        
                        log.debug('idEmp', idEmp);
                        log.debug('allData', {no:no, tahun:tahun, idPersonalia:idPersonalia, nama:nama, hireDate:hireDate, fromMonth : fromMonth, toMonth:toMonth,idEmp:idEmp})
                        var searchPPh = search.create({
                            type : 'customrecord_abj_msa_pph21awal',
                            filters : ["custrecord_abj_msa_id_personalia","is",idEmp],
                            columns : ["custrecord_abj_msa_id_personalia"]
                        });
                        var searchPPhSet = searchPPh.run()
                        var searchPPhResult = searchPPhSet.getRange({
                            start: 0,
                            end: 1
                        });
                        if(searchPPhResult.length > 0){
                            log.debug('ada data')
                            var recpphawal = record.load({
                                type: 'customrecord_abj_msa_pph21awal',
                                id : internalidpph,
                                isDynamic: false
                            })
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_from_month',
                                value: from,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_ke_bulan',
                                value: to,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_gaji_pen',
                                value: gaji,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_tunjangan_pph',
                                value: tunjangan,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_tunjanganlainya',
                                value: lainya,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecordabj_msa_honorarium',
                                value: honor,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecordabj_msa_premi_asuransi',
                                value: premi,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_natura',
                                value: natura,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_tantiem',
                                value: tantiem,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_iuran_pensiun',
                                value: iuran,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_pph_terbayar',
                                value: pphterbayar,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_neto_bef',
                                value: netobef,
                                ignoreFieldChange: true
                            });
                            recpphawal.setValue({
                                fieldId: 'custrecord_abj_msa_pph21_bef',
                                value: pphbef,
                                ignoreFieldChange: true
                            });
                            var updtSave = recpphawal.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                        }
                    }
                    
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        onRequest: onRequest
    };
});