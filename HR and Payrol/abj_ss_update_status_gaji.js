/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/format'],
  function(search, record, email, runtime, format) {
    
    function execute(scriptContext) {
        try {
            var today = new Date();
            var day = today.getUTCDate();
            var month = today.getUTCMonth()
            var bulan = today.getUTCMonth() + 1
            var montIndo = getIndonesianMonth(month);
            var year = today.getUTCFullYear();
            var forFilter = '-' + ' ' + day + ' ' + montIndo + ' ' + year
            var currnetDate = day + '/' + bulan + '/' + year
            var customrecord_msa_slip_gajiSearchObj = search.create({
                type: "customrecord_msa_slip_gaji",
                filters:
                [
                    ["custrecord_abj_msa_period_gaji","contains",forFilter]
                ],
                columns:
                [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({name: "custrecord_abj_msa_employee_slip", label: "Employee"}),
                    search.createColumn({name: "custrecord_abj_msa_status_gaji", label: "Status"}),
                    search.createColumn({name: "custrecord_abj_msa_thp", label: "Take Home Pay"}),
                    search.createColumn({name: "custrecord_abj_msa_bruto", label: "Gaji Bruto"}),
                    search.createColumn({name: "internalid",}),
                    search.createColumn({name: "custrecord_abj_msa_slipgaji_id",}),
                    search.createColumn({name: "custrecord_abj_msa_period_gaji",}),
                ]
            });
            var searchResultCount = customrecord_msa_slip_gajiSearchObj.runPaged().count;
            var allData = [];
            customrecord_msa_slip_gajiSearchObj.run().each(function(result){
                var periodGaji = result.getValue({
                    name : "custrecord_abj_msa_period_gaji"
                })
                var idSlip = result.getValue({
                    name : "internalid"
                })
                var slipGajiId = result.getValue({
                    name : "custrecord_abj_msa_slipgaji_id"
                });
                var tanggalAwalPeriod;
                if(slipGajiId){
                    var searchSlipGaji = search.create({
                        type: "customrecord_slip_gaji",
                        filters:
                        [
                            ["internalid","anyof",slipGajiId]
                        ],
                        columns : [
                            search.createColumn({name: "custrecord_tanggal_awal_period",}),
                        ]
                    });
                    var searchSlipSet = searchSlipGaji.run();
                    var searchSlipResult = searchSlipSet.getRange({
                        start: 0,
                        end: 1,
                    });
                    if(searchSlipResult.length > 0){
                        var recSlip = searchSlipResult[0]
                        var periodAwal = recSlip.getValue({
                            name: "custrecord_tanggal_awal_period"
                        })
                        tanggalAwalPeriod = periodAwal
                        
                    }
                }
                var idEmp = result.getValue({
                    name : "custrecord_abj_msa_employee_slip"
                });
                var statusGaji = result.getValue({
                    name : "custrecord_abj_msa_status_gaji"
                });
                var takeHomePay = result.getValue({
                    name : "custrecord_abj_msa_thp"
                });
                var bruto = result.getValue({
                    name : "custrecord_abj_msa_bruto"
                })
                if(statusGaji == '1'){
                    allData.push({
                        idSlip : idSlip,
                        slipGajiId, slipGajiId,
                        idEmp : idEmp,
                        statusGaji : statusGaji,
                        takeHomePay : takeHomePay,
                        bruto : bruto,
                        tanggalAwalPeriod : tanggalAwalPeriod,
                        periodGaji : periodGaji
                    })
                }
                return true;
            });
            log.debug('allData', allData);
            if(allData.length > 0){
                allData.forEach((data)=>{
                    var idSlip = data.idSlip;
                    var recSlipGaji = record.load({
                        type : "customrecord_msa_slip_gaji",
                        id : idSlip,
                        isDynamic : true
                    });
                    var gajiBruto = recSlipGaji.getValue("custrecord_abj_msa_bruto");
                    var thp = recSlipGaji.getValue("custrecord_abj_msa_thp")
                    var pendapatanSlipCount = recSlipGaji.getLineCount({
                        sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji"
                    })
                   
                    var gajiPokok = 0;
                    var jumlahPPh21 = 0;
                    var lineNumber
                    var lineNumberPotongan
                    var pph21inLine
                    var totalPotongan = 0
                    if(pendapatanSlipCount > 0){
                        for(var index = 0; index < pendapatanSlipCount; index++){
                            var idPendapatan = recSlipGaji.getSublistValue({
                                sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                fieldId : "custrecord_id_komponen",
                                line : index
                            });
                            var pendapatanText = recSlipGaji.getSublistText({
                                sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                fieldId : "custrecord_abj_msa_slip_rem_pendapatan",
                                line : index
                            });
                            var jumlahPendapatan = recSlipGaji.getSublistValue({
                                sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                fieldId : "custrecord_abj_msa_slip_pendapatan",
                                line : index
                            });
                            var recBPJS = record.load({
                                type : "customrecord_sbj_msa_bpjs",
                                id : 1
                            })
                            if(pendapatanText.includes("JP")){
                                var isJPpph21 = recBPJS.getValue("custrecord_abj_msa_is_jp_pph21");
                                log.debug("isJPpph21", isJPpph21)
                                log.debug('jumlahPendapatan', jumlahPendapatan)
                                if(isJPpph21 == true){
                                    jumlahPPh21 += Number(jumlahPendapatan);
                                }
                            }
                            if(pendapatanText.includes("JHT")){
                                var isJHTPPh21 = recBPJS.getValue("custrecord_abj_msa_is_jht_pph21");
                                log.debug("isJPpph21", isJPpph21)
                                log.debug('jumlahPendapatan', jumlahPendapatan)
                                if(isJHTPPh21 == true){
                                    jumlahPPh21 += Number(jumlahPendapatan);
                                }
                            }
                            if(pendapatanText.includes("Kesehatan")){
                                jumlahPPh21 += Number(jumlahPendapatan);
                            }
                            if(pendapatanText.includes("JKK")){
                                jumlahPPh21 += Number(jumlahPendapatan);
                            }
                            if(pendapatanText.includes("JKM")){
                                jumlahPPh21 += Number(jumlahPendapatan);
                            }
                            if(pendapatanText.includes("PPh21")){
                                lineNumber = index
                                pph21inLine = jumlahPendapatan
                            }
                            if(idPendapatan != 0){
                                var recPend = record.load({
                                    type : "customrecord_msa_komponen_pendapatan",
                                    id : idPendapatan
                                });
                                var typeKomp = recPend.getValue("custrecord_msa_type_salary");
                                var isPPh21 = recPend.getValue("custrecord_msa_pend_is_pph");
                                if(isPPh21 == true){
                                    jumlahPPh21 += Number(jumlahPendapatan);
                                }
                                if(typeKomp == '1'){
                                    gajiPokok = recSlipGaji.getSublistValue({
                                        sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                        fieldId : "custrecord_abj_msa_slip_pendapatan",
                                        line : index
                                    })
                                }
                            }
                        }
                    }
                    var potonganSlipCOunt = recSlipGaji.getLineCount({
                        sublistId : "recmachcustrecord_abj_msa_slip_potongan"
                    })
                    log.debug('potonganSlipCOunt', potonganSlipCOunt)
                    if(potonganSlipCOunt > 0){
                        for(var j = 0; j < potonganSlipCOunt; j++ ){
                            var kompPotongan = recSlipGaji.getSublistValue({
                                sublistId : "recmachcustrecord_abj_msa_slip_potongan",
                                fieldId : "custrecord_abj_msa_slip_slip_potongan",
                                line : j
                            });
                            log.debug("kompPotongan", kompPotongan);
                            var jumlahPotongan = recSlipGaji.getSublistValue({
                                sublistId : "recmachcustrecord_abj_msa_slip_potongan",
                                fieldId : "custrecord_abj_msa_slip_slip_jumlah",
                                line : j
                            });
                            log.debug("jumlahPotongan", jumlahPotongan)
                            if(kompPotongan.includes("PPh21")){
                                lineNumberPotongan = j
                            }else{
                                totalPotongan += jumlahPotongan
                            }
                        }
                        
                        
                    }
                    log.debug('jumlahPPh21 cek 1', jumlahPPh21);
                    var slipGajiId = data.slipGajiId
                    var idEmp = data.idEmp

                    var periodGaji = data.periodGaji
                    var dateRange = periodGaji.split(" - ");
                    var startDate = dateRange[0];
                    var endDate = dateRange[1];

                    var formattedStartDate = formatDate(startDate);
                    var formattedEndDate = formatDate(endDate);
                    var totalHoursOvt = 0
                    var customrecord_attendance_overtimeSearchObj = search.create({
                        type: "customrecord_overtime",
                        filters:
                        [
                            ["custrecord_ot_compensation","anyof","1"], 
                            "AND", 
                            ["custrecord_ot_date","within",formattedStartDate,formattedEndDate],
                            "AND",
                            ["custrecord_ov_employee","anyof",idEmp]
                        ],
                        columns:
                        [
                            search.createColumn({name: "internalid"}),
                        ]
                    });
                    var searchResultCount = customrecord_attendance_overtimeSearchObj.runPaged().count;
                    log.debug("customrecord_attendance_overtimeSearchObj result count",searchResultCount);
                    customrecord_attendance_overtimeSearchObj.run().each(function(result){
                        var internalidOv = result.getValue({
                            name : "internalid"
                        });
                        if(internalidOv){
                            var customrecord418SearchObj = search.create({
                                type: "customrecord418",
                                filters:
                                [
                                    ["custrecord_aos_pattern","anyof",internalidOv],
                                    "AND",
                                    ["custrecord_aos_emp","anyof",idEmp],
                                ],
                                columns:
                                [
                                    search.createColumn({name: "custrecord_aos_total_hours", label: "Total Hours"})
                                ]
                            });
                            var searchResultCount = customrecord418SearchObj.runPaged().count;
                            log.debug("customrecord418SearchObj result count",searchResultCount);
                            customrecord418SearchObj.run().each(function(result){
                                var hoursOvt = result.getValue({
                                    name : "custrecord_aos_total_hours"
                                })
                                if(hoursOvt){
                                    totalHoursOvt += Number(hoursOvt)
                                }
                                return true;
                            });
                        }
                        return true;
                    });
                    var gajiTunjangan = [];
                    var thr = 0;
                    var customrecord_msa_remunerasiSearchObj = search.create({
                        type: "customrecord_msa_remunerasi",
                        filters:
                        [
                            ["custrecord_remunerasi_employee","anyof",idEmp]
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
                                name: "internalid",
                                join: "CUSTRECORD_REMUNERASI",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custrecord_id_pendapatan",
                                join: "CUSTRECORD_REMUNERASI",
                                label: "Komponen Pendapatan"
                            }),
                            search.createColumn({
                                name: "custrecord_jumlah_pendapatan",
                                join: "CUSTRECORD_REMUNERASI",
                                label: "Jumlah"
                            })
                        ]
                    });
                    var searchResultCount = customrecord_msa_remunerasiSearchObj.runPaged().count;
                    customrecord_msa_remunerasiSearchObj.run().each(function(result){
                        var remPendapatan = result.getValue({
                            name: "custrecord_id_pendapatan",
                            join: "CUSTRECORD_REMUNERASI",
                        });
                        var pendapatanText = result.getText({
                            name: "custrecord_id_pendapatan",
                            join: "CUSTRECORD_REMUNERASI",
                        });
                        var jumlahPend = result.getValue({
                            name: "custrecord_jumlah_pendapatan",
                            join: "CUSTRECORD_REMUNERASI",
                        })
                        if(remPendapatan){
                            var recKomrem = record.load({
                                type : "customrecord_msa_komponen_pendapatan",
                                id : remPendapatan
                            });
                            var kompType = recKomrem.getValue("custrecord_msa_type_salary");
                            var isPPh = recKomrem.getValue("custrecord_msa_pend_is_pph");

                            if(kompType == '3'){
                                gajiTunjangan.push({
                                    isPPh : isPPh,
                                    remPendapatan : remPendapatan,
                                    pendapatanText : pendapatanText,
                                    jumlahPend : jumlahPend
                                })
                            }
                            if(kompType == '2'){
                                thr += Number(jumlahPend);
                            }
                        }
                        return true;
                    });
                    log.debug("gajiTunjangan", gajiTunjangan)
                    log.debug('jumlahPPh21', jumlahPPh21);
                    log.debug('lineNumber', lineNumber);
                    log.debug('pphinLine', pph21inLine);
                    var tipePTKP;
                    var statusKaryawan;
                    var customrecord_remunasiSearchObj = search.create({
                        type: "customrecord_remunasi",
                        filters:
                        [
                            ["custrecord3","anyof",idEmp]
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
                        return true;
                    });
                    var jumlahPtkp = 0;
                    if(tipePTKP){
                        var searchPtkp = search.create({
                            type: "customrecord_ptpk",
                            filters:
                            [
                                ["internalid","anyof",tipePTKP]
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
                    // search attendace
                    var dataAttendance = []
                    var customrecord_abj_attendaceSearchObj = search.create({
                        type: "customrecord_abj_attendace",
                        filters:
                        [
                            ["custrecord_at_approval_status","anyof","2"], 
                            "AND", 
                            ["custrecord_at_date","within",formattedStartDate,formattedEndDate], 
                            "AND", 
                            ["custrecord_at_employee_id","anyof",idEmp], 
                            "AND", 
                            ["custrecord_at_type","anyof","2"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "custrecord_at_employee_id", label: "Employee"}),
                            search.createColumn({name: "custrecord_at_date", label: "Date"}),
                            search.createColumn({name: "custrecord_at_category", label: "Category"})
                        ]
                    });
                    var searchResultCount = customrecord_abj_attendaceSearchObj.runPaged().count;
                    log.debug("customrecord_abj_attendaceSearchObj result count",searchResultCount);
                    customrecord_abj_attendaceSearchObj.run().each(function(result){
                        var Category = result.getValue({
                            name: "custrecord_at_category"
                        })
                        dataAttendance.push(Category);
                        return true;
                    });
                    log.debug("dataAttendance",dataAttendance)
                    var totalCount = 0;
                    var isIn = false;

                    for (var i = 0; i < dataAttendance.length; i++) {
                        if (dataAttendance[i] === "Clock In") {
                            isIn = true;
                        } else if (dataAttendance[i] === "Clock Out" && isIn) {
                            totalCount++;
                            isIn = false;
                        }
                    }
                    var recSlip = record.load({
                        type : "customrecord_slip_gaji",
                        id : slipGajiId
                    });
                    var totalTunjangantoCount = 0;
                    if(gajiTunjangan.length > 0){
                        gajiTunjangan.forEach((data)=>{
                            var idPend = data.remPendapatan
                            var pendTex = data.pendapatanText
                            var jumlah = data.jumlahPend
                            var isPPh = data.isPPh
                            var totalTunjangan = Number(jumlah) * Number(totalCount)
                            if(isPPh == true){
                                jumlahPPh21 += Number(totalTunjangan);
                            }
                            totalTunjangantoCount += totalTunjangan
                            if(totalTunjangan > 0){
                                recSlipGaji.selectNewLine({
                                    sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                });
                                recSlipGaji.setCurrentSublistValue({
                                    sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId : "custrecord_abj_msa_slip_rem_pendapatan",
                                    value : pendTex
                                })
                                recSlipGaji.setCurrentSublistValue({
                                    sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId : "custrecord_abj_msa_slip_pendapatan",
                                    value : totalTunjangan
                                })
                                recSlipGaji.setCurrentSublistValue({
                                    sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                                    fieldId : "custrecord_id_komponen",
                                    value : idPend
                                })
                                recSlipGaji.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                            }
                        })
                    }
                    var pendapatanCount = recSlip.getLineCount({
                        sublistId: 'recmachcustrecord_msa_remunasipend'
                    });
                    var totalBayarLembur = 0
                    if(pendapatanCount > 0){
                        for(var index = 0; index < pendapatanCount; index++){
                            var kompPendapatan = recSlip.getSublistValue({
                                sublistId : 'recmachcustrecord_msa_remunasipend',
                                fieldId : 'custrecord_msa_slipgaji_pendapatan',
                                line : index,
                            });
                            if(kompPendapatan){
                                var recKompPendapatan = record.load({
                                    type : "customrecord_msa_komponen_pendapatan",
                                    id : kompPendapatan
                                });
                                var typeKomponen = recKompPendapatan.getValue("custrecord_msa_type_salary");
                                var isPPh = recKompPendapatan.getValue("custrecord_msa_pend_is_pph");
                                if(typeKomponen == '4'){
                                    var formulaLembur = recKompPendapatan.getValue("custrecord_list_overtime");
                                    if(formulaLembur == '3'){
                                        var jumlah = recKompPendapatan.getValue("custrecord_jumlah_rupiah");
                                        log.debug("jumlah", jumlah);
                                        totalBayarLembur = Number(jumlah) * Number(totalHoursOvt);

                                    }else if(formulaLembur == '1'){
                                        var jumlah = Number(gajiPokok) / 173
                                        totalBayarLembur = Number(jumlah) * Number(totalHoursOvt);
                                    }else{
                                        var jumlah = Number(gajiPokok) / 173
                                        totalBayarLembur = Number(jumlah) * Number(totalHoursOvt);
                                    }
                                    if(isPPh == true){
                                        jumlahPPh21 += Number(totalBayarLembur);
                                    }
                                }
                            }
                        }
                    }
                    if(totalBayarLembur > 0){
                        recSlipGaji.selectNewLine({
                            sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                        });
                        recSlipGaji.setCurrentSublistValue({
                            sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId : "custrecord_abj_msa_slip_rem_pendapatan",
                            value : "Overtime (Uang Lembur)"
                        })
                        recSlipGaji.setCurrentSublistValue({
                            sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId : "custrecord_abj_msa_slip_pendapatan",
                            value : totalBayarLembur
                        })
                        recSlipGaji.setCurrentSublistValue({
                            sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId : "custrecord_id_komponen",
                            value : 0
                        })
                        recSlipGaji.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                    }
                    var gajiBrutotoSet = Number(gajiBruto) + Number(totalBayarLembur) + Number(totalTunjangantoCount);
                    var BiayaJabatan = 5 / 100 * jumlahPPh21
                        if(BiayaJabatan > 500000){
                            BiayaJabatan = 500000
                        }
                    var BiayaJabatanTahun = BiayaJabatan * 12
                    var potonganTahun = Number(totalPotongan) * 12
                    var totalPotonganTahun = Number(BiayaJabatanTahun) + Number(potonganTahun)
                    var totalIncometahun = (Number(jumlahPPh21) * 12) 
                    var penghasilanNetto = Number(totalIncometahun) - Number(totalPotonganTahun)
                    log.debug('totalIncomeToahun', totalIncometahun);
                    log.debug('jumlahPtkp', jumlahPtkp);
                    var pkp = Number(penghasilanNetto) - jumlahPtkp
                    log.debug('pkp', pkp);
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
                    if(metodePajak == '1'){
                        recSlipGaji.setValue({
                            fieldId: 'custrecord_abj_msa_pph21perusahaan',
                            value : pajakperBulan
                        })
                    }else if(metodePajak == '2'){
                        recSlipGaji.selectLine({
                            sublistId : "recmachcustrecord_abj_msa_slip_potongan",
                            line : lineNumberPotongan
                        })
                        recSlipGaji.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                            fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                            line : lineNumberPotongan,
                            value: pajakperBulan,
                        });
                        recSlipGaji.commitLine("recmachcustrecord_abj_msa_slip_potongan");

                        recSlipGaji.setValue({
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
                        log.debug("pajakperBulanGrossUp", pajakperBulanGrossUp)
                        recSlipGaji.setValue({
                            fieldId : 'custrecord_abj_msa_pph21perusahaan',
                            value : pajakperBulanGrossUp
                        });
                        recSlipGaji.setValue({
                            fieldId : 'custrecord_abj_msa_pph21karyawan',
                            value : pajakperBulanGrossUp
                        });

                        recSlipGaji.selectLine({
                            sublistId : "recmachcustrecord_abj_msa_slip_slip_gaji",
                            line : lineNumber
                        })
                        recSlipGaji.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId: "custrecord_abj_msa_slip_pendapatan",
                            line : lineNumber,
                            value: pajakperBulanGrossUp,
                        });
                        recSlipGaji.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");

                        recSlipGaji.selectLine({
                            sublistId : "recmachcustrecord_abj_msa_slip_potongan",
                            line : lineNumberPotongan
                        })
                        recSlipGaji.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                            fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                            line : lineNumberPotongan,
                            value: pajakperBulanGrossUp,
                        });
                        recSlipGaji.commitLine("recmachcustrecord_abj_msa_slip_potongan");

                    }
                    var thptoSet = Number(thp) + Number(totalBayarLembur) + Number(totalTunjangantoCount);
                    recSlipGaji.setValue({
                        fieldId: 'custrecord_abj_msa_bruto',
                        value : gajiBrutotoSet
                    })
                    recSlipGaji.setValue({
                        fieldId: 'custrecord_abj_msa_thp',
                        value : thptoSet
                    })
                    recSlipGaji.setValue({
                        fieldId : "custrecord_abj_msa_status_gaji",
                        value : 2
                    })
                    recSlipGaji.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    })
                })
                
            }
        }catch(e){
            log.debug('error', e)
        }
        function getIndonesianMonth(monthIndex) {
            log.debug('monthIndex', monthIndex);
            var monthNames = [
                'Januari', 'Februari', 'Maret', 'April',
                'Mei', 'Juni', 'Juli', 'Agustus',
                'September', 'Oktober', 'November', 'Desember'
            ];
            return monthNames[monthIndex];
        }
        function formatDate(dateString) {
            var parts = dateString.split(" ");
            var day = parts[0];
            var month = getMonthNumber(parts[1]);
            var year = parts[2];
            return day + "/" + month + "/" + year;
        }
        function getMonthNumber(monthName) {
            var months = {
                "Januari": "01",
                "Februari": "02",
                "Maret": "03",
                "April": "04",
                "Mei": "05",
                "Juni": "06",
                "Juli": "07",
                "Agustus": "08",
                "September": "09",
                "Oktober": "10",
                "November": "11",
                "Desember": "12"
            };
            return months[monthName];
        }
    }
    
    return {
        execute: execute
    };
});