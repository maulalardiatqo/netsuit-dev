/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord','N/record', 'N/search'], function (currentRecord, record, search) {
    function pageInit(context) {
        console.log('masuk');
        var currentRecordObj = currentRecord.get();
        var employee = currentRecordObj.getValue('custrecord_employee_pengajuan');

    }
    function fieldChanged(context) {
        var currentRecordObj = currentRecord.get();
       
        if(context.fieldId == 'custrecord_employee_gaji'){
            var employee = currentRecordObj.getValue('custrecord_employee_gaji');
            console.log(employee);
            // search employee
            var searchEmployee = search.create({
                type: 'employee',
                columns: ['internalid', 'custentity_tipe_ptkp',],
                filters: [{
                  name: 'internalid',
                  operator: 'is',
                  values: employee
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
                console.log('tipePTKP', tipePTKP);
            }
            // searchPTKP
            if(tipePTKP){
                var recordPTKP = record.load({
                    type : 'customrecord_ptpk',
                    id : tipePTKP,
                    isDynamic : true
                });
                var jumlahPTKP = recordPTKP.getValue('custrecord_jumlah_ptpk');
                console.log('jumlahPTKP', jumlahPTKP);
            }

            //search remunasi
            var searchRemunasi = search.create({
                type: 'customrecord_remunasi',
                columns: ['internalid', 'custrecord3', 'custrecord4', 'custrecord5', 'custrecord6', 'custrecord_metode_pph_21', 'custrecord_remunasi_jks', 'custrecord_remunasi_jkk', 'custrecord_remunasi_jkm', 'custrecord_remunasi_jht', 'custrecord_remunasi_jp'],
                filters: [{
                  name: 'custrecord3',
                  operator: 'is',
                  values: employee
                }]
            });
            var searchRemunasiSet = searchRemunasi.run();
            searchRemunasi = searchRemunasiSet.getRange({
                start: 0,
                end: 1
            });
            console.log(searchRemunasi);
            if(searchRemunasi.length>0){
                var searchRemunasiRecord = searchRemunasi[0];
                var gajiPokok = searchRemunasiRecord.getValue({
                    name : 'custrecord4'
                });
                var mealAllowance = searchRemunasiRecord.getValue({
                    name : 'custrecord5'
                });
                var transportAllowance = searchRemunasiRecord.getValue({
                    name : 'custrecord6'
                })
                var metodePPH = searchRemunasiRecord.getValue({
                    name :'custrecord_metode_pph_21'
                });
                var jks = searchRemunasiRecord.getValue({
                    name :'custrecord_remunasi_jks'
                });
                var jkk = searchRemunasiRecord.getValue({
                    name :'custrecord_remunasi_jkk'
                });
                var jkm = searchRemunasiRecord.getValue({
                    name :'custrecord_remunasi_jkm'
                });
                var jht = searchRemunasiRecord.getValue({
                    name :'custrecord_remunasi_jht'
                });
                var jp = searchRemunasiRecord.getValue({
                    name : 'custrecord_remunasi_jp'
                });
                
                
                
                console.log('data', {gajiPokok, mealAllowance, metodePPH, transportAllowance});
                var totalIncome = Number(gajiPokok) + Number(mealAllowance) + Number(transportAllowance);


                // biaya jabatan
                var BiayaJabatan = 5 / 100 * totalIncome
                if(BiayaJabatan > 500000){
                    BiayaJabatan = 500000
                }
                var totalBiayaJabatan = BiayaJabatan * 12
                console.log('totalBiayaJabatan', totalBiayaJabatan);

                var penghasilanBruto = totalIncome * 12
                console.log('penghasilanBruto', penghasilanBruto);

                var penghasilanNetto = penghasilanBruto - totalBiayaJabatan
                console.log('penghasilanNetto', penghasilanNetto);

                var pkp = penghasilanNetto - Number(jumlahPTKP)
                console.log('jumlahPTKP', jumlahPTKP);

                console.log('pkp', pkp);
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
                // BPJS
                if(jks){
                    var biayaJKS = totalIncome * 4 / 100
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jks',
                        value : biayaJKS
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jks',
                        value : biayaJKS
                    });
                    totalIncome = totalIncome + biayaJKS
                }else{
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jks',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jks',
                        value : ''
                    });
                }
                if(jkk){
                    var biayaJKK = totalIncome * 0.2 / 100
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jkk',
                        value : biayaJKK
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jkk',
                        value : biayaJKK
                    });
                    totalIncome = totalIncome + biayaJKK
                }else{
                    var biayaJKK = totalIncome * 0.2 / 100
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jkk',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jkk',
                        value : ''
                    });
                    
                }
                if(jkm){
                    var biayaJKM = totalIncome * 0.3 / 100
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jkm',
                        value : biayaJKM
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jkm',
                        value : biayaJKM
                    });
                    totalIncome = totalIncome + biayaJKM
                }else{
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_jkm',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_premi_jkm',
                        value : ''
                    });
                }
                if(jht){

                }
                
                currentRecordObj.setValue({
                    fieldId : 'custrecord_gaji_gaji_pokok',
                    value : gajiPokok
                })
                currentRecordObj.setValue({
                    fieldId : 'custrecord_meal_allowance_gaji',
                    value : mealAllowance
                })
                currentRecordObj.setValue({
                    fieldId : 'custrecord_transport_allowance_gaji',
                    value : transportAllowance
                })
                currentRecordObj.setValue({
                    fieldId : 'custrecord_total_income_gaji',
                    value : totalIncome
                })
                
                if(metodePPH == 1){
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord8',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_pph21',
                        value : pajakperBulan
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : totalIncome
                    });
                }
                if(metodePPH == 2){
                    console.log('masuk')
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_pph21',
                        value : ''
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : ''
                    });
                    totalIncome = Number(totalIncome) - Number(pajakperBulan)
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : totalIncome
                    });
                    console.log('pajakPerbulan', pajakperBulan);
                    currentRecordObj.setValue({
                        fieldId : 'custrecord8',
                        value : pajakperBulan
                    });
                    
                }
                if (metodePPH == 3) {
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_pph21',
                        value : ''
                    });
                    var pajakPertahun = 0;
                
                    if (pkp <= 47500000) {
                        pajakPertahun = (pkp - 0) * (5 / 95) + 0;
                        console.log('pajakPertahun', pajakPertahun);
                    } else if (pkp <= 217500000) {
                        pajakPertahun = (pkp - 47500000) * (15 / 85) + 2500000;
                        console.log('pajakPertahun', pajakPertahun);
                    } else if (pkp <= 405000000) {
                        pajakPertahun = (pkp - 217500000) * (25 / 75) + 32500000;
                        console.log('pajakPertahun', pajakPertahun);
                    } else {
                        pajakPertahun = (pkp - 405000000) * (30 / 70) + 95000000;
                        console.log('pajakPertahun', pajakPertahun);
                    }
                
                    var pajakperBulan = pajakPertahun / 12;

                    currentRecordObj.setValue({
                        fieldId : 'custrecord_tunjangan_pph',
                        value : pajakperBulan
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord8',
                        value : pajakperBulan
                    });
                    currentRecordObj.setValue({
                        fieldId : 'custrecord_take_home_pay',
                        value : totalIncome
                    });

                }
            }
        }
       
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
