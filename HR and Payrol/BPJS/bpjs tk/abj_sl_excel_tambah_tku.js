/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode",], function(serverWidget,search,record,message,url,redirect, xml,file, encode){
    function onRequest(context){
        try{
            var allId = JSON.parse(context.request.parameters.allIdIr);
            log.debug('allid', allId);
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
                return true;
            });
        }catch(e){

        }
    }
    return{
        onRequest:onRequest
    }
});