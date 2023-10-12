/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        var vrecord = context.currentRecord;
        // hide bpjs kesehatan
        var kodeBU = vrecord.getField({
            fieldId : 'custrecord_abj_msa_kode_badan_usaha'
        });
        kodeBU.isDisplay = false;

        var prosentPerusahaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_prosent_perusahaan'
        });
        prosentPerusahaan.isDisplay = false;

        var prosentPersonalia = vrecord.getField({
            fieldId : 'custrecord_abj_msa_prosentase_personalia'
        });
        prosentPersonalia.isDisplay = false;

        var basisPenggali = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jks_basis_penggali'
        });
        basisPenggali.isDisplay = false;

        var nilaiMaxBasisPenggali = vrecord.getField({
            fieldId : 'custrecord_abj_msa_nilai_mkas_jks'
        });
        nilaiMaxBasisPenggali.isDisplay = false
        // hide bpjs ketenaga kerjaan
        var npp = vrecord.getField({
            fieldId : 'custrecord_abj_msa_npp'
        });
        npp.isDisplay = false

        var basisPenggaliBPJSTen = vrecord.getField({
            fieldId : 'custrecord_abj_msa_basis_penggali'
        });
        basisPenggaliBPJSTen.isDisplay = false;

        var jkk = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jkk'
        });
        jkk.isDisplay = false

        var jkm = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jkm'
        });
        jkm.isDisplay = false

        var jht = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jht'
        });
        jht.isDisplay = false;

        var jhtPerson = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jht_personalia'
        });
        jhtPerson.isDisplay = false;

        var isJHTpph = vrecord.getField({
            fieldId : 'custrecord_abj_msa_is_jht_pph21'
        });
        isJHTpph.isDisplay = false;

        var isJp = vrecord.getField({
            fieldId : 'custrecord_abj_msa_is_jp'
        });
        isJp.isDisplay = false;

        var jpPerusahaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_is_jp_pph21'
        });
        jpPerusahaan.isDisplay = false;

        var jpDiPerusahaan = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jp_perusahaan'
        }); 
        jpDiPerusahaan.isDisplay = false;

        var jpPersonal = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jp_personalia'
        });
        jpPersonal.isDisplay = false;

        var nilaiMaxJP = vrecord.getField({
            fieldId : 'custrecord_abj_msa_nilai_maksimaljp'
        });
        nilaiMaxJP.isDisplay = false;

        var isWna = vrecord.getField({
            fieldId : 'custrecord_abj_msa_is_wna_jp'
        });
        isWna.isDisplay = false;

        var isUsia = vrecord.getField({
            fieldId : 'custrecord_abj_msa_is_usia_jp'
        });
        isUsia.isDisplay = false
    }
    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        var fieldName = context.fieldId;
        var fieldIsJp = false;
        if(fieldName == 'custrecord_abj_msa_is_bpjs_ketenagakerja'){
            var isBPJSktg = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_is_bpjs_ketenagakerja'
            });
            if(isBPJSktg == '1'){
                var npp = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npp'
                });
                npp.isDisplay = true
        
                var basisPenggaliBPJSTen = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_basis_penggali'
                });
                basisPenggaliBPJSTen.isDisplay = true;
        
                var jkk = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jkk'
                });
                jkk.isDisplay = true
        
                var jkm = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jkm'
                });
                jkm.isDisplay = true
        
                var jht = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jht'
                });
                jht.isDisplay = true;
        
                var jhtPerson = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jht_personalia'
                });
                jhtPerson.isDisplay = true;
        
                var isJHTpph = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jht_pph21'
                });
                isJHTpph.isDisplay = true;
        
                var isJp = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jp'
                });
                isJp.isDisplay = true;
        
                var isWna = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_wna_jp'
                });
                isWna.isDisplay = true;
        
                var isUsia = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_usia_jp'
                });
                isUsia.isDisplay = true
                
            }else{
                fieldIsJp = false
                var npp = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_npp'
                });
                npp.isDisplay = false
        
                var basisPenggaliBPJSTen = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_basis_penggali'
                });
                basisPenggaliBPJSTen.isDisplay = false;
        
                var jkk = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jkk'
                });
                jkk.isDisplay = false
        
                var jkm = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jkm'
                });
                jkm.isDisplay = false
        
                var jht = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jht'
                });
                jht.isDisplay = false;
        
                var jhtPerson = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jht_personalia'
                });
                jhtPerson.isDisplay = false;
        
                var isJHTpph = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jht_pph21'
                });
                isJHTpph.isDisplay = false;
        
                var isJp = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jp'
                });
                isJp.isDisplay = false;
        
                var isWna = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_wna_jp'
                });
                isWna.isDisplay = false;
        
                var isUsia = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_usia_jp'
                });
                isUsia.isDisplay = false
                var jpPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jp_pph21'
                });
                jpPerusahaan.isDisplay = false;
        
                var jpDiPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_perusahaan'
                }); 
                jpDiPerusahaan.isDisplay = false;
        
                var jpPersonal = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_personalia'
                });
                jpPersonal.isDisplay = false;
        
                var nilaiMaxJP = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nilai_maksimaljp'
                });
                nilaiMaxJP.isDisplay = false;
            }
           
        }
        if(fieldName == 'custrecord_abj_msa_is_jp'){
            var fieldIsJpCheck = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_is_jp'
            });
            if(fieldIsJpCheck == true){
                vrecord.setValue({
                    fieldId : 'custrecord_abj_msa_nilai_maksimaljp',
                    value : 9559600,
                    ignoreFieldChange : true
                })
                fieldIsJp = true
            }else{
                vrecord.setValue({
                    fieldId : 'custrecord_abj_msa_nilai_maksimaljp',
                    value : 0,
                    ignoreFieldChange : true
                })
                fieldIsJp = false
            }
            if(fieldIsJp == true){
                var jpPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jp_pph21'
                });
                jpPerusahaan.isDisplay = true;
        
                var jpDiPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_perusahaan'
                }); 
                jpDiPerusahaan.isDisplay = true;
        
                var jpPersonal = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_personalia'
                });
                jpPersonal.isDisplay = true;
        
                var nilaiMaxJP = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nilai_maksimaljp'
                });
                nilaiMaxJP.isDisplay = true;
            
            }else{
                var jpPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_is_jp_pph21'
                });
                jpPerusahaan.isDisplay = false;
        
                var jpDiPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_perusahaan'
                }); 
                jpDiPerusahaan.isDisplay = false;
        
                var jpPersonal = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jp_personalia'
                });
                jpPersonal.isDisplay = false;
        
                var nilaiMaxJP = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nilai_maksimaljp'
                });
                nilaiMaxJP.isDisplay = false;
            
            }
            
        }
        
        if (fieldName == "custrecord_abj_msa_jht") {
            var valJht = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_jht'
            });
            console.log('valJHT', valJht);
            if(valJht == '1'){
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_jht_personalia',
                    value: 2,
                    ignoreFieldChange: true
                })
            }else{
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_jht_personalia',
                    value: 0,
                    ignoreFieldChange: true
                })
            }
        }

        // BPJS Kesehatan
        if(fieldName == 'custrecord_abj_msa_is_bpj_kes'){
            var checkBPJSKes = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_is_bpj_kes'
            }); 
            if(checkBPJSKes == true){
                var kodeBU = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_kode_badan_usaha'
                });
                kodeBU.isDisplay = true;
        
                var prosentPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_prosent_perusahaan'
                });
                prosentPerusahaan.isDisplay = true;
        
                var prosentPersonalia = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_prosentase_personalia'
                });
                prosentPersonalia.isDisplay = true;
        
                var basisPenggali = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jks_basis_penggali'
                });
                basisPenggali.isDisplay = true;
        
                var nilaiMaxBasisPenggali = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nilai_mkas_jks'
                });
                nilaiMaxBasisPenggali.isDisplay = true
            }else{
                var kodeBU = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_kode_badan_usaha'
                });
                kodeBU.isDisplay = false;
        
                var prosentPerusahaan = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_prosent_perusahaan'
                });
                prosentPerusahaan.isDisplay = false;
        
                var prosentPersonalia = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_prosentase_personalia'
                });
                prosentPersonalia.isDisplay = false;
        
                var basisPenggali = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_jks_basis_penggali'
                });
                basisPenggali.isDisplay = false;
        
                var nilaiMaxBasisPenggali = vrecord.getField({
                    fieldId : 'custrecord_abj_msa_nilai_mkas_jks'
                });
                nilaiMaxBasisPenggali.isDisplay = false
            }
        }
        if(fieldName == 'custrecord_abj_msa_prosent_perusahaan'){
            var prosent = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_prosent_perusahaan'
            });
            console.log('prosent', prosent);
            if(prosent == '1'){
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_prosentase_personalia',
                    value: 0,
                    ignoreFieldChange: true
                })
            }else{
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_prosentase_personalia',
                    value: 1,
                    ignoreFieldChange: true
                })
            }
        }
        if(fieldName == 'custrecord_abj_msa_jks_basis_penggali'){
            vrecord.setValue({
                fieldId: 'custrecord_abj_msa_nilai_mkas_jks',
                value: 12000000,
                ignoreFieldChange: true
            })
        }
        if(fieldName == 'custrecord_abj_msa_jp_perusahaan'){
            var jpProsent = vrecord.getValue({
                fieldId : 'custrecord_abj_msa_jp_perusahaan'
            });
            console.log('jpProsent', jpProsent);
            if(jpProsent == '1'){
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_jp_personalia',
                    value: 1,
                    ignoreFieldChange: true
                })
            }else{
                vrecord.setValue({
                    fieldId: 'custrecord_abj_msa_jp_personalia',
                    value: 0,
                    ignoreFieldChange: true
                })
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };
});