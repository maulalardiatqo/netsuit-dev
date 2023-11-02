/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        function onRequest(context) {
            try{
                var tahun = context.request.parameters.tahun;
                var employeId = context.request.parameters.employId
                var month = 12;
                var tahun2Digit = tahun.substring(tahun.length - 2);
                var noUrut = '0000003';
                var logo = 7062
                var filelogo;
                var urlLogo = '';
                if (logo) {
                    filelogo = file.load({
                        id: logo
                    });
                    urlLogo = filelogo.url.replace(/&/g, "&amp;");
                }

                var recSubsidiary = record.load({
                    type: "subsidiary",
                    id: 1,
                    isDynamic: false,
                });

                var legalName = recSubsidiary.getValue('legalname');
                // log.debug('legalName', legalName);
                // log.debug('tahun', tahun);
                // log.debug('employeId', employeId);
                // log.debug('urlLogo', urlLogo);

                var npwp1 = '00';
                var npwp2 = '000';
                var npwp3 = '000';
                var npwp4 = '0'
                var npwp5 = '000';
                var npwp6 = '000';
                var alamat1 = '';
                var alamat2 = '';

                var ptkpK;
                var jumlahPtkp = 0;
                var ptkpTK;
                var statusKaryawan = '';
                var searchRemu = search.create({
                    type : 'customrecord_remunasi',
                    filters : [["custrecord3","is",employeId]],
                    columns : ['custrecord_no_npwp', 'custrecord_abj_msa_noid', 'custrecord3', 'custrecord_abj_msa_alamat', 'custrecord_abj_msa_jenis_kelasmin', 'custrecord_status_wajib_pajak', 'custrecord_abj_msa_status_karyawan']
                });
                var searchRemuSet = searchRemu.run();
                var searchRemuResult = searchRemuSet.getRange({
                    start: 0,
                    end: 1,
                });
                if(searchRemuResult.length > 0){
                    var recRemu = searchRemuResult[0];
                    var noNpWp = recRemu.getValue({
                        name : 'custrecord_no_npwp'
                    });
                    var nik = recRemu.getValue({
                        name : 'custrecord_abj_msa_noid'
                    });
                    var empName = recRemu.getText({
                        name : 'custrecord3'
                    });
                    var alamat = recRemu.getValue({
                        name : 'custrecord_abj_msa_alamat'
                    });
                    var jenisKelamin = recRemu.getValue({
                        name : 'custrecord_abj_msa_jenis_kelasmin'
                    });
                    var ptkp = recRemu.getText({
                        name : 'custrecord_status_wajib_pajak'
                    });
                    var ptkpId = recRemu.getValue({
                        name : 'custrecord_status_wajib_pajak'

                    });
                    var karyawanStat = recRemu.getValue({
                        name : 'custrecord_abj_msa_status_karyawan'
                    });
                    if(karyawanStat){
                        statusKaryawan = karyawanStat
                    }
                    var ptkpMatch = ptkp.match(/K\/(.+)|TK\/(.+)/);
                    // log.debug('alamat', alamat)
                    var jumlahKarakter = alamat.length;
                    // log.debug('jumlahKarakter', jumlahKarakter);
                    if (jumlahKarakter > 41) {
                        var indexPemisah = 41;
                        while (alamat.charAt(indexPemisah) !== ' ' && indexPemisah > 0) {
                            indexPemisah--;
                        }
                    
                        if (indexPemisah === 0) {
                            indexPemisah = 41;
                        }
                    
                        var bagianPertama = alamat.substring(0, indexPemisah);
                        var bagianKedua = alamat.substring(indexPemisah + 1);
                        alamat1 = bagianPertama;
                        alamat2 = bagianKedua;
                    }else{
                        alamat1 = alamat
                    }
                    if (ptkpMatch) {
                        ptkpK = ptkpMatch[1] || '';
                        ptkpTK = ptkpMatch[2] || '';
                    }
                    if(noNpWp){
                        npwp1 = noNpWp.substring(0, 2);
                        npwp2 = noNpWp.substring(2, 5);
                        npwp3 = noNpWp.substring(5, 8);
                        npwp4 = noNpWp.substring(8, 9);
                        npwp5 = noNpWp.substring(9, 12);
                        npwp6 = noNpWp.substring(12, 15);
                    }
                    log.debug('ptkp', ptkp)
                    if(ptkp){
                        var searchPtkp = search.create({
                            type: "customrecord_ptpk",
                            filters:
                            [
                                ["internalid","anyof",ptkpId]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custrecord_jumlah_ptpk", label: "Jumlah PTPK"})
                            ]
                        });
                        var searchPtkpSet = searchPtkp.run();
                        var searchPtkpResult = searchPtkpSet.getRange({
                            start: 0,
                            end: 1,
                        });
                        if(searchPtkpResult.length > 0){
                            var recPtkp = searchPtkpResult[0]
                            var jumPtkp = recPtkp.getValue({
                                name: "custrecord_jumlah_ptpk"
                            })
                            jumlahPtkp = jumPtkp
                            
                        }
                    }
                }
                
                var Gabung1 = npwp1 + "." + npwp2 + "." + npwp3 + "." + npwp4;
                // log.debug('statusKaryawan', statusKaryawan);
                var jobEmp = '';
                var searchEmp = search.create({
                    type: search.Type.EMPLOYEE,
                    filters : [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: employeId
                    }],
                    columns : ['title']
                });
                var searchEmpSet = searchEmp.run();
                var searchEmpResult = searchEmpSet.getRange({
                    start: 0,
                    end: 1,
                });
                if(searchEmpResult.length > 0){
                    var empRec = searchEmpResult[0]
                    var jobTitle = empRec.getValue({
                        name : 'title'
                    });
                    if(jobTitle){
                        jobEmp = jobTitle
                    }
                }

                var customrecord_msa_remunerasiSearchObj = search.create({
                    type: "customrecord_msa_remunerasi",
                    filters:
                    [
                        ["custrecord_remunerasi_employee","anyof",employeId]
                    ],
                    columns:
                    [
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "custrecord_remunerasi_employee", label: "Employee"}),
                    search.createColumn({
                        name: "custrecord_id_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                        label: "Komponen Pendapatan"
                    }),
                    search.createColumn({
                        name: "custrecord_jumlah_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                        label: "Jumlah"
                    }),
                    search.createColumn({
                        name: "custrecord_msa_id_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                        label: "Komponen Potongan"
                    }),
                    search.createColumn({
                        name: "custrecord_msa_jumlah_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                        label: "Jumlah"
                    })
                    ]
                });
                var searchResultCount = customrecord_msa_remunerasiSearchObj.runPaged().count;
                var gajiPokokSetahun = 0;
                var gajiPokok = 0;
                var tunjanganLainya = 0;
                var honorarium = 0;
                var natura = 0;
                var thr = 0;
                var tantiem = 0;
                var iuranPenjsiunJHT = 0;
                var pendapatan = [];
                var potongan = [];
                var tunjangan = 0;
                var premi = 0;
                customrecord_msa_remunerasiSearchObj.run().each(function(result){
                    var gajiPokokCount = 0;
                    var komponenPendapatan = result.getValue({
                        name: "custrecord_id_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                    });
                    var jumlahPendapatan = result.getValue({
                        name: "custrecord_jumlah_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                    });
                    var komponenPotongan = result.getValue({
                        name: "custrecord_msa_id_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    });
                    var jumlahPotongan = result.getValue({
                        name: "custrecord_msa_jumlah_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    })
                    if (komponenPendapatan){
                        var searchType = search.create({
                            type: "customrecord_msa_komponen_pendapatan",
                            filters:
                            [
                                ["id","equalto",komponenPendapatan]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custrecord_msa_type_salary", label: "Type"}),
                                search.createColumn({name: "custrecord_msa_pend_is_pph", label: "Is PPh 21"}),
                                search.createColumn({name: "custrecord_msa_pend_typea1", label: "Type A1"})
                            ]
                        });
                        var searchResultSet = searchType.run();
                        searchType = searchResultSet.getRange({
                            start : 0,
                            end : 1
                        });
                        if(searchType.length > 0){
                            var rectype = searchType[0]
                            var typeKomponen = rectype.getValue({
                                name : 'custrecord_msa_type_salary'
                            });
                            // log.debug('typeKomponen', typeKomponen);
                            if(typeKomponen == '1'){
                                gajiPokokCount = jumlahPendapatan
                            }
                            if(typeKomponen == '2'){
                                thr += Number(jumlahPendapatan)
                            }
                            if(typeKomponen == '7'){
                                tunjangan = jumlahPendapatan
                            }
                            var typeA1 = rectype.getValue({
                                name: "custrecord_msa_pend_typea1"
                            });
                            var typeA1Text = rectype.getText({
                                name: "custrecord_msa_pend_typea1"
                            });
                            // log.debug('typeA1', {typeA1 : typeA1, typeA1Text : typeA1Text});

                            if(typeA1 =='5'){
                                tunjanganLainya += Number(jumlahPendapatan)
                            }
                            if(typeA1 == '1'){
                                honorarium += Number(jumlahPendapatan);
                            }
                            if(typeA1 == '2'){
                                natura += Number(jumlahPendapatan);
                            }
                            if(typeA1 == '4' && typeKomponen != '2'){
                                tantiem += Number(jumlahPendapatan)
                            }
                            if(typeA1 == '3'){
                                premi += Number(jumlahPendBPJS)
                            }
                        }
                    }
                    // log.debug('tunjanganLainya', tunjanganLainya);
                    
                    
                    if(gajiPokokCount != 0){
                        gajiPokokSetahun = Number(gajiPokokCount) * 12
                        gajiPokok = gajiPokokCount
                    }
                    
                    // pendapatan.push([{
                    //     komponenPendapatan : komponenPendapatan,
                    //     jumlahPendapatan : jumlahPendapatan
                    // }])
                    // potongan.push([{
                    //     komponenPotongan : komponenPotongan,
                    //     jumlahPotongan : jumlahPotongan
                    // }])
                    return true;
                });
                // searchBpjs
                 // search BPJS
                var customrecord_sbj_msa_bpjsSearchObj = search.create({
                    type: "customrecord_sbj_msa_bpjs",
                    filters:
                    [
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({name: "custrecord_abj_msa_ump", label: "Upah Minimum Provinsi (UMP) yang berlaku di perusahaan Anda"}),
                        search.createColumn({name: "custrecord_abj_msa_is_bpj_kes", label: "Apakah Perusahaan Apakah perusahaan Anda menerapkan BPJS Kesehatan?"}),
                        search.createColumn({name: "custrecord_abj_msa_kode_badan_usaha", label: "Kode Badan Usaha"}),
                        search.createColumn({name: "custrecord_abj_msa_prosentase_personalia", label: "Persentase Tanggungan Personalia"}),
                        search.createColumn({name: "custrecord_abj_msa_jks_basis_penggali", label: "Basis Pengali"}),
                        search.createColumn({name: "custrecord_abj_msa_nilai_mkas_jks", label: "Nilai Maksimal Pengali BPJS Kesehatan"}),
                        search.createColumn({name: "custrecord_abj_msa_is_bpjs_ketenagakerja", label: "Apakah Perusahaan Menerapkan BPJS Ketenaga Kerjaan"}),
                        search.createColumn({name: "custrecord_abj_msa_npp", label: "NPP"}),
                        search.createColumn({name: "custrecord_abj_msa_basis_penggali", label: "Basis Penggali"}),
                        search.createColumn({name: "custrecord_abj_msa_jkk", label: "Jaminan Kecelakaan Kerja"}),
                        search.createColumn({name: "custrecord_abj_msa_jkm", label: "Jaminan Kematian 0.30 %"}),
                        search.createColumn({name: "custrecord_abj_msa_jht", label: "Jaminan Hari Tua Di Tanggung Perusahaan"}),
                        search.createColumn({name: "custrecord_abj_msa_jht_personalia", label: "Jaminan Hari Tua Ditanggun Personalia"}),
                        search.createColumn({name: "custrecord_abj_msa_is_jht_pph21", label: "Apakah JHT Ditanggung perusahaan dihitung PPh 21?"}),
                        search.createColumn({name: "custrecord_abj_msa_is_jp", label: "Apakah perusahaan memakai JP atau tidak?"}),
                        search.createColumn({name: "custrecord_abj_msa_is_jp_pph21", label: "Apakah JP Ditanggung perusahaan dihitung PPh 21?"}),
                        search.createColumn({name: "custrecord_abj_msa_jp_perusahaan", label: "Jaminan Pensiun (JP) (Ditanggung Perusahaan)"}),
                        search.createColumn({name: "custrecord_abj_msa_jp_personalia", label: "Jaminan Pensiun (JP) (Ditanggung Personalia)"}),
                        search.createColumn({name: "custrecord_abj_msa_nilai_maksimaljp", label: "Nilai Maksimal Pengali JP"}),
                        search.createColumn({name: "custrecord_abj_msa_is_wna_jp", label: "Apakah untuk personalia berkewarganegaraan asing dihitung JP atau tidak ?"}),
                        search.createColumn({name: "custrecord_abj_msa_is_usia_jp", label: "Apakah untuk personalia dengan usia &gt; 58 tahun dihitung JP atau tidak?"})
                    ]
                    });
                    var searchResultCount = customrecord_sbj_msa_bpjsSearchObj.runPaged().count;
                    var sumjumlahBPJS = 0;
                    var bpjsComp = [];
                    var komponenPendBPJSText = [];
                    var jumlahPendBPJS = [];
                    var komponenPotBPJSText = [];
                    var jumlahPotBPJS = [];
                    customrecord_sbj_msa_bpjsSearchObj.run().each(function(result){
                    // bpjsKesehatan
                        var isBPJKesehatan = result.getValue({
                        name : 'custrecord_abj_msa_is_bpj_kes'
                        });
                        var bpjsKesehatanPerson = result.getValue({
                        name : 'custrecord_abj_msa_prosentase_personalia'
                        });
                        var nilaiMaksimalBPJS = result.getValue({
                        name : 'custrecord_abj_msa_nilai_mkas_jks'
                        });
                        var basisPenggali = result.getValue({
                        name : 'custrecord_abj_msa_jks_basis_penggali'
                        });
                        var ump = result.getValue({
                        name : 'custrecord_abj_msa_ump'
                        });
                        
                        if(isBPJKesehatan == true){
                        if(bpjsKesehatanPerson == '0'){
                            var komponenBPJSKes = 'Tunjangan Premi BPJS Kesehatan(5% Perusahaan)'
                            var komponenPotBPJSKes = 'Premi BPJS Kesehatan(5% Perusahaan)'
                            var jumlahBpjsKes;
                            if(basisPenggali == '1'){
                                if(gajiPokok > nilaiMaksimalBPJS){
                                jumlahBpjsKes = nilaiMaksimalBPJS * 5 / 100
                                }else{
                                jumlahBpjsKes = gajiPokok * 5 / 100
                                }
                            }else if(basisPenggali == '2'){
                                var hitunganBas = gajiPokok + tunjangan
                                if(hitunganBas > nilaiMaksimalBPJS){
                                jumlahBpjsKes = nilaiMaksimalBPJS * 5 / 100
                                }else{
                                jumlahBpjsKes = hitunganBas * 5 /100
                                }
                            }else if(basisPenggali == '3'){
                                jumlahBpjsKes = ump * 5 /100
                            }
                            bpjsComp.push(jumlahBpjsKes)
                            komponenPendBPJSText.push(komponenBPJSKes)
                            jumlahPendBPJS.push(jumlahBpjsKes)
                            komponenPotBPJSText.push(komponenPotBPJSKes);
                            jumlahPotBPJS.push(jumlahBpjsKes);
                            // log.debug('jumlahPotBPJS kesehatan', jumlahPotBPJS)
                        }else{
                            var komponenBPJSKes = 'Tunjangan Premi BPJS Kesehatan(4% Perusahaan)'
                            var komponenPotBPJSKes = 'Premi BPJS Kesehatan (4% Karyawan)'
                            var komponenPot2BPJSKes = 'Premi BPJS Kesehatan (1% Karyawan)'
                            var jumlahPendBpjsKes;
                            var jumlahPotBpjsKes;
                            if(basisPenggali == '1'){
                            if(gajiPokok > nilaiMaksimalBPJS){
                                jumlahPendBpjsKes = nilaiMaksimalBPJS * 4 / 100
                                jumlahPotBpjsKes = nilaiMaksimalBPJS * 1 / 100
                            }else{
                                jumlahPendBpjsKes = gajiPokok * 4 / 100
                                jumlahPotBpjsKes = gajiPokok * 1 / 100
                            }
                            }else if(basisPenggali == '2'){
                            var hitunganBas = Number(gajiPokok) + Number(tunjangan)
                            if(hitunganBas > nilaiMaksimalBPJS){
                                jumlahPendBpjsKes = nilaiMaksimalBPJS * 4 / 100
                                jumlahPotBpjsKes = nilaiMaksimalBPJS * 1 / 100
                            }else{
                                jumlahPendBpjsKes = hitunganBas * 4 /100
                                jumlahPotBpjsKes = hitunganBas * 1 / 100
                            }
                            }else if(basisPenggali == '3'){
                            jumlahPendBpjsKes = ump * 4 /100
                            jumlahPotBpjsKes = ump * 1 / 100
                            }
                            komponenPendBPJSText.push(komponenBPJSKes);
                            jumlahPendBPJS.push(jumlahPendBpjsKes);
                            komponenPotBPJSText.push(komponenPotBPJSKes, komponenPot2BPJSKes);
                            jumlahPotBPJS.push(jumlahPendBpjsKes, jumlahPotBpjsKes);
                            bpjsComp.push(jumlahBpjsKes)
                        }
                        // BPJS Ketenaga Kerjaan
                        var isBPJSKetenagaKerjaan = result.getValue({
                            name : 'custrecord_abj_msa_is_bpjs_ketenagakerja'
                        });
                        if(isBPJSKetenagaKerjaan == true){
                            var basisPenggalBPJSKet = result.getValue({
                            name : 'custrecord_abj_msa_basis_penggali'
                            });
                            var jkk = result.getValue({
                            name : 'custrecord_abj_msa_jkk'
                            });
                            var isjkm30 = result.getValue({
                            name : 'custrecord_abj_msa_jkm'
                            });
                            var jhtPerusahaan = result.getValue({
                            name : 'custrecord_abj_msa_jht'
                            });
                            var jhtPerson = result.getValue({
                            name : 'custrecord_abj_msa_jht_personalia'
                            });
                            var isJHTPPh21 = result.getValue({
                            name : 'custrecord_abj_msa_is_jht_pph21'
                            });
                            var isJP = result.getValue({
                            name : 'custrecord_abj_msa_is_jp'
                            });
                            var isJpPPh21 = result.getValue({
                            name : 'custrecord_abj_msa_is_jp_pph21'
                            });
                            var jpPerusahaan = result.getValue({
                            name : 'custrecord_abj_msa_jp_perusahaan'
                            });
                            var jpPerson = result.getValue({
                            name : 'custrecord_abj_msa_jp_personalia'
                            });
                            var nilaiMaxPenggaliJP = result.getValue({
                            name : 'custrecord_abj_msa_nilai_maksimaljp'
                            });
                            var isUsia58Jp = result.getValue({
                            name : 'custrecord_abj_msa_is_usia_jp'
                            });
                            var penggali = 0;
                            if(basisPenggalBPJSKet == '1'){
                            penggali = gajiPokok
                            }else if(basisPenggalBPJSKet == '2'){
                            penggali = Number(gajiPokok) + Number(tunjangan)
                            }else if(basisPenggalBPJSKet == '3'){
                            penggali = ump
                            }
                            if(jkk){
                            var komponenPendJkk;
                            var komponenPotJKK;
                            var jumlahJKK;
                            if(jkk == '1'){
                                komponenPendJkk = 'Tunjangan Premi JKK BPJS Ketenaga Kerjaan (0.24% Perusahaan)';
                                komponenPotJKK = 'Premi JKK BPJS Ketenaga Kerjaan (0.24 % Perusahaan)';
                                jumlahJKK = penggali * 0.24 / 100
                            }else if(jkk == '2'){
                                komponenPendJkk = 'Tunjangan Premi JKK BPJS Ketenaga Kerjaan (0.54% Perusahaan)';
                                komponenPotJKK = 'Premi JKK BPJS Ketenaga Kerjaan (0.54 % Perusahaan)';
                                jumlahJKK = penggali * 0.54 / 100
                            }else if(jkk == '3'){
                                komponenPendJkk = 'Tunjangan Premi JKK BPJS Ketenaga Kerjaan (0.89% Perusahaan)';
                                komponenPotJKK = 'Premi JKK BPJS Ketenaga Kerjaan (0.89 % Perusahaan)';
                                jumlahJKK = penggali * 0.89 / 100
                            }else if(jkk == '4'){
                                komponenPendJkk = 'Tunjangan Premi JKK BPJS Ketenaga Kerjaan (1.27% Perusahaan)';
                                komponenPotJKK = 'Premi JKK BPJS Ketenaga Kerjaan (1.27 % Perusahaan)';
                                jumlahJKK = penggali * 1.27 / 100
                            }else if(jkk == '5'){
                                komponenPendJkk = 'Tunjangan Premi JKK BPJS Ketenaga Kerjaan (1.74% Perusahaan)';
                                komponenPotJKK = 'Premi JKK BPJS Ketenaga Kerjaan (1.74% Perusahaan)';
                                jumlahJKK = penggali * 1.74 / 100
                                
                            }
                            komponenPendBPJSText.push(komponenPendJkk);
                            jumlahPendBPJS.push(jumlahJKK);
                            komponenPotBPJSText.push(komponenPotJKK);
                            jumlahPotBPJS.push(jumlahJKK);
                            bpjsComp.push(jumlahJKK)
                            }

                            if(isjkm30){
                            var komponenJKM = 'Tunjangan Premi JKM BPJS Ketenaga Kerjaan (0.3% Perusahaan)'
                            var komponenPotJKM = 'Premi JKM BPJS Ketenaga Kerjaan (0.3% Perusahaan)'
                            var jumlahJKM = penggali * 0.3 / 100

                            komponenPendBPJSText.push(komponenJKM);
                            komponenPotBPJSText.push(komponenPotJKM)
                            jumlahPendBPJS.push(jumlahJKM);
                            jumlahPotBPJS.push(jumlahJKM);
                            }
                            if(jhtPerusahaan){
                            var komponenPendJHTPerusahaan;
                            var komponenPotJHTPerusahaan;
                            var jumlahJHT;
                            var komponenPotJHTPerson;
                            var jumlahJHTPerson;
                            if(jhtPerusahaan == 1){
                                komponenPendJHTPerusahaan = 'Tunjangan Premi JHT BPJS Ketenaga Kerjaan (3.7% Perusahaan)';
                                komponenPotJHTPerusahaan = 'Premi JHT BPJS Ketenaga Kerjaan (3.7% Perusahaan)';
                                komponenPotJHTPerson = 'Premi JHT BPJS Ketenaga Kerjaan (2% karyawan)';
                                jumlahJHT = penggali * 3.7 / 100
                                jumlahJHTPerson = penggali * 2 / 100
                                komponenPotBPJSText.push(komponenPotJHTPerson);
                                jumlahPotBPJS.push(jumlahJHTPerson);
                            }else{
                                komponenPendJHTPerusahaan = 'Tunjangan Premi JHT BPJS Ketenaga Kerjaan (5.7% Perusahaan)';
                                komponenPotJHTPerusahaan = 'Premi JHT BPJS Ketenaga Kerjaan (5.7% Perusahaan)';
                                jumlahJHT = penggali * 5.7 / 100
                            } 
                            if(isJHTPPh21 == true){
                                sumjumlahBPJS += jumlahJHT
                            }
                            komponenPendBPJSText.push(komponenPendJHTPerusahaan)
                            komponenPotBPJSText.push(komponenPotJHTPerusahaan);
                            jumlahPendBPJS.push(jumlahJHT);
                            jumlahPotBPJS.push(jumlahJHT);
                            }
                            if(isJP == true){
                            var komponenPendJp;
                            var komponenPotJp;
                            var komponenPotJPperson;
                            var jumlahJp;
                            var jumlahJpPerson;
                            if(penggali > nilaiMaxPenggaliJP){
                                if(jpPerusahaan == '1'){
                                komponenPendJp = 'Tunjangan Premi JP BPJS Ketenaga Kerjaan (2% Perusahaan)';
                                komponenPotJp = 'Premi JP BPJS Ketenaga Kerjaan (2% Perusahaan)';
                                komponenPotJPperson = 'Premi JP BPJS Ketenaga Kerjaan (1% Karyawan)';
                                jumlahJp = nilaiMaxPenggaliJP * 2 / 100
                                jumlahJpPerson = nilaiMaxPenggaliJP * 1 / 100
                                komponenPotBPJSText.push(komponenPotJPperson);
                                jumlahPotBPJS.push(jumlahJpPerson)
                                }else{
                                komponenPendJp = 'Tunjangan Premi JP BPJS Ketenaga Kerjaan (3% Perusahaan)';
                                komponenPotJp = 'Premi JP BPJS Ketenaga Kerjaan (3% Perusahaan)';
                                jumlahJp = nilaiMaxPenggaliJP * 3 / 100
                                }
                            }else{
                                if(jpPerusahaan == '1'){
                                komponenPendJp = 'Tunjangan Premi JP BPJS Ketenaga Kerjaan (2% Perusahaan)';
                                komponenPotJp = 'Premi JP BPJS Ketenaga Kerjaan (2% Perusahaan)';
                                komponenPotJPperson = 'Premi JP BPJS Ketenaga Kerjaan (1% Karyawan)';
                                jumlahJp = penggali * 2 / 100
                                jumlahJpPerson = penggali * 1 / 100
                                komponenPotBPJSText.push(komponenPotJPperson);
                                jumlahPotBPJS.push(jumlahJpPerson)
                                }else{
                                komponenPendJp = 'Tunjangan Premi JP BPJS Ketenaga Kerjaan (3% Perusahaan)';
                                komponenPotJp = 'Premi JP BPJS Ketenaga Kerjaan (3% Perusahaan)';
                                jumlahJp = penggali * 3 / 100
                                }
                            }
                            if(isJpPPh21 == true){
                                sumjumlahBPJS += jumlahJp
                            }
                            komponenPendBPJSText.push(komponenPendJp)   ;
                            komponenPotBPJSText.push(komponenPotJp)
                            jumlahPendBPJS.push(jumlahJp);
                            jumlahPotBPJS.push(jumlahJp);                                 
                            }
                        }
                        
                        }

                        
                    return true;
                });

                var metodePajak = ''
                var npwpPer1 = '00'
                var npwpPer2 = '000'
                var npwpPer3 = '000'
                var npwpPer4 = '0'
                var npwpPer5 = '000'
                var npwpPer6 = '000'

                var npwpPim1 = '00'
                var npwpPim2 = '000'
                var npwpPim3 = '000'
                var npwpPim4 = '0'
                var npwpPim5 = '000'
                var npwpPim6 = '000'

                var namaPimpinan = '';
                var searchPPh = search.create({
                    type: "customrecord58",
                    filters:
                    [
                        ["id","equalto","1"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({name: "custrecord_abj_msa_is_pph21", label: "Apakah perusahaan Anda menerapkan perhitungan Pajak PPh 21/26?"}),
                        search.createColumn({name: "custrecord_abj_msa_npwp_perusahaan", label: "NPWP Perusahaan"}),
                        search.createColumn({name: "custrecord_abj_msa_nama_pimpinan", label: "Nama Pimpinan Perusahaan/Kuasa"}),
                        search.createColumn({name: "custrecord_abj_msa_npwp_pimpinan", label: "NPWP Pimpinan Perusahaan/Kuasa"}),
                        search.createColumn({name: "custrecord_abj_msa_ktp", label: "Karyawan Tetap Percobaan"}),
                        search.createColumn({name: "custrecordabj_msa_ktp_permanen", label: "Karyawan Tetap Permanen"}),
                        search.createColumn({name: "custrecord_abj_msa_pkwt", label: "Karyawan PKWT"}),
                        search.createColumn({name: "custrecord_abj_msa_karyawan_lepas", label: "Karyawan Lepas"}),
                        search.createColumn({name: "custrecord_abj_msa_tenaga_ahli", label: "Karyawan Tenaga Ahli"}),
                        search.createColumn({name: "custrecord_abj_msa_karyawan_magang", label: "Karyawan Magang"}),
                        search.createColumn({name: "custrecord_abj_msa_ptkp_wajib", label: "Nilai PTKP Diri Wajib Pajak Orang Pribadi"}),
                        search.createColumn({name: "custrecord_abj_msa_ptkp_istri", label: "PTKP istri/masing-masing tanggungan"})
                    ]
                });
                var searchPPhSet = searchPPh.run();
                searchPPh = searchPPhSet.getRange({
                    start : 0,
                    end : 1
                });
                if(searchPPh.length > 0){
                    var recPPh = searchPPh[0];
                    var npwpPerusahaan = recPPh.getValue({
                        name: "custrecord_abj_msa_npwp_perusahaan"
                    });
                    var npwpPimpinan = recPPh.getValue({
                        name: "custrecord_abj_msa_npwp_pimpinan"
                    });
                    namaPimpinan = recPPh.getValue({
                        name: "custrecord_abj_msa_nama_pimpinan"
                    })
                    var karyawanTetap = recPPh.getValue({
                        name: "custrecordabj_msa_ktp_permanen"
                    });
                    if(karyawanTetap){
                        metodePajak = karyawanTetap
                    }
                    // log.debug('karyawanTetap', karyawanTetap);
                    if(npwpPimpinan){
                        npwpPim1 = npwpPimpinan.substring(0, 2);
                        npwpPim2 = npwpPimpinan.substring(2, 5);
                        npwpPim3 = npwpPimpinan.substring(5, 8);
                        npwpPim4 = npwpPimpinan.substring(8, 9);
                        npwpPim5 = npwpPimpinan.substring(9, 12);
                        npwpPim6 = npwpPimpinan.substring(12, 15);
                    }
                    if(npwpPerusahaan){
                        npwpPer1 = npwpPerusahaan.substring(0, 2);
                        npwpPer2 = npwpPerusahaan.substring(2, 5);
                        npwpPer3 = npwpPerusahaan.substring(5, 8);
                        npwpPer4 = npwpPerusahaan.substring(8, 9);
                        npwpPer5 = npwpPerusahaan.substring(9, 12);
                        npwpPer6 = npwpPerusahaan.substring(12, 15);
                    }
                }
                // log.debug('pendapatanBPJS', jumlahPendBPJS);
                // log.debug('potonganBPjs', jumlahPotBPJS);
                var totalJumlahPendBPJS = jumlahPendBPJS.reduce((total, currentValue) => total + currentValue, 0);
                var totalJumlahPotBPJS = jumlahPotBPJS.reduce((total, currentValue) => total + currentValue, 0);
                // log.debug('totalJumlahPendBPJS', totalJumlahPotBPJS);
                var jumlahBPJSTahun = 0;
                if(totalJumlahPendBPJS){
                    jumlahBPJSTahun = Number(totalJumlahPendBPJS) * 12
                }
                var jumlahPotBPJStahun = 0;
                if(totalJumlahPotBPJS){
                    jumlahPotBPJStahun = Number(totalJumlahPotBPJS) * 12
                }
                var premiTahun = Number(premi) * 12
                var premiAsuransiTahun = Number(premiTahun) + Number(jumlahBPJSTahun)
                var tunjanganTahun = Number(tunjanganLainya) * 12
                var honorariumTahun = Number(honorarium) * 12
                var naturaTahun = Number(natura) * 12
                var countTantiem = Number(tantiem) * 12
                var tantiemThr = Number(countTantiem) + Number(thr)
                var tunjanagnPph21 = 0;
                
                var jumlahPenghasilanBruto = Number(tunjanganTahun) + Number(gajiPokokSetahun) + Number(honorariumTahun) + Number(naturaTahun) + Number(tantiemThr) + Number(premiAsuransiTahun) + Number(tunjanagnPph21);
                var iuranPensiunTahun = Number(iuranPenjsiunJHT) + Number(jumlahPotBPJStahun);
                var BiayaJabatan = 5 / 100 * Number(jumlahPenghasilanBruto)
                if(BiayaJabatan > 6000000){
                    BiayaJabatan = 6000000
                }

                var jumlahPengurangan = Number(BiayaJabatan) + Number(iuranPensiunTahun)
                var jumlahPenghasilanNeto = Number(jumlahPenghasilanBruto) - Number(jumlahPengurangan);

                log.debug('jumlahPtkp', jumlahPtkp)
                var pkp = Number(jumlahPenghasilanNeto) - Number(jumlahPtkp)
                log.debug('pkp', pkp);
                var pkpSet = 0;
                if(pkp >= 0){
                    pkpSet = pkp
                }
                log.debug('pkpSet', pkpSet)

                // perhitungan pph
                var pajak = 0
                if(metodePajak == '1' || metodePajak == '2'){
                    if(pkp >= jumlahPtkp){
                        if(pkp != 0){
                            if (pkp <= 60000000) {
                                pajak = pkp * 0.05;
                            } else if (pkp <= 250000000) {
                                pajak = 60000000 * 0.05 + (pkp - 60000000) * 0.15;
                            } else if (pkp <= 500000000) {
                                pajak = 60000000 * 0.05 + 190000000 * 0.15 + (pkp - 250000000) * 0.25;
                            } else if (pkp <= 5000000000) {
                                pajak = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (pkp - 500000000) * 0.30;
                            } else {
                                pajak = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + 4500000000 * 0.30 + (pkp - 5000000000) * 0.35;
                            }
    
                            pajakperBulan = pajak / 12
                            log.debug('pajakPerbulan', pajakperBulan)
                        }
                    }
                }
                if(metodePajak == '3'){
                    var pajakPertahun = 0;
                    if (pkp <= 47500000) {
                        pajakPertahun = (pkp - 0) * (5 / 95) + 0;
                        
                    } else if (pkp <= 217500000) {
                        pajakPertahun = (pkp - 47500000) * (15 / 85) + 2500000;
                        
                    } else if (pkp <= 405000000) {
                        pajakPertahun = (pkp - 217500000) * (25 / 75) + 32500000;
                        
                    } else {
                        pajakPertahun = (pkp - 405000000) * (30 / 70) + 95000000;
                        
                    }
                    pajak = pajakPertahun;
                    tunjanagnPph21 = pajak;
                
                    // Perhitungan ulang untuk jumlahPenghasilanBruto dan seterusnya
                    jumlahPenghasilanBruto = Number(tunjanganTahun) + Number(gajiPokokSetahun) + Number(honorariumTahun) + Number(naturaTahun) + Number(tantiemThr) + Number(premiAsuransiTahun) + Number(tunjanagnPph21);
                    iuranPensiunTahun = Number(iuranPenjsiunJHT) + Number(jumlahPotBPJStahun);
                    BiayaJabatan = 5 / 100 * Number(jumlahPenghasilanBruto);
                    if(BiayaJabatan > 6000000){
                        BiayaJabatan = 6000000;
                    }
                
                    jumlahPengurangan = Number(BiayaJabatan) + Number(iuranPensiunTahun);
                    jumlahPenghasilanNeto = Number(jumlahPenghasilanBruto) - Number(jumlahPengurangan);
                
                    log.debug('jumlahPtkp', jumlahPtkp);
                    pkp = Number(jumlahPenghasilanNeto) - Number(jumlahPtkp);
                    log.debug('pkp', pkp);
                    pkpSet = 0;
                    if(pkp >= 0){
                        pkpSet = pkp;
                    }
                    log.debug('pkpSet', pkpSet);
                }
                
                
                log.debug('pajak', pajak)
                if(gajiPokokSetahun){
                    gajiPokokSetahun = format.format({
                        value: gajiPokokSetahun,
                        type: format.Type.CURRENCY
                    });
                }
                if(tunjanganTahun){
                    tunjanganTahun = format.format({
                        value: tunjanganTahun,
                        type: format.Type.CURRENCY
                    });
                }
                if(honorariumTahun){
                    honorariumTahun = format.format({
                        value: honorariumTahun,
                        type: format.Type.CURRENCY
                    });
                }

                if(naturaTahun){
                    naturaTahun = format.format({
                        value: naturaTahun,
                        type: format.Type.CURRENCY
                    });
                }

                if(tantiemThr){
                    tantiemThr = format.format({
                        value: tantiemThr,
                        type: format.Type.CURRENCY
                    });
                }
                if(jumlahPenghasilanBruto){
                    jumlahPenghasilanBruto = format.format({
                        value: jumlahPenghasilanBruto,
                        type: format.Type.CURRENCY
                    });
                }
                if(BiayaJabatan){
                    BiayaJabatan = format.format({
                        value: BiayaJabatan,
                        type: format.Type.CURRENCY
                    });
                }
                if(jumlahPengurangan){
                    jumlahPengurangan = format.format({
                        value: jumlahPengurangan,
                        type: format.Type.CURRENCY
                    });
                }
                if(jumlahPenghasilanNeto){
                    jumlahPenghasilanNeto = format.format({
                        value: jumlahPenghasilanNeto,
                        type: format.Type.CURRENCY
                    });
                }
                if(jumlahPtkp){
                    jumlahPtkp = format.format({
                        value: jumlahPtkp,
                        type: format.Type.CURRENCY
                    });
                }
                if(jumlahPtkp){
                    jumlahPtkp = format.format({
                        value: jumlahPtkp,
                        type: format.Type.CURRENCY
                    });
                }
                if(pkpSet){
                    pkpSet = format.format({
                        value: pkpSet,
                        type: format.Type.CURRENCY
                    });
                }
                if(premiAsuransiTahun){
                    premiAsuransiTahun = format.format({
                        value: premiAsuransiTahun,
                        type: format.Type.CURRENCY
                    });
                }
                if(iuranPensiunTahun){
                    iuranPensiunTahun = format.format({
                        value: iuranPensiunTahun,
                        type: format.Type.CURRENCY
                    });
                }
                if(pajak){
                    pajak = format.format({
                        value: pajak,
                        type: format.Type.CURRENCY
                    });
                }
                if(tunjanagnPph21){
                    tunjanagnPph21 = format.format({
                        value: tunjanagnPph21,
                        type: format.Type.CURRENCY
                    });
                }
               
                // log.debug('gajiPokokSetahun', gajiPokokSetahun);

                var today = new Date();
                var day = today.getUTCDate();
                var bulan = today.getUTCMonth() + 1; 
                var year = today.getUTCFullYear();

                var npwpPerGab = npwpPer1 + "." + npwpPer2 + "." + npwpPer3 + "." + npwpPer4
                var npwpPimGab = npwpPim1 + "." + npwpPim2 + "." + npwpPim3 + "." + npwpPim4
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var footer = "";
                var pdfFile = null;

                var style = "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='font-size:11px; color:#808080'>a r e a  s t a p l e s</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:25%'></td>"
                body += "<td style='width:40%'></td>"
                body += "<td style='width:35%'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td style='align: left;'><div style='width: 30px; height: 10px; background-color: black; align: right;margin-left: 10px;'></div></td>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: center;'></td>"
                body += "<td style='align: right;'><div style='width: 30px; height: 10px; background-color: black; align: right; margin-right: 10px;'></div></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top: none; align:center;'></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>BUKTI PEMOTONGAN PAJAK PENGHASILAN</td>"
                body += "<td style='align: right;'></td>"
                body += "</tr>" 

                body += "<tr>"
                body += "<td style=' border-top: none; align:center;' rowspan='6'><div><img class='tg-img-logo' src= '" + urlLogo + "' style='width: 30%; height: 30%; object-fit: contain;'></img></div></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PASAL 21 BAGI PEGAWAI TETAP ATAU</td>"
                body += "<td style='align: right;'>"
                body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left;'></div>"
                // body += "<div style='clear: both;'></div>"
                body += "</td>"
                body += "</tr>"
                
                body += "<tr>"
                // body += "<td></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PENERIMA PENSIUN ATAU TUNJANGAN HARI</td>"
                body += "<td style='font-size:13px; font-weight: bold; align: right;' rowspan='2'>FORMULIR 1721-A1</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>TUA/JAMINAN HARI TUA BERKALA</td>"
                body += "<td></td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-1 : untuk Penerima Penghasilan</td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-2 : untuk Pemotong</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; font-weight: bold;'></td>"
                body += "<td style='font-size:9px; font-weight: bold; align:right; margin-right:40px;'>MASA PEROLEHAN</td>" 
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // third tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
                body += "<tbody>";
                
                body += "<tr>"
                body += "<td style='width:25%'></td>"
                // body += "<td style='width:50%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:4%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                // body += "<td style='width:25%'></td>"
                body += "<td style='width:7%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:1%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:10px; font-weight: bold; align:center; border-right: 1px solid black;'>KEMENTRIAN KEUANGAN RI</td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black; border-right: 1px solid black;'></td>"
                body += "<td style='font-size:9px; font-weight: bold; align:center' colspan='5'>PENGHASILAN [mm-mm]</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:10px; font-weight: bold; align:center; border-right: 1px solid black;'>DIREKTORAT JENDRAL PAJAK</td>"
                // body += "<td style='border-right: 1px solid black;'>NOMOR : <span style='font-size:9px; color: gray;'>H.01</span> 1 . 1  - <u>12</u> . <u>23</u> - <u>000003</u> </td>"
                body += "<td style='font-size: 10px; font-weight:bold;'>NOMOR : </td>"
                body += "<td><span style='font-size:7px; color: gray;'>H.01</span></td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>1</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>.</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>1</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>-</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+month+"</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; '>.</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+tahun2Digit+"</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>-</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+noUrut+"</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "<td style='align:center;'><span style='font-size:7px; color: gray;'>H.02</span></td>"
                body += "<td style='align:center;'>1</td>"
                body += "<td style='align:center;'>-</td>"
                body += "<td style='align:center;'>"+month+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // four table
                // third tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 15px 0 15px; padding: 0; font-size:11px;\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:20%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:31%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 9px; border-left: 1px solid black; border-top: 1px solid black; '>NPWP</td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; border-right: 1px solid black; '></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 9px; border-left: 1px solid black'>PEMOTONG</td>"
                body += "<td style='vertical-align: top;'>:</td>"
                body += "<td style='align:center; vertical-align: top;'><span style='font-size:7px; color: gray;'>H.03</span></td>"
                body += "<td style='border-bottom: 1px solid black; align:center'>"+npwpPerGab+"</td>"
                body += "<td style='align:center '>-</td>"
                body += "<td style='align:center; border-bottom: 1px solid black;'>"+npwpPer5+"</td>"
                body += "<td style='align:center'>-</td>"
                body += "<td style='align:center; border-bottom: 1px solid black;'>"+npwpPer6+"</td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black; font-size: 9px;'>NAMA</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right:1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='vertical-align: top; border-left: 1px solid black; font-size: 9px;'>PEMOTONG</td>"
                body += "<td style='vertical-align: top;'>:</td>"
                body += "<td style='align:center; vertical-align: top;'><span style='font-size:7px; color: gray;'>H.04</span></td>"

                body += "<td colspan='6' style='border-bottom: 1px solid black;'>"+legalName+"</td>"
                body += "<td style='border-right:1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='10' style='border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;'></td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 10px 15px 0 15px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>A. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                // identitas karyawan 21td
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 15px 0 15px; padding: 0; font-size:8px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:4%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black; border-top: 1px solid black; '>1.</td>"
                body += "<td style='border-top: 1px solid black;'>NPWP</td>"
                body += "<td style='border-top: 1px solid black;'>:</td>"
                body += "<td style='color: gray; border-top: 1px solid black; font-size: 7px;'>A.01</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+Gabung1+"</td>"
                body += "<td style='border-top: 1px solid black;'>-</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+npwp5+"</td>"
                body += "<td style='border-top: 1px solid black;'>.</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+npwp6+"</td>"
                body += "<td style='border-top: 1px solid black;'></td>"
                body += "<td style='border-top: 1px solid black;'>6.</td>"
                body += "<td style='border-top: 1px solid black;' colspan='9'>'STATUS /JUMLAH TANGGUNGAN KELUARGA UNTUK PTKP</td>"
                body += "<td style='border-top: 1px solid black; border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>2.</td>"
                body += "<td>NIK/NO.</td>"
                body += "<td colspan='9'></td>"
                body += "<td style='font-size : 8px;'>K/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='font-size : 8px;'>TK/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='font-size : 8px;'>HB/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'></td>"
                body += "<td>PASPOR</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.02</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+nik+"</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                if(ptkpK){
                    body += "<td style='border-bottom:1px solid black; align: center; font-size: 11px;'>"+ptkpK+"</td>"
                }else{
                    body += "<td style='border-bottom:1px solid black;'></td>"
                }
                body += "<td style='color: gray; font-size: 7px;'>A.07</td>"
                body += "<td></td>"
                if(ptkpTK){
                    body += "<td style='border-bottom:1px solid black; align: center; font-size: 11px;'>"+ptkpTK+"</td>"
                }else{
                    body += "<td style='border-bottom:1px solid black;'></td>"
                }
                body += "<td style='color: gray; font-size: 7px;'>A.08</td>"
                body += "<td></td>"
                body += "<td style='border-bottom:1px solid black;'></td>"
                body += "<td style='color: gray; font-size: 7px;'>A.09</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>3.</td>"
                body += "<td>NAMA</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.03</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+empName+"</td>"
                body += "<td></td>"
                body += "<td>7.</td>"
                body += "<td colspan='3'>NAMA JABATAN :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.10</td>"
                body += "<td style='border-bottom: 1px solid black; font-size: 11px; align: center;' colspan='5'>"+jobEmp+"</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>4.</td>"
                body += "<td>ALAMAT</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.04</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+alamat1+"</td>"
                body += "<td></td>"
                body += "<td>8.</td>"
                body += "<td colspan='4'>KARYAWAN ASING :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.11</td>"
                body += "<td><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td>YA</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='4' style='border-left: 1px solid black;'></td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+alamat2+"</td>"
                body += "<td></td>"
                body += "<td>9.</td>"
                body += "<td colspan='4'>KODE NEGARA DOMISILI :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.12</td>"
                body += "<td style='border-bottom: 1px solid black;'></td>"
                body += "<td colspan='3'></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"
                
                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>4.</td>"
                body += "<td colspan='2'>JENIS KELAMIN</td>"
                body += "<td>: <span style='color: gray; font-size: 7px;'>A.05</span></td>"
                if(jenisKelamin == '1'){
                    body += "<td style='font-size: 11px;'><span style='margin-right:5px;'>X</span>LAKI-LAKI</td>"
                    body += "<td style='color: gray; font-size: 7px;'>A.06</td>"
                    body += "<td style='font-size: 11px;' colspan='3'>PEREMPUAN</td>"
                }else{
                    body += "<td style='font-size: 11px;'>LAKI-LAKI</td>"
                    body += "<td style='color: gray; font-size: 7px;'>A.06</td>"
                    body += "<td style='font-size: 11px;' colspan='3'><span style='margin-right:5px;'>X</span>PEREMPUAN</td>"
                }
                body += "<td style='border-right: 1px solid black;' colspan='12'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black' colspan='21'></td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 10px 15px 0 15px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>B. RINCIAN  PENGHASILAN DAN PENGHITUNGAN PPh PASAL 21</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                 // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 15px 0 15px; padding: 0; font-size:9px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:28%'></td>"
                body += "<td style='width:28%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none;' colspan='9'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:9px; font-weight:bold; border-left:1px solid black; align:center; ' colspan='8'>URAIAN</td>"
                body += "<td style='font-size:9px; font-weight:bold; border-right:1px solid black; align:center; border-left:1px solid black;' >JUMLAH (Rp)</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black; border-top:1px solid black;' colspan='2'>KODE OBJEK PAJAK</td>"
                body += "<td style='border-top:1px solid black;'>:</td>"
                body += "<td style='border-top:1px solid black;'><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-top:1px solid black;'>21-100-01</td>"
                body += "<td style='border-top:1px solid black;'><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-top:1px solid black;'>21-100-02</td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGHASILAN BRUTO :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>1.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> GAJI/PENSIUN ATAU THT/JHT</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+gajiPokokSetahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>2.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> TUNJANGAN PPh</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+tunjanagnPph21+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>3.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> TUNJANGAN LAINNYA, UANG LEMBUR DAN SEBAGAINYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+tunjanganTahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>4.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  HONORARIUM DAN IMBALAN LAIN SEJENISNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+honorariumTahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>5.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  PREMI ASURANSI YANG DIBAYAR PEMBERI KERJA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+premiAsuransiTahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>6.</td>"
                body += "<td style='border-top :1px solid black; font-size:7px;' colspan='7'> PENERIMAAN DALAM BENTUK NATURA DAN KENIKMATAN LAINNYA YANG DIKENAKAN PEMOTONGAN PPh PASAL 21</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+naturaTahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>7.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  TANTIEM, BONUS, GRATIFIKASI, JASA PRODUKSI DAN THR</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+tantiemThr+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>8.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> JUMLAH PENGHASILAN BRUTO (1 S.D.7)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+jumlahPenghasilanBruto+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGURANGAN :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>9.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>BIAYA JABATAN/ BIAYA PENSIUN</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+BiayaJabatan+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>10.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> IURAN PENSIUN ATAU IURAN THT/JHT</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+iuranPensiunTahun+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>11.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> JUMLAH PENGURANGAN (9 S.D 10)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+jumlahPengurangan+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGHITUNGAN PPh PASAL 21 :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>12.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>JUMLAH PENGHASILAN NETO (8-11)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+jumlahPenghasilanNeto+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>13.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PENGHASILAN NETO MASA SEBELUMNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>14.</td>"
                body += "<td style='border-top :1px solid black; font-size:7px' colspan='7'> JUMLAH PENGHASILAN NETO UNTUK PENGHITUNGAN PPh PASAL 21 (SETAHUN/DISETAHUNKAN)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+jumlahPenghasilanNeto+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>15.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PENGHASILAN TIDAK KENA PAJAK (PTKP)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+jumlahPtkp+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>16.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PENGHASILAN KENA PAJAK SETAHUN/DISETAHUNKAN (14 - 15)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+pkpSet+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>17.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PPh PASAL 21 ATAS PENGHASILAN KENA PAJAK SETAHUN/DISETAHUNKAN</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+pajak+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>18.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PPh PASAL 21 YANG TELAH DIPOTONG MASA SEBELUMNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>19.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PPh PASAL 21 TERUTANG</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>"+pajak+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black;'>20.</td>"
                body += "<td style='border-top :1px solid black; border-bottom: 1px solid black;' colspan='7'>PPh PASAL 21 DAN PPh PASAL 26 YANG TELAH DIPOTONG DAN DILUNASI</td>"
                body += "<td style='border:1px solid black; align:right; font-size:11px;'>"+pajak+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 10px 15px 0 15px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>C. IDENTITAS PEMOTONG</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 15px 0 15px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:7%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:18%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:9%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;' colspan='19'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black;'>1.</td>"
                body += "<td>NPWP</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>C.01</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align : center;'>"+ npwpPimGab+"</td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align : center;'>"+npwpPim5+"</td>"
                body += "<td>.</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align : center;'>"+npwpPim6+"</td>"
                body += "<td></td>"
                body += "<td>3.</td>"
                body += "<td colspan='5'>TANGGAL & TANDA TANGAN</td>"
                body += "<td></td>"
                body += "<td rowspan='3'><div style='width: 110px; height: 60px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black;'>2.</td>"
                body += "<td>NAMA</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>C.02</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px;' colspan='5'>" +namaPimpinan +"</td>"
                body += "<td style='color: gray; font-size: 7px;'>C.03</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align:center;' colspan='2'>"+day+"</td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align:center;'>"+bulan+"</td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px; align:center;'>"+year+"</td>"
                body += "<td></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='11' style='border-left:1px solid black;'></td>"
                body += "<td colspan='3'>[dd-mm-yyyy]</td>"
                body += "<td colspan='3'></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-top:none;' colspan='19'></td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 20px 15px 0 15px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='align: left;'><div style='width: 30px; height: 10px; background-color: black; align: right;margin-left: 10px;'></div></td>"
                body += "<td style=''></td>"
                body += "<td style='align: right;'><div style='width: 30px; height: 10px; background-color: black; align: right; margin-right: 10px;'></div></td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf>";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheader\">";
                xml += header;
                xml += "</macro>";
                xml += "<macro id=\"nlfooter\">";
                xml += footer;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>"
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 33cm; width: 21cm; margin: 0; padding: 0;' header='nlheader' footer='nlfooter' footer-height='3%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });

            }catch(e){
                log.debug('error', e)
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);