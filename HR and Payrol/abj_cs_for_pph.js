/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        var vrecord = context.currentRecord;
        var namaPerusahaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_nama_perusahaan'
        });
        namaPerusahaan.isDisplay = false;

        var npwpPerusahaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_npwp_perusahaan'
        });
        npwpPerusahaan.isDisplay = false;

        var namaPimpinan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_nama_pimpinan'
        });
        namaPimpinan.isDisplay = false;

        var npwpPimpinan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_npwp_pimpinan'
        });
        npwpPimpinan.isDisplay = false;

        var kpercobaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_ktp'
        });
        kpercobaan.isDisplay = false;

        var kpermanen = vrecord.getField({
            fieldId : 'custrecordabj_msa_ktp_permanen'
        });
        kpermanen.isDisplay = false;

        var kpkwt = vrecord.getField({
            fieldId : 'custrecord_abj_msa_pkwt'
        });
        kpkwt.isDisplay = false;

        var kpkwt = vrecord.getField({
            fieldId : 'custrecord_abj_msa_pkwt'
        });
        kpkwt.isDisplay = false;

        var klepas = vrecord.getField({
            fieldId : 'custrecord_abj_msa_karyawan_lepas'
        });
        klepas.isDisplay = false;

        var kta = vrecord.getField({
            fieldId : 'custrecord_abj_msa_tenaga_ahli'
        });
        kta.isDisplay = false;

        var kma = vrecord.getField({
            fieldId : 'custrecord_abj_msa_karyawan_magang'
        });
        kma.isDisplay = false;

        var nilaiPTKP = vrecord.getField({
            fieldId : 'custrecord_abj_msa_ptkp_wajib'
        });
        nilaiPTKP.isDisplay = false;

        var ptkpistri = vrecord.getField({
            fieldId : 'custrecord_abj_msa_ptkp_istri'
        });
        ptkpistri.isDisplay = false;


    }
    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        var fieldName = context.fieldId;
        if(fieldName == 'custrecord_abj_msa_is_pph21'){
            var isPPH21 = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_is_pph21'
            });
            if (isPPH21 === true){
                var namaPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nama_perusahaan'
                });
                namaPerusahaan.isDisplay = true;
        
                var npwpPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npwp_perusahaan'
                });
                npwpPerusahaan.isDisplay = true;
        
                var namaPimpinan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nama_pimpinan'
                });
                namaPimpinan.isDisplay = true;
        
                var npwpPimpinan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npwp_pimpinan'
                });
                npwpPimpinan.isDisplay = true;
        
                var kpercobaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ktp'
                });
                kpercobaan.isDisplay = true;
        
                var kpermanen = vrecord.getField({
                    fieldId : 'custrecordabj_msa_ktp_permanen'
                });
                kpermanen.isDisplay = true;
        
                var kpkwt = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_pkwt'
                });
                kpkwt.isDisplay = true;
        
                var kpkwt = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_pkwt'
                });
                kpkwt.isDisplay = true;
        
                var klepas = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_karyawan_lepas'
                });
                klepas.isDisplay = true;
        
                var kta = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_tenaga_ahli'
                });
                kta.isDisplay = true;
        
                var kma = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_karyawan_magang'
                });
                kma.isDisplay = true;
        
                var nilaiPTKP = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ptkp_wajib'
                });
                nilaiPTKP.isDisplay = true;
        
                var ptkpistri = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ptkp_istri'
                });
                ptkpistri.isDisplay = true;

                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_ptkp_wajib',
                    value: 54000000,
                    ignoreFieldChange: true
                })
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_ptkp_istri',
                    value: 4500000,
                    ignoreFieldChange: true
                })
            }else{
                var namaPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nama_perusahaan'
                });
                namaPerusahaan.isDisplay = false;
        
                var npwpPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npwp_perusahaan'
                });
                npwpPerusahaan.isDisplay = false;
        
                var namaPimpinan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nama_pimpinan'
                });
                namaPimpinan.isDisplay = false;
        
                var npwpPimpinan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npwp_pimpinan'
                });
                npwpPimpinan.isDisplay = false;
        
                var kpercobaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ktp'
                });
                kpercobaan.isDisplay = false;
        
                var kpermanen = vrecord.getField({
                    fieldId : 'custrecordabj_msa_ktp_permanen'
                });
                kpermanen.isDisplay = false;
        
                var kpkwt = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_pkwt'
                });
                kpkwt.isDisplay = false;
        
                var kpkwt = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_pkwt'
                });
                kpkwt.isDisplay = false;
        
                var klepas = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_karyawan_lepas'
                });
                klepas.isDisplay = false;
        
                var kta = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_tenaga_ahli'
                });
                kta.isDisplay = false;
        
                var kma = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_karyawan_magang'
                });
                kma.isDisplay = false;
        
                var nilaiPTKP = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ptkp_wajib'
                });
                nilaiPTKP.isDisplay = false;
        
                var ptkpistri = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_ptkp_istri'
                });
                ptkpistri.isDisplay = false;
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };
});