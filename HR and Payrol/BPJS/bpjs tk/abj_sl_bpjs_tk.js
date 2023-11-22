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
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000,
            });
            resultslice.forEach(function (slice) {
                searchResults.push(slice);
                searchid++;
            });
        } while (resultslice.length >= 1000);
        return searchResults;
    }

    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "BPJS Ketenaga Kerjaan",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var bulanSearch = form.addField({
                id: 'custpage_bulan_karir',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bulan',
            });
            
            // Add options for the months in Bahasa Indonesia
            bulanSearch.addSelectOption({
                value: '1',
                text: 'Januari'
            });
            bulanSearch.addSelectOption({
                value: '2',
                text: 'Februari'
            });
            bulanSearch.addSelectOption({
                value: '3',
                text: 'Maret'
            });
            bulanSearch.addSelectOption({
                value: '4',
                text: 'April'
            });
            bulanSearch.addSelectOption({
                value: '5',
                text: 'Mei'
            });
            bulanSearch.addSelectOption({
                value: '6',
                text: 'Juni'
            });
            bulanSearch.addSelectOption({
                value: '7',
                text: 'Juli'
            });
            bulanSearch.addSelectOption({
                value: '8',
                text: 'Agustus'
            });
            bulanSearch.addSelectOption({
                value: '9',
                text: 'September'
            });
            bulanSearch.addSelectOption({
                value: '10',
                text: 'Oktober'
            });
            bulanSearch.addSelectOption({
                value: '11',
                text: 'November'
            });
            bulanSearch.addSelectOption({
                value: '12',
                text: 'Desember'
            });
            bulanSearch.isMandatory = true
            var tahunSearch = form.addField({
                id: 'custpage_tahun_karir',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Tahun',
            });
            
            var currentYear = new Date().getFullYear();
            
            tahunSearch.addSelectOption({
                value: currentYear.toString(),
                text: currentYear.toString()
            });
            
            tahunSearch.addSelectOption({
                value: (currentYear + 1).toString(),
                text: (currentYear + 1).toString()
            });
            
            tahunSearch.addSelectOption({
                value: (currentYear + 2).toString(),
                text: (currentYear + 2).toString()
            });
            tahunSearch.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var bulan = context.request.parameters.custpage_bulan_karir;
                var tahun = context.request.parameters.custpage_tahun_karir;
                var bulanTahun = bulan + "/" +tahun
                log.debug('bulantahun', bulanTahun);
                var customrecord_remunasiSearchObj = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                        ["custrecord_no_bpjs_ket","isnotempty",""]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({name: "internalid"}),
                        search.createColumn({name: "custrecord3", label: "Emplyee"}),
                        search.createColumn({name: "custrecord_abj_msa_status_karyawan", label: "Status Karyawan"}),
                        search.createColumn({name: "custrecord_abj_msa_noid", label: "NIK / No.id Personalia"}),
                        search.createColumn({name: "custrecord_abj_msa_alamat", label: "Alamat"}),
                        search.createColumn({name: "custrecord_abj_msa_jenis_kelasmin", label: "Jenis Kelamin"}),
                        search.createColumn({name: "custrecord_bank_name", label: "Nama Bank"}),
                        search.createColumn({name: "custrecord_employee_bank_name", label: "Nama Pemegang Rekening"}),
                        search.createColumn({name: "custrecord_norek", label: "No. Rekening"}),
                        search.createColumn({name: "custrecord_kacab", label: "Kantor Cabang"}),
                        search.createColumn({name: "custrecord_no_npwp", label: "No. NPWP"}),
                        search.createColumn({name: "custrecord_status_wajib_pajak", label: "Status Wajib Pajak"}),
                        search.createColumn({name: "custrecord_no_bpjs_ket", label: "No. KPJ BPJS Ketenaga Kerjaan"}),
                        search.createColumn({name: "custrecord_no_bpjs_kes", label: "No. JKN KIS BPJS Kesehatan"}),
                        search.createColumn({name: "custrecord_abj_msa_tgl_efektif", label: "Tanggal Efektif"}),
                        search.createColumn({name: "custrecord_abj_msa_tgl_akhir", label: "Tanggal Masa Akhir Kerja"}),
                        search.createColumn({name: "custrecord_abj_msa_period_akhir", label: "Pilih Period Masa Akhir"})
                    ]
                });
                var searchResultCount = customrecord_remunasiSearchObj.runPaged().count;
                log.debug("customrecord_remunasiSearchObj result count",searchResultCount);
                var allData = [];
                var allIdEmp = [];
                customrecord_remunasiSearchObj.run().each(function(result){
                    var idKarir = result.getValue({
                        name : "internalid"
                    })
                    var empId = result.getValue({
                        name : "custrecord3"
                    })
                    var statusKaryawan = result.getValue({
                        name :"custrecord_abj_msa_status_karyawan"
                    });
                    var noIdPersonalia = result.getValue({
                        name : "custrecord_abj_msa_noid"
                    });
                    var alamat = result.getValue({
                        name : "custrecord_abj_msa_alamat"
                    });
                    var jenisKel = result.getValue({
                        name : "custrecord_abj_msa_jenis_kelasmin"
                    });
                    var bankName = result.getValue({
                        name : "custrecord_bank_name"
                    });
                    var empBank = result.getValue({
                        name : "custrecord_employee_bank_name"
                    });
                    var norek = result.getValue({
                        name : "custrecord_norek"
                    });
                    var kancab = result.getValue({
                        name : "custrecord_kacab"
                    });
                    var tglEfektif = result.getValue({
                        name : "custrecord_abj_msa_tgl_efektif"
                    });
                    var noBpjsket = result.getValue({
                        name : "custrecord_no_bpjs_ket"
                    });
                    if (tglEfektif) {
                        var tglEfektifDate = new Date(tglEfektif);
                        var tglEfektifBulanTahunArray = tglEfektif.split("/");
                        var tglEfektifBulan = parseInt(tglEfektifBulanTahunArray[1], 10);
                        var tglEfektifTahun = parseInt(tglEfektifBulanTahunArray[2], 10);
                        log.debug('tglEfektifBulan', tglEfektifBulan); log.debug('tglEfektifTahun', tglEfektifTahun)
                        if (tglEfektifBulan === parseInt(bulan) && tglEfektifTahun === parseInt(tahun)) {
                            allData.push({
                                empId : empId,
                                statusKaryawan : statusKaryawan,
                                noIdPersonalia : noIdPersonalia,
                                alamat : alamat,
                                jenisKel : jenisKel,
                                bankName : bankName,
                                empBank : empBank,
                                norek : norek,
                                kancab : kancab,
                                noBpjsket : noBpjsket,
                            });
                            allIdEmp.push(idKarir)
                        }
                    }
                    
                    log.debug('tglEfektif', tglEfektif);
                
                    return true;
                });
                log.debug('allIdEmp', allIdEmp);
                var linkFormDownloadTk = 'https://9342705.app.netsuite.com/app/site/hosting/scriptlet.nl?script=700&deploy=1'
                var sublist_in = form.addSublist({
                    id: "custpage_sublist_data",
                    type: serverWidget.SublistType.LIST,
                    label: "BPJS Ketenaga Kerjaan",
                    tab: "matchedtab",
                });
                sublist_in.addField({
                    id: "custpage_sublist_file",
                    label: "File BPJS Ketenagakerjaan",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_aksi",
                    label: "Aksi",
                    type: serverWidget.FieldType.TEXT,
                });
                if(allIdEmp.length > 0){
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_file",
                        value: "File SIPP - Unggah Tambah Tenaga Kerja",
                        line: 0,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_aksi",
                        value: "<a href='" + linkFormDownloadTk + "&allid=" + allIdEmp + "' target='_blank'>Aksi</a>",
                        line: 0,
                    });
    
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_file",
                        value: "File SIPP - Non Aktif Tenaga Kerja",
                        line: 1,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_aksi",
                        value: "Link",
                        line: 1,
                    });
    
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_file",
                        value: "File SIPP - Data Upah BPJS Ketnaker",
                        line: 2,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_aksi",
                        value: "Link",
                        line: 2,
                    });
    
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_file",
                        value: "File Laporan BPJS Ketnaker",
                        line: 3,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_aksi",
                        value: "Link",
                        line: 3,
                    });
                }
                
                context.response.writePage(form);
            }
        }catch(e){
            log.debug('error', e);
        }
    }
   
    return {
        onRequest: onRequest,
    };
});