/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        try{
            if(context.request.method === 'GET'){
                var allId = context.request.parameters.allid;
                log.debug('allId', allId);
                var allIdArray = allId.split(",");
                log.debug('allIdArray', allIdArray);
                var form = serverWidget.createForm({
                    title: "Data Upah BPJS Ketenagakerjaan",
                });
                var sublist_in = form.addSublist({
                    id: "custpage_sublist_data",
                    type: serverWidget.SublistType.LIST,
                    label: "Data Personalia",
                    tab: "matchedtab",
                });
                sublist_in.addField({
                    id: "custpage_sublist_internalid",
                    label: "internalid",
                    type: serverWidget.FieldType.TEXT,
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });;
                sublist_in.addField({
                    id: "custpage_sublist_nik",
                    label: "NIK",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_idemp",
                    label: "ID_PEGAWAI",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_kpj",
                    label: "KPJ",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_kodetk",
                    label: "KODE_TK",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_nama",
                    label: "NAMA_LENGKAP",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_tgl_lahir",
                    label: "TGL_LAHIR",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_upah",
                    label: "UPAH",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_rapel",
                    label: "RAPEL",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_blth",
                    label: "BLTH",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_npp",
                    label: "NPP",
                    type: serverWidget.FieldType.TEXT,
                });
                var customrecord_remunasiSearchObj = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                        ["custrecord_no_bpjs_ket","isnotempty",""], 
                        "AND",
                        ["custrecord3","anyof",allIdArray]
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
                        search.createColumn({name: "custrecord_abj_msa_period_akhir", label: "Pilih Period Masa Akhir"}),
                        search.createColumn({name: "custrecord_identitas_diri"}),
                        search.createColumn({name: "custrecord_no_npwp"})
                    ]
                });
                var searchResultCount = customrecord_remunasiSearchObj.runPaged().count;
                log.debug("customrecord_remunasiSearchObj result count",searchResultCount);
                var allData = [];
                var allIdEmp = [];
                customrecord_remunasiSearchObj.run().each(function(result){
                    var empId = result.getValue({
                        name : "custrecord3"
                    });
                    var empCode = result.getText({
                        name : "custrecord3"
                    });
                    var noId = result.getValue({
                        name : "custrecord_abj_msa_noid"
                    });
                    var kpj = result.getValue({
                        name : "custrecord_no_bpjs_ket"
                    });
                    
                    return true;
                })
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        onRequest : onRequest
    };
});