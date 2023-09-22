/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    
    function execute(context) {
        try{
            var allData = [];
            var searchRemunasi = search.create({
                type: 'customrecord_remunasi',
                columns: ['internalid', 'custrecord3', 'custrecord4', 'custrecord5', 'custrecord6', 'custrecord_metode_pph_21', 'custrecord_remunasi_jks', 'custrecord_remunasi_jkm', 'custrecord_remunasi_jkk', 'custrecord_remunasi_jht', 'custrecord_is_jht_pphh_21', 'custrecord_is_jp_pph21', 'custrecord9','custrecord3', 'custrecord_remunasi_tanggal_awal_period'],
            });
            var searchRemunasiSet = searchRemunasi.runPaged().count;
            searchRemunasi.run().each(function(row){
                var employeeId = row.getValue({
                    name : 'custrecord3'
                });
                var gajiPokok = row.getValue({
                    name : 'custrecord4'
                }) || 0;
                log.debug('gajiPokok', gajiPokok);
                var tanggalAwalPeriod = row.getValue({
                    name : 'custrecord_remunasi_tanggal_awal_period'
                });
                var mealAllowance = row.getValue({
                    name : 'custrecord5'
                }) || 0;
                var transportAllowance =row.getValue({
                    name : 'custrecord6'
                }) || 0;
                var metodePPH = row.getValue({
                    name :'custrecord_metode_pph_21'
                }) || 0;
               
                var jks = row.getValue({
                    name : 'custrecord_remunasi_jks'
                }) || 0;
                var jkm = row.getValue({
                    name : 'custrecord_remunasi_jkm'
                }) || 0;
                var jkk = row.getValue({
                    name : 'custrecord_remunasi_jkk'
                }) || 0;
                var jht = row.getValue({
                    name : 'custrecord_remunasi_jht'
                }) || 0;
                var isJhtPPh21 = row.getValue({
                    name : 'custrecord_is_jht_pphh_21'
                }) || 0;
                var isJpPph21 = row.getValue({
                    name : 'custrecord_is_jht_pphh_21'
                }) || 0;
                var jp = row.getValue({
                    name : 'custrecord9'
                }) || 0;


                var totalIncome = Number(gajiPokok) + Number(mealAllowance) + Number(transportAllowance);
                

                allData.push({
                    employeeId : employeeId,
                    gajiPokok : gajiPokok,
                    mealAllowance : mealAllowance,
                    transportAllowance : transportAllowance,
                    metodePPH : metodePPH,
                    jks : jks,
                    jkm : jkm,
                    jkk : jkk,
                    jht : jht,
                    isJhtPPh21 : isJhtPPh21,
                    isJpPph21 : isJpPph21,
                    jp : jp,
                    totalIncome : totalIncome,
                    tanggalAwalPeriod : tanggalAwalPeriod

                })
                
                return true;
            });
            
            for (var i = 0; i < allData.length; i++) {
                var data = allData[i];
                log.debug('data', data);
                var employeeId = data.employeeId;
                var gajiPokok = data.gajiPokok;
                var mealAllowance = data.mealAllowance;
                var transportAllowance = data.transportAllowance;
                var metodePPH = data.metodePPH;
                var jks = data.jks;
                var jkm = data.jkm;
                var jkk = data.jkk;
                var jht = data.jht;
                var jp = data.jp;
                var isJhtPPh21 = data.isJhtPPh21;
                var isJpPph21 = data.isJpPph21;
                var totalIncome = data.totalIncome
                var tanggalAwalPeriod = data.tanggalAwalPeriod

                var recordGaji = record.create({
                    type : 'customrecord_gaji',
                    isDynamic: true
                });

                if(tanggalAwalPeriod){
                    var bulanSaatIni = new Date().getMonth(); 
                    var tahunSaatIni = new Date().getFullYear();

                    if (tanggalAwalPeriod <= new Date().getDate()) {
                        bulanMulaiPeriod = bulanSaatIni;
                        tahunMulaiPeriod = tahunSaatIni;
                    } else {
                        bulanMulaiPeriod = bulanSaatIni - 1;
                        tahunMulaiPeriod = tahunSaatIni;
                        if (bulanMulaiPeriod === -1) {
                            bulanMulaiPeriod = 11; 
                            tahunMulaiPeriod--; 
                        }
                    }

                    var tanggalMulaiPeriod = tanggalAwalPeriod;

                    var akhirPeriodDate = new Date(tahunMulaiPeriod, bulanMulaiPeriod, tanggalMulaiPeriod);

                    if (bulanMulaiPeriod === 11) { 
                        tahunMulaiPeriod++; 
                        bulanMulaiPeriod = 0; 
                    } else {
                        bulanMulaiPeriod++; 
                    }

                    akhirPeriodDate = new Date(tahunMulaiPeriod, bulanMulaiPeriod, tanggalMulaiPeriod);
                    akhirPeriodDate.setMonth(akhirPeriodDate.getMonth() + 1);
                    akhirPeriodDate.setDate(akhirPeriodDate.getDate() - 1);

                    var tanggalAwalPeriodStr = tanggalMulaiPeriod + ' ' + getNamaBulan(bulanMulaiPeriod) + ' ' + tahunMulaiPeriod;
                    var tanggalAkhirPeriodStr = akhirPeriodDate.getDate() + ' ' + getNamaBulan(akhirPeriodDate.getMonth()) + ' ' + akhirPeriodDate.getFullYear();

                    function getNamaBulan(index) {
                        var namaBulan = [
                            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return namaBulan[index];
                    }

                    var period = tanggalAwalPeriodStr + ' - ' + tanggalAkhirPeriodStr;
                    log.debug('Period:', period);
                }

                var biayaJKS = 0
                var premiJKS = 0
                var jksTOPlus = 0
                var jksTOMin = 0
                var biayaJKS = 0
                var premiJKS = 0

                if(jks){
                    
                    if(jks == 1){
                        biayaJKS = totalIncome * 5 / 100

                        recordGaji.setValue({
                            fieldId : 'custrecord_jks',
                            value : biayaJKS
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_jks_4per',
                            value : 0
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jks',
                            value : biayaJKS
                        })
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jks_1per',
                            value : 0
                        });
                        jksTOPlus = biayaJKS
                        jksTOMin = biayaJKS
                    }else{
                        biayaJKS = totalIncome * 4 / 100
                        premiJKS = totalIncome * 1 / 100

                        recordGaji.setValue({
                            fieldId : 'custrecord_jks',
                            value : 0
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_jks_4per',
                            value : biayaJKS
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jks',
                            value : biayaJKS
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jks_1per',
                            value : premiJKS
                        });
                        jksTOPlus = biayaJKS
                        jksTOMin = biayaJKS + premiJKS
                    }
                    
                }

                var jkkToCount = 0
                var biayaJKK = 0
                var premiJKK = 0
                if(jkk){
                    if(jkk == 1){
                        biayaJKK = totalIncome * 0.24 / 100
                        premiJKK = biayaJKK
                        
                    }else if(jkk == 2){
                        biayaJKK = totalIncome * 0.54 / 100
                        premiJKK = biayaJKK
                    }else if(jkk == 3){
                        biayaJKK = totalIncome * 0.89 / 100
                        premiJKK = biayaJKK
                    }else if(jkk == 4){
                        biayaJKK = totalIncome * 1.27 / 100
                        premiJKK = biayaJKK
                    }else if(jkk == 5){
                        biayaJKK = totalIncome * 1.74 / 100
                        premiJKK = biayaJKK
                    }
                    jkkToCount = biayaJKK
                }
                // set value jkk
                recordGaji.setValue({
                    fieldId : 'custrecord_jkk',
                    value : biayaJKK,
                    ignoreFieldChange: true
                })
                recordGaji.setValue({
                    fieldId : 'custrecord_premi_jkk',
                    value : premiJKK,
                    ignoreFieldChange: true
                });

                var jkmTOCount = 0
                var biayaJKM = 0
                var premiJKM = 0
                if(jkm){
                    biayaJKM = totalIncome * 0.3 / 100
                    premiJKM = biayaJKM
                    jkmTOCount = biayaJKM
                }

                // set Biaya JKM
                recordGaji.setValue({
                    fieldId : 'custrecord_jkm',
                    value : biayaJKM,
                    ignoreFieldChange: true
                })
                recordGaji.setValue({
                    fieldId : 'custrecord_premi_jkm',
                    value : premiJKM,
                    ignoreFieldChange: true
                })

                var biayaJHTtoCount = 0
                var jhtToMin = 0
                var biayaJHT = 0
                var premiJHT = 0
                if(jht){
                    if(jht == 1){
                        biayaJHT = totalIncome * 3.7 / 100
                        premiJHT = totalIncome * 2 / 100
                    }else{
                        biayaJHT = totalIncome * 5.7 / 100
                        premiJHT = biayaJHT
                    }
                    if(isJhtPPh21){
                        biayaJHTtoCount = biayaJHT
                        
                        recordGaji.setValue({
                            fieldId : 'custrecord_jht',
                            value : biayaJHT
                        })
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jht',
                            value : premiJHT
                        });
                        jhtToMin = biayaJHT + premiJHT
                    }else{
                        recordGaji.setValue({
                            fieldId : 'custrecord_jht',
                            value : 0
                        });
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jht',
                            value : biayaJHT
                        });
                        jhtToMin = biayaJHT
                        
                    }
                    
                }

                var biayaJPtoCuunt = 0
                var biayaJP = 0
                var premiJP = 0
                if(jp){      
                    if(jp == 1){
                        biayaJP = totalIncome * 2 / 100
                    }else{
                        biayaJP = totalIncome * 3 / 100
                    }

                    if(isJpPph21){
                        biayaJPtoCuunt = biayaJP
                        recordGaji.setValue({
                            fieldId : 'custrecord_jp',
                            value : biayaJP,
                            ignoreFieldChange: true
                        })
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jp',
                            value : biayaJP,
                            ignoreFieldChange: true
                        })
                    }else{
                        recordGaji.setValue({
                            fieldId : 'custrecord_jp',
                            value : 0,
                            ignoreFieldChange: true
                        })
                        recordGaji.setValue({
                            fieldId : 'custrecord_premi_jp',
                            value : biayaJP,
                            ignoreFieldChange: true
                        })
                        premiJP = biayaJP
                    }
                }

                totalIncome = totalIncome + biayaJHTtoCount + jkkToCount + biayaJKM + jksTOPlus + biayaJPtoCuunt

                // search Employee

                var searchEmployee = search.create({
                    type: 'employee',
                    columns: ['internalid', 'custentity_tipe_ptkp',],
                    filters: [{
                      name: 'internalid',
                      operator: 'is',
                      values: employeeId
                    }]
                });
                var searchEmployeeSet = searchEmployee.run();
                searchEmployee = searchEmployeeSet.getRange({
                    start: 0,
                    end: 1
                });
                if(searchEmployee.length>0){
                    var searchEmployeeRecord = searchEmployee[0];
                    var tipePTKP = searchEmployeeRecord.getValue({
                        name : 'custentity_tipe_ptkp'
                    });
                    log.debug('tipePTKP', tipePTKP);
                }
                // searchPTKP
                if(tipePTKP){
                    var recordPTKP = record.load({
                        type : 'customrecord_ptpk',
                        id : tipePTKP,
                        isDynamic : true
                    });
                    var jumlahPTKP = recordPTKP.getValue('custrecord_jumlah_ptpk');
                    log.debug('jumlahPTKP', jumlahPTKP);
                }

                var BiayaJabatan = 5 / 100 * totalIncome
                if(BiayaJabatan > 500000){
                    BiayaJabatan = 500000
                }
                
                var totalBiayaJabatan = BiayaJabatan * 12
                log.debug('totalBiayaJabatan', totalBiayaJabatan);

                var penghasilanBruto = totalIncome * 12
                log.debug('penghasilanBruto', penghasilanBruto);

                var penghasilanNetto = penghasilanBruto - totalBiayaJabatan
                log.debug('penghasilanNetto', penghasilanNetto);

                var pkp = penghasilanNetto - Number(jumlahPTKP)
                log.debug('jumlahPTKP', jumlahPTKP);

                log.debug('pkp', pkp);
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

                    var pajakperBulan = pajak / 12
                }


                recordGaji.setValue({
                    fieldId : 'custrecord_employee_gaji',
                    value : employeeId,
                    ignoreFieldChange: true
                });

                recordGaji.setValue({
                    fieldId : 'custrecord_period_gaji',
                    value : period
                })

                recordGaji.setValue({
                    fieldId : 'custrecord_gaji_gaji_pokok',
                    value : gajiPokok,
                    ignoreFieldChange: true
                })
                recordGaji.setValue({
                    fieldId : 'custrecord_meal_allowance_gaji',
                    value : mealAllowance,
                    ignoreFieldChange: true
                })
                recordGaji.setValue({
                    fieldId : 'custrecord_transport_allowance_gaji',
                    value : transportAllowance,
                    ignoreFieldChange: true
                })
                recordGaji.setValue({
                    fieldId : 'custrecord_total_income_gaji',
                    value : totalIncome,
                    ignoreFieldChange: true
                });

                var takeHomePay = totalIncome - jhtToMin - premiJKK - premiJKM - jksTOMin - premiJP
                log.debug('takeHomePay', takeHomePay);
                var pph21ditanggungKaryawan = 0

                if(metodePPH == 1){
                    recordGaji.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : '',
                        ignoreFieldChange: true
                    });
                    recordGaji.setValue({
                        fieldId : 'custrecord8',
                        value : pph21ditanggungKaryawan,
                        ignoreFieldChange: true
                    });
                    recordGaji.setValue({
                        fieldId : 'custrecord_pph21',
                        value : pajakperBulan,
                        ignoreFieldChange: true
                    });
                    takeHomePay = takeHomePay - pph21ditanggungKaryawan
                    recordGaji.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : takeHomePay,
                        ignoreFieldChange: true
                    });
                }
                if(metodePPH == 2){
                    log.debug('metodePPH=2')
                    recordGaji.setValue({
                        fieldId : 'custrecord_pph21',
                        value : 0,
                        ignoreFieldChange: true
                    });
                    recordGaji.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : 0,
                        ignoreFieldChange: true
                    });
                    takeHomePay = Number(takeHomePay) - Number(pajakperBulan)
                    recordGaji.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : takeHomePay,
                        ignoreFieldChange: true
                    });

                    pph21ditanggungKaryawan = pajakperBulan
                    log.debug('pajakPerbulan', pajakperBulan);
                    recordGaji.setValue({
                        fieldId : 'custrecord8',
                        value : pph21ditanggungKaryawan,
                        ignoreFieldChange: true
                    });
                    
                }
                if (metodePPH == 3) {
                    recordGaji.setValue({
                        fieldId : 'custrecord_pph21',
                        value : '',
                        ignoreFieldChange: true
                    });
                    var pajakPertahun = 0;
                
                    if (pkp <= 47500000) {
                        pajakPertahun = (pkp - 0) * (5 / 95) + 0;
                        log.debug('pajakPertahun', pajakPertahun);
                    } else if (pkp <= 217500000) {
                        pajakPertahun = (pkp - 47500000) * (15 / 85) + 2500000;
                        log.debug('pajakPertahun', pajakPertahun);
                    } else if (pkp <= 405000000) {
                        pajakPertahun = (pkp - 217500000) * (25 / 75) + 32500000;
                        log.debug('pajakPertahun', pajakPertahun);
                    } else {
                        pajakPertahun = (pkp - 405000000) * (30 / 70) + 95000000;
                        log.debug('pajakPertahun', pajakPertahun);
                    }
                
                    var pajakperBulan = pajakPertahun / 12;

                    recordGaji.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : pajakperBulan,
                        ignoreFieldChange: true
                    });
                    pph21ditanggungKaryawan = pajakperBulan
                    recordGaji.setValue({
                        fieldId : 'custrecord8',
                        value : pph21ditanggungKaryawan,
                        ignoreFieldChange: true
                    });
                    recordGaji.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : takeHomePay,
                        ignoreFieldChange: true
                    });
                   

                }
                recordGaji.setValue({
                    fieldId : 'custrecord_status_gaji',
                    value : 1,
                    ignoreFieldChange: true
                });
                var saveGaji = recordGaji.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                  });
                log.debug('saveGaji', saveGaji);

            }
        }catch(e){
            log.debug('error', e);
        }
    }
    
    return {
        execute: execute
    };
});
