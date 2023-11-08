/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
    
                var recordRem = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var employeeId = recordRem.getValue('custrecord_remunerasi_employee');
                var tanggalEfektif = '';
                var tanggalAkhir = '';
                var periodAkhir = '';
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
                    log.debug("customrecord_remunasiSearchObj result count",searchResultCount);
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
                        return true;
                    });
                }
                var idsSlip = [];
                var allData = [];
                var pendapatanCount = recordRem.getLineCount({
                    sublistId: 'recmachcustrecord_remunerasi'
                });
                log.debug('pendapatan', pendapatanCount)
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
                log.debug('idsSlip', idsSlip);
                log.debug('allData', allData)

                idsSlip.forEach(function(slipId) {
                    log.debug('Processing slipId:', slipId);
                    var lamaKerja = 0;
                    var mulai = new Date(tanggalEfektif);
                    log.debug('mulai', mulai);
                    log.debug('tanggalAkhir', tanggalAkhir);
                    log.debug('periodAkhir', periodAkhir);
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

                        log.debug('tahun', tahun);
                        log.debug('bulan', bulan);

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
                        log.debug('akhir', akhir);

                        var diffMonths = Math.abs((akhir.getFullYear() - mulai.getFullYear()) * 12 + akhir.getMonth() - mulai.getMonth());
                        log.debug('diffMonths', diffMonths);
                        lamaKerja = diffMonths
                    }
                    var recCreate;
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
    
                        var sumJumlahKomponenPendapatan = 0;
                        var sumJumlahKomponenPotongan = 0;
                        var sumKompPendapatan = 0;
                        var gajiPokok = 0;
                        var tunjangan = 0;
                        dataForSlipId.forEach(function(data) {
                            var idSlip = data.slipId
                            var searchSlip = search.c
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
                                    var lamaPeriod = row.getValue({
                                        name: "custrecord_lama_period",
                                    });
                                    var tanggalAwalPeriod = row.getValue({
                                        name : 'custrecord_tanggal_awal_period'
                                    });
                                    log.debug('tanggalAwalPeriod', tanggalAwalPeriod);
                                    if(lamaPeriod == 1){
                                        if (data.jenis === 'pendapatan') {
                                            var isPPh21;
                                            var typeSalary;
                                            var idPendapatan = data.idPendapatan
                                            var idSlipPend = data.slipGaji;
                                            var kompPendapatan = data.kompPendapatan;
                                            var kompPendapatanText = data.kompPendapatanText;
                                            var JumlahPendapatan = data.JumlahPendapatan
    
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
                                                    search.createColumn({name: "custrecord_msa_pend_typea1", label: "Type A1"})
                                                    ]
                                                });
                                                var searchResultCount = customrecord_msa_komponen_pendapatanSearchObj.runPaged().count;
                                                customrecord_msa_komponen_pendapatanSearchObj.run().each(function(result){
                                                    isPPh21 = result.getValue({
                                                        name : 'custrecord_msa_pend_is_pph'
                                                    });
                                                    typeSalary = result.getValue({
                                                        name: "custrecord_msa_type_salary"
                                                    })
                                                    return true;
                                                });
                                                if (isPPh21 == true) {
                                                    sumKompPendapatan += Number(JumlahPendapatan);
                                                }
                                                if(typeSalary == '1'){
                                                    gajiPokok = JumlahPendapatan
                                                }
                                                if(typeSalary == '7'){
                                                    tunjangan = JumlahPendapatan
                                                }
                                        } else if (data.jenis === 'potongan') {
                                            var idSlipPot = data.slipGajiPotongan;
                                            var idPotongan = data.idPotongan
                                            var kompPotongan = data.kompPotongan
                                            var kompPotonganText = data.kompPotonganText
                                            var jumlahPotongan = data.jumlahPotongan
                                        }
                                    }
    
                                })
                            }
                        });
                    }
                    
                    
                });
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
 });