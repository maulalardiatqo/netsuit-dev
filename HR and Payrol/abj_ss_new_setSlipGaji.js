/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    
    function execute(scriptContext) {
        try {
            var script = runtime.getCurrentScript();
            var recId = script.getParameter({
                name: 'custscript_id_remunerasi'
            });
            var recordRem = record.load({
                type: 'customrecord_msa_remunerasi',
                id: recId,
            });
            var employeeId = recordRem.getValue('custrecord_remunerasi_employee');
            var empName = recordRem.getText('custrecord_remunerasi_employee')
            var tanggalEfektif = '';
            var tanggalAkhir = '';
            var periodAkhir = '';
            var ptkp;
            if(employeeId){
                var searchKarir = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                        ["custrecord3","anyof",employeeId]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({name: "scriptid", label: "Script ID"}),
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
                var searchResultCount = searchKarir.runPaged().count;
                searchKarir.run().each(function(result){
                    tanggalEfektif = result.getValue({
                        name : "custrecord_abj_msa_tgl_efektif"
                    });
                    tanggalAkhir = result.getValue({
                        name : "custrecord_abj_msa_tgl_akhir"
                    });
                    periodAkhir = result.getText({
                        name : "custrecord_abj_msa_period_akhir"
                    });
                    ptkp = result.getValue({
                        name : "custrecord_status_wajib_pajak"
                    })
                    return true;
                });
            }
            var idsSlip = [];
            var allData = [];
            var pendapatanCount = recordRem.getLineCount({
                sublistId: 'recmachcustrecord_remunerasi'
            });
            if(pendapatanCount > 0){
                for(var index = 0; index < pendapatanCount; index++){
                    var idPendapatan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_remunerasi',
                        fieldId : 'custrecord_remunerasi',
                        line : index,
                    });
                    var slipGaji = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_remunerasi',
                        fieldId : 'custrecord_remu_slipgaji',
                        line : index,
                    });
                    var kompPendapatan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_remunerasi',
                        fieldId : 'custrecord_id_pendapatan',
                        line : index,
                    });
                    var kompPendapatanText = recordRem.getSublistText({
                        sublistId : 'recmachcustrecord_remunerasi',
                        fieldId : 'custrecord_id_pendapatan',
                        line : index,
                    });
                    var JumlahPendapatan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_remunerasi',
                        fieldId : 'custrecord_jumlah_pendapatan',
                        line : index,
                    });
                    var slipId = slipGaji;
                    var isSlipIdExist = false;
                    for (var i = 0; i < idsSlip.length; i++) {
                        if (idsSlip[i] === slipId) {
                            isSlipIdExist = true;
                            break;
                        }
                    }

                    if (!isSlipIdExist) {
                        idsSlip.push(slipId);
                    }
                    allData.push({
                        idPendapatan : idPendapatan,
                        slipGaji : slipGaji,
                        kompPendapatan : kompPendapatan,
                        kompPendapatanText : kompPendapatanText,
                        JumlahPendapatan : JumlahPendapatan,
                        jenis : 'pendapatan',
                        slipId : slipGaji
                    })
                }
            }
            var potonganCount = recordRem.getLineCount({
                sublistId: 'recmachcustrecord_msa_potongan_remunerasi'
            });
            if(potonganCount > 0){
                for(var i = 0; i < potonganCount; i++){
                    var idPotongan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_msa_potongan_remunerasi',
                        fieldId : 'custrecord_msa_potongan_remunerasi',
                        line : i,
                    });
                    var slipGajiPotongan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_msa_potongan_remunerasi',
                        fieldId : 'custrecord_msa_slip_gaji_potongan',
                        line : i,
                    });
                    var kompPotongan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_msa_potongan_remunerasi',
                        fieldId : 'custrecord_msa_id_potongan',
                        line : i,
                    });
                    var kompPotonganText = recordRem.getSublistText({
                        sublistId : 'recmachcustrecord_msa_potongan_remunerasi',
                        fieldId : 'custrecord_msa_id_potongan',
                        line : i,
                    });
                    var jumlahPotongan = recordRem.getSublistValue({
                        sublistId : 'recmachcustrecord_msa_potongan_remunerasi',
                        fieldId : 'custrecord_msa_jumlah_potongan',
                        line : i,
                    });
                    var slipId = slipGajiPotongan;
                    var isSlipIdExist = false;
                    for (var i = 0; i < idsSlip.length; i++) {
                        if (idsSlip[i] === slipId) {
                            isSlipIdExist = true;
                            break;
                        }
                    }

                    if (!isSlipIdExist) {
                        idsSlip.push(slipId);
                    }
                    allData.push({
                        idPotongan : idPotongan,
                        slipGajiPotongan : slipGajiPotongan,
                        kompPotongan : kompPotongan,
                        kompPotonganText : kompPotonganText,
                        jumlahPotongan : jumlahPotongan,
                        jenis : 'potongan',
                        slipId : slipGajiPotongan
                    })
                }
            }
            // log.debug('idsSlip', idsSlip);
            // log.debug('allData', allData);
            idsSlip.forEach(function(slipId) {
                log.debug('Processing slipId:', slipId);
                var lamaKerja = 0;
                var parts = tanggalEfektif.split('/');
                var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
                var mulai = new Date(formattedDate);
                // log.debug('tanggalEfektif', tanggalEfektif);
                // log.debug('mulai', mulai);
                // log.debug('tanggalAkhir', tanggalAkhir);
                // log.debug('periodAkhir', periodAkhir);
                if(periodAkhir){
                    var parts = periodAkhir.split(' ');
                    var tahun = 0;
                    var bulan = 0;

                    for (var i = 0; i < parts.length; i++) {
                        if (parts[i].toLowerCase() === 'tahun' || parts[i].toLowerCase() === 'tahunan') {
                            tahun = parseInt(parts[i - 1]);
                        } else if (parts[i].toLowerCase() === 'bulan' || parts[i].toLowerCase() === 'bulanan') {
                            bulan = parseInt(parts[i - 1]);
                        }
                    }

                    // log.debug('tahun', tahun);
                    // log.debug('bulan', bulan);

                    var akhir = new Date(mulai);
                    akhir.setFullYear(mulai.getFullYear() + tahun);
                    akhir.setMonth(mulai.getMonth() + bulan);

                    var diffMonths = Math.abs((akhir.getFullYear() - mulai.getFullYear()) * 12 + akhir.getMonth() - mulai.getMonth());
                    log.debug('diffMonths', diffMonths)
                    lamaKerja = diffMonths
                }
                if(tanggalAkhir){
                    var parts = tanggalAkhir.split('/');
                    var akhir = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])); // Format: Tahun, Bulan (0-11), Tanggal
                    // log.debug('akhir', akhir);

                    var diffMonths = Math.abs((akhir.getFullYear() - mulai.getFullYear()) * 12 + akhir.getMonth() - mulai.getMonth());
                    // log.debug('diffMonths', diffMonths);
                    lamaKerja = diffMonths
                }
                var recCreate;
                var tanggalAwalPeriodArray = [];
                var startDate = new Date(mulai);
                for (var i = 0; i < lamaKerja; i++) {
                    var recCreate = record.create({
                        type : 'customrecord_msa_slip_gaji',
                        isDynamic: true
                    });
                    
                    recCreate.setValue({
                        fieldId : 'custrecord_abj_msa_employee_slip',
                        value : employeeId
                    });
                    recCreate.setValue({
                        fieldId : 'custrecord_abj_msa_slipgaji_id',
                        value : slipId
                    });
                    var dataForSlipId = allData.filter(function(data) {
                        return data.slipId === slipId;
                    });
                    var iuranPenjsiunJHT = 0;
                    var sumJumlahKomponenPendapatan = 0;
                    var sumJumlahKomponenPotongan = 0;
                    var sumKompPendapatan = 0;
                    var gajiPokok = 0;
                    var tunjangan = 0;
                    var tanggalAwalPeriod;
                    var lamaPeriod;
                    var thr = 0;
                    dataForSlipId.forEach(function(data) {
                        var idSlip = data.slipId
                        var searchSlip = search.create({
                            type: 'customrecord_slip_gaji',
                            columns: ['internalid', 'custrecord_lama_period', 'custrecord_tanggal_awal_period'],
                            filters: [{
                                name: 'internalid',
                                operator: 'anyof',
                                values: idSlip
                            }]
                        });
                        var searchSlipset = searchSlip.runPaged().count;
                        
                        if(searchSlipset > 0){
                            searchSlip.run().each(function (row){
                                lamaPeriod = row.getValue({
                                    name: "custrecord_lama_period",
                                });
                                tanggalAwal = row.getValue({
                                    name : 'custrecord_tanggal_awal_period'
                                });
                                if(lamaPeriod == 1){
                                    tanggalAwalPeriod = tanggalAwal
                                    if (data.jenis === 'pendapatan') {
                                        var isPPh21;
                                        var typeSalary;
                                        var idPendapatan = data.idPendapatan
                                        var idSlipPend = data.slipGaji;
                                        var kompPendapatan = data.kompPendapatan;
                                        var kompPendapatanText = data.kompPendapatanText;
                                        var JumlahPendapatan = data.JumlahPendapatan
                                        var listFormula;
                                        var jumlahLembur;

                                        var customrecord_msa_komponen_pendapatanSearchObj = search.create({
                                            type: "customrecord_msa_komponen_pendapatan",
                                            filters:
                                            [
                                                {
                                                    name : 'internalid',
                                                    operator: search.Operator.IS,
                                                    values: kompPendapatan
                                                }
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
                                                search.createColumn({name: "custrecord_msa_pend_typea1", label: "Type A1"}),
                                                search.createColumn({name: "custrecord_list_overtime"}),
                                                search.createColumn({name: "custrecord_jumlah_rupiah"}),
                                                ]
                                            });
                                            var searchResultCount = customrecord_msa_komponen_pendapatanSearchObj.runPaged().count;
                                            customrecord_msa_komponen_pendapatanSearchObj.run().each(function(result){
                                                isPPh21 = result.getValue({
                                                    name : 'custrecord_msa_pend_is_pph'
                                                });
                                                typeSalary = result.getValue({
                                                    name: "custrecord_msa_type_salary"
                                                });
                                                listFormula = result.getValue({
                                                    name : "custrecord_list_overtime"
                                                });
                                                
                                                return true;
                                            });
                                            if(typeSalary != '4' && typeSalary != '3'){
                                                if (isPPh21 == true) {
                                                    sumKompPendapatan += Number(JumlahPendapatan);
                                                }
                                                if(typeSalary == '1'){
                                                    gajiPokok = JumlahPendapatan
                                                }
                                                if(typeSalary == '7'){
                                                    tunjangan = JumlahPendapatan
                                                }if(typeSalary == '2'){
                                                    thr += Number(jumlahPendapatan)
                                                }
                                            
                                                recCreate.selectNewLine({
                                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                                });
                                                recCreate.setCurrentSublistValue({
                                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                                    fieldId: "custrecord_id_komponen",
                                                    value: kompPendapatan,
                                                });
                                                recCreate.setCurrentSublistValue({
                                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                                    fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                                    value: kompPendapatanText,
                                                });
                                                recCreate.setCurrentSublistValue({
                                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                                    fieldId: "custrecord_abj_msa_slip_pendapatan",
                                                    value: JumlahPendapatan,
                                                });
                                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                                                sumJumlahKomponenPendapatan += Number(JumlahPendapatan)

                                            }
                                            
                                    } else if (data.jenis === 'potongan') {
                                        var idSlipPot = data.slipGajiPotongan;
                                        var idPotongan = data.idPotongan
                                        var kompPotongan = data.kompPotongan
                                        var kompPotonganText = data.kompPotonganText
                                        var jumlahPotongan = data.jumlahPotongan

                                        recCreate.selectNewLine({
                                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                        });
                                        recCreate.setCurrentSublistValue({
                                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                            fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                            value: kompPotonganText,
                                        });
                                        recCreate.setCurrentSublistValue({
                                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                            fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                            value: jumlahPotongan,
                                        });
                                        recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                                        sumJumlahKomponenPotongan += Number(jumlahPotongan)
                                    }
                                }
                                

                            })
                            
                        }
                        
                    });
                    if(lamaPeriod == 1){
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
                        var komponenPendBPJSText = []
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
                                
                                    komponenPendBPJSText.push(komponenBPJSKes)
                                    jumlahPendBPJS.push(jumlahBpjsKes)
                                    komponenPotBPJSText.push(komponenPotBPJSKes);
                                    jumlahPotBPJS.push(jumlahBpjsKes);
                                    log.debug('jumlahPotBPJS kesehatan', jumlahPotBPJS)
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
                                }
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

                            return true;
                        });

                        
                        log.debug('komponenPendBPJSText', komponenPendBPJSText);
                        var combineBPJSpend = []
                        for (var h = 0; h < komponenPendBPJSText.length; h++) {
                            var dataObject = {
                                komponenPendBPJS: komponenPendBPJSText[h],
                                jumlahPendBPJS: jumlahPendBPJS[h],
                            }
                            combineBPJSpend.push(dataObject);
                        }
                        if(combineBPJSpend){
                            var sumjumlahPendBPJS = 0;
                            for (var u = 0; u < combineBPJSpend.length; u++) {
                                var dataLine = combineBPJSpend[u];
                                var komponenPendBPJS = dataLine.komponenPendBPJS;
                                var jumlahPendBPJS = dataLine.jumlahPendBPJS;

                                recCreate.selectNewLine({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_id_komponen",
                                    value: 0,
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                    value: komponenPendBPJS,
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_abj_msa_slip_pendapatan",
                                    value: jumlahPendBPJS,
                                });
                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                                sumjumlahPendBPJS += Number(jumlahPendBPJS)
                            }
                            
                        }
                        log.debug('combineBPJSpend', combineBPJSpend);
                        var combineBPJSpot = [];
                        for (var k = 0; k < komponenPotBPJSText.length; k++) {
                            var dataObject = {
                                komponenPotBPJS: komponenPotBPJSText[k],
                                jumlahPotBPJS: jumlahPotBPJS[k],
                            };
                            combineBPJSpot.push(dataObject);
                        }
                        if(combineBPJSpot){
                            var sumJumlahPotBPJS = 0
                            for (var f = 0; f < combineBPJSpot.length; f++) {
                                var dataLineSpot = combineBPJSpot[f];
                                
                                var komponenPotBPJS = dataLineSpot.komponenPotBPJS;
                                var jumlahPotBPJS = dataLineSpot.jumlahPotBPJS;
                                recCreate.selectNewLine({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                    value: komponenPotBPJS,
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                    value: jumlahPotBPJS,
                                });
                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                                sumJumlahPotBPJS += Number(jumlahPotBPJS)
                            }
                        }
                        var jumlahBPJSTahun = 0;
                        if(sumjumlahPendBPJS){
                            jumlahBPJSTahun = Number(sumjumlahPendBPJS) * 12
                        }
                        var jumlahPotBPJStahun = 0;
                        if(sumJumlahPotBPJS){
                            jumlahPotBPJStahun = Number(sumJumlahPotBPJS) * 12
                        }
                        
                        if(tanggalAwalPeriod){
                            var dayOfMonth = tanggalAwalPeriod;
                            if (i > 0) {
                                if (startDate.getMonth() === 11) {
                                    startDate.setFullYear(startDate.getFullYear() + 1);
                                }
                                startDate.setMonth((startDate.getMonth() + 1) % 12);
                            }
    
                            var startDay = dayOfMonth;
                            var month = startDate.getMonth() + 1;
                            var startMonthIndo = getIndonesianMonth(startDate.getMonth());
                            var startYearIndo = startDate.getFullYear();
    
                            var toConvert =  month + '-' +  startDay + '-' +startYearIndo
                            var formatNext = new Date(toConvert);
                            var dateStringawal = startDay + ' ' + startMonthIndo + ' ' + startYearIndo;
    
                            var endDate = new Date(formatNext);
                            endDate.setMonth((endDate.getMonth() + 1) % 12);
    
                            if (endDate.getMonth() < startDate.getMonth()) {
                                endDate.setFullYear(endDate.getFullYear() + 1);
                            }
                            var endDay = endDate.getDate();
                            var endMonthIndo = getIndonesianMonth(endDate.getMonth());
                            var endYearIndo = endDate.getFullYear();
                            var dateStringAkhir = endDay + ' ' + endMonthIndo + ' ' + endYearIndo;
                            var dateRangeString = dateStringawal + ' - ' + dateStringAkhir
                            log.debug('dateRangeString', dateRangeString);
                            var toSetName = empName + ' ' + dateRangeString
                            recCreate.setValue({
                                fieldId : 'name',
                                value : toSetName
                            });
                            recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_period_gaji',
                                value : dateRangeString
                            })
                            var periodSearch = search.create({
                                type : 'customrecord_monthly_period_gaji',
                                columns : ['internalid', 'name'],
                                filters: [{
                                    name: 'name',
                                    operator: 'is',
                                    values: dateRangeString
                                }]
                            });
                        }
                        log.debug('sumKompPendapatan', sumKompPendapatan);
                        log.debug('sumjumlahPendBPJS', sumjumlahPendBPJS)
                        var totalIncome = sumjumlahPendBPJS + sumKompPendapatan
                        log.debug('totalIncome', totalIncome);
                        var tipePTKP;
                        var statusKaryawan;
                        var customrecord_remunasiSearchObj = search.create({
                            type: "customrecord_remunasi",
                            filters:
                            [
                                ["custrecord3","anyof",employeeId]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "id",
                                    sort: search.Sort.ASC,
                                    label: "ID"
                                }),
                                search.createColumn({name: "custrecord3", label: "Emplyee"}),
                                search.createColumn({name: "custrecord_status_wajib_pajak", label: "Status Wajib Pajak"}),
                                search.createColumn({name: "custrecord_abj_msa_status_karyawan", label: "Status Karyawan"})
                            ]
                        });
                        var searchResultCount = customrecord_remunasiSearchObj.runPaged().count;
                        customrecord_remunasiSearchObj.run().each(function(result){
                            tipePTKP = result.getValue({
                                name : 'custrecord_status_wajib_pajak'
                            });
                            statusKaryawan = result.getValue({
                                name : 'custrecord_abj_msa_status_karyawan'
                            });
                            return true;
                            
                        });
                        //search pph setting
                        var metodePajak;
                        // var ptkp;
                        // var ptkpIstri;
                        var customrecord58SearchObj = search.create({
                            type: "customrecord58",
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
                                search.createColumn({name: "custrecord_abj_msa_is_pph21", label: "Apakah perusahaan Anda menerapkan perhitungan Pajak PPh 21/26?"}),
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
                        var searchResultCount = customrecord58SearchObj.runPaged().count;
                        customrecord58SearchObj.run().each(function(result){
                            var karyawanTetapPercobaan = result.getValue({
                                name: "custrecord_abj_msa_ktp"
                            });
                            var karyawanTetapPermanen = result.getValue({
                                name: "custrecordabj_msa_ktp_permanen"
                            });
                            var karyawanPKWT = result.getValue({
                                name: "custrecord_abj_msa_pkwt"
                            });
                            var karyawanLepas = result.getValue({
                                name: "custrecord_abj_msa_karyawan_lepas"
                            }) ;
                            var karyawanTenagaAhli = result.getValue({
                                name : "custrecord_abj_msa_tenaga_ahli"
                            });
                            var karyawanMagang = result.getValue({
                                name: "custrecord_abj_msa_karyawan_magang"
                            });
                            if(statusKaryawan == '1'){
                                metodePajak = karyawanTetapPercobaan
                            }else if(statusKaryawan == '2'){
                                metodePajak = karyawanTetapPermanen
                            }else if(statusKaryawan == '3'){
                                metodePajak = karyawanPKWT
                            }else if(statusKaryawan == '4'){
                                metodePajak = karyawanLepas
                            }else if(statusKaryawan == '5'){
                                metodePajak = karyawanTenagaAhli
                            }else if(statusKaryawan == '6'){
                                metodePajak = karyawanMagang
                            }
                            // ptkp = result.getValue({
                            //     name: "custrecord_abj_msa_ptkp_wajib"
                            // });
                            // ptkpIstri = result.getValue({
                            //     name: "custrecord_abj_msa_ptkp_istri"
                            // });
                            return true;
                        });
                        log.debug('ptkp', ptkp);
                        var jumlahPtkp = 0;
                        if(ptkp){
                            var searchPtkp = search.create({
                                type: "customrecord_ptpk",
                                filters:
                                [
                                    ["internalid","anyof",ptkp]
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

                        var iuranPensiunTahun = Number(iuranPenjsiunJHT) + Number(jumlahPotBPJStahun);

                        var BiayaJabatan = 5 / 100 * totalIncome
                        if(BiayaJabatan > 500000){
                            BiayaJabatan = 500000
                        }
                        
                        var totalBiayaJabatan = BiayaJabatan * 12
                        var jumlahPengurangan = Number(totalBiayaJabatan) + Number(iuranPensiunTahun)
                        var totalincomeTahun = totalIncome * 12
                        var penghasilanBruto = Number(totalincomeTahun) + Number(thr)
                        log.debug('jumlahPengurangan', jumlahPengurangan);
                        log.debug('penghasilanBruto', penghasilanBruto);
                        var penghasilanNetto = penghasilanBruto - Number(jumlahPengurangan);
                        log.debug('penghasilan netto', penghasilanNetto);
                        var pkp = penghasilanNetto - Number(jumlahPtkp)
                        var pajakperBulan = 0;
                        if(pkp >= jumlahPtkp){
                            if(pkp != 0){
                                var pajak = 0;
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
                        log.debug('pajakPerbulan', pajakperBulan);
                        if(pajakperBulan !== 0){
                            log.debug('masuk if')
                            if(metodePajak == '1'){
                                log.debug('method pajak1')
                                recCreate.setValue({
                                    fieldId : 'custrecord_abj_msa_pph21perusahaan',
                                    value : pajakperBulan
                                });
                                
                            }else if(metodePajak == '2'){
                                sumJumlahKomponenPotongan += pajakperBulan

                                // set Komponen Potongan Pajak
                                recCreate.selectNewLine({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                    value: 'PPh21',
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                    value: pajakperBulan,
                                });
                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");

                                recCreate.setValue({
                                    fieldId : 'custrecord_abj_msa_pph21karyawan',
                                    value : pajakperBulan
                                });
                            }else{
                                var pajakPertahun = 0;
                                log.debug('pkp', pkp);
                                log.debug('ptkp', jumlahPtkp);
                                if(pkp >= jumlahPtkp){
                                    if (pkp <= 47500000) {
                                        pajakPertahun = (pkp - 0) * (5 / 95) + 0;
                                        
                                    } else if (pkp <= 217500000) {
                                        pajakPertahun = (pkp - 47500000) * (15 / 85) + 2500000;
                                        
                                    } else if (pkp <= 405000000) {
                                        pajakPertahun = (pkp - 217500000) * (25 / 75) + 32500000;
                                        
                                    } else {
                                        pajakPertahun = (pkp - 405000000) * (30 / 70) + 95000000;
                                        
                                    }
                                }
                                
                                log.debug('pajakPertahun', pajakPertahun);
                                var pajakperBulanGrossUp = pajakPertahun / 12;
                                sumJumlahKomponenPendapatan += pajakperBulanGrossUp


                                sumJumlahKomponenPotongan += pajakperBulanGrossUp
                                recCreate.setValue({
                                    fieldId : 'custrecord_abj_msa_pph21perusahaan',
                                    value : pajakperBulanGrossUp
                                });
                                recCreate.setValue({
                                    fieldId : 'custrecord_abj_msa_pph21karyawan',
                                    value : pajakperBulanGrossUp
                                });

                                recCreate.selectNewLine({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_id_komponen",
                                    value: 0,
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                    value: 'Tunjangan PPh21',
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId: "custrecord_abj_msa_slip_pendapatan",
                                    value: pajakperBulanGrossUp,
                                });
                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");

                                // set Komponen Potongan Pajak
                                recCreate.selectNewLine({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                    value: 'PPh21',
                                });
                                recCreate.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                    fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                    value: pajakperBulanGrossUp,
                                });
                                recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                            }
                        }
                        var pendapatanToCount = Number(sumJumlahKomponenPendapatan) + Number(sumjumlahPendBPJS);
                        var potonganToCount = Number(sumJumlahKomponenPotongan) + Number(sumJumlahPotBPJS);
                        log.debug('perhitungan',{pendapatanToCount : pendapatanToCount, potonganToCount : potonganToCount})
                        var takeHomePay = pendapatanToCount - potonganToCount
                        recCreate.setValue({
                            fieldId : 'custrecord_abj_msa_bruto',
                            value : pendapatanToCount
                        })
                        if(takeHomePay){
                        recCreate.setValue({
                            fieldId : 'custrecord_abj_msa_thp',
                            value : takeHomePay
                        });
                        }
                        recCreate.setValue({
                            fieldId : 'custrecord_abj_msa_status_gaji',
                            value : 1
                        })
                        var recId = recCreate.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                        });
                        log.debug('recid', recId); 
                    
                    }
                    
                    
                }
                function getIndonesianMonth(monthIndex) {
                    var monthNames = [
                        'Januari', 'Februari', 'Maret', 'April',
                        'Mei', 'Juni', 'Juli', 'Agustus',
                        'September', 'Oktober', 'November', 'Desember'
                    ];
                    return monthNames[monthIndex];
                }
                
            });
        } catch (e) {
            log.debug('error', e);
        }
    }

    return {
        execute: execute
    };
});

