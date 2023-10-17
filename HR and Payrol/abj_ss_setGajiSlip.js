/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    
    function execute(context) {
        try{
            function getAllResults(s) {
                var results = s.run();
                var searchResults = [];
                var searchid = 0;
                do {
                  var resultslice = results.getRange({
                    start: searchid,
                    end: searchid + 1000
                  });
                  resultslice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchid++;
                  });
                } while (resultslice.length >= 1000);
                return searchResults;
            }
            
            var uniqueSlipGaji = [];
            var dataPendapatan = [];
            var dataPotongan = [];
            var searchPendapatan = search.create({
              type: "customrecord_msa_remunerasi",
              filters: [],
              columns:
              [
                  search.createColumn({
                    name: "id",
                    sort: search.Sort.ASC,
                    label: "ID"
                  }),
                  search.createColumn({name: 'internalid'}),
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
                    name: "custrecord_remu_slipgaji",
                    join: "CUSTRECORD_REMUNERASI",
                    label: "Slip Gaji"
                  }),
              ]
           });
            var searchPendapatanSet = getAllResults(searchPendapatan);
            
            searchPendapatanSet.forEach(function (row) {
                var idRemunerasi = row.getValue({
                    name: 'internalid'
                });
                var employee = row.getValue({
                    name: 'custrecord_remunerasi_employee'
                });
                var slip_gaji_pendapatan = row.getValue({
                    name: "custrecord_remu_slipgaji",
                    join: "CUSTRECORD_REMUNERASI",
                });
                var pendapatan = row.getValue({
                    name: "custrecord_id_pendapatan",
                    join: "CUSTRECORD_REMUNERASI",
                });
                var jumlahPendapatan = row.getValue({
                    name: "custrecord_jumlah_pendapatan",
                    join: "CUSTRECORD_REMUNERASI",
                });
                dataPendapatan.push({
                  idRemunerasi : idRemunerasi,
                  employee : employee,
                  slip_gaji_pendapatan : slip_gaji_pendapatan,
                  pendapatan : pendapatan,
                  jumlahPendapatan : jumlahPendapatan
                })
                

                return true;
            });

            // search potongan
            var searchPotongan = search.create({
              type: "customrecord_msa_remunerasi",
              filters:
              [
                  ["custrecord_msa_potongan_remunerasi.custrecord_msa_id_potongan","noneof","@NONE@"]
              ],
              columns:
              [
                  search.createColumn({
                    name: "id",
                    sort: search.Sort.ASC,
                    label: "ID"
                  }),
                  search.createColumn({name: 'internalid'}),
                  search.createColumn({name: "custrecord_remunerasi_employee", label: "Employee"}),
                  search.createColumn({
                    name: "custrecord_msa_id_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    label: "Komponen Potongan"
                  }),
                  search.createColumn({
                    name: "custrecord_msa_jumlah_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    label: "Jumlah"
                  }),
                  search.createColumn({
                    name: "custrecord_msa_slip_gaji_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    label: "Slip Gaji"
                  })
              ]
            });
            var searchResultCount = searchPotongan.runPaged().count;
            searchPotongan.run().each(function(result){
                var idRemunerasi = result.getValue({
                    name: "internalid",
                });
                var employee = result.getValue({
                  name: "custrecord_remunerasi_employee"
                });
                var slip_gaji_potongan = result.getValue({
                  name: "custrecord_msa_slip_gaji_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });
                var potongan = result.getValue({
                  name: "custrecord_msa_id_potongan",
                  join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });
                var jumlahPotongan = result.getValue({
                    name: "custrecord_msa_jumlah_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });

                dataPotongan.push({
                  idRemunerasi : idRemunerasi,
                  employee : employee,
                  slip_gaji_potongan : slip_gaji_potongan,
                  potongan : potongan,
                  jumlahPotongan : jumlahPotongan
                })
                return true;
            });
            var combinedData = {};
            dataPendapatan.forEach(function (pendapatan) {
                var employee = pendapatan.employee;
                var idRemunerasi = pendapatan.idRemunerasi;

                if (!combinedData[employee]) {
                    combinedData[employee] = {
                        idRemunerasi: idRemunerasi,
                        employee : employee,
                        pendapatan: [],
                        potongan: []
                    };
                }

                combinedData[employee].pendapatan.push({
                    slip_gaji: pendapatan.slip_gaji_pendapatan,
                    pendapatan: pendapatan.pendapatan,
                    jumlahPendapatan: pendapatan.jumlahPendapatan
                });
            });

            dataPotongan.forEach(function (potongan) {
                var employee = potongan.employee;
                var idRemunerasi = potongan.idRemunerasi;

                if (!combinedData[employee]) {
                    combinedData[employee] = {
                        idRemunerasi: idRemunerasi,
                        employee : employee,
                        pendapatan: [],
                        potongan: []
                    };
                }

                combinedData[employee].potongan.push({
                    slip_gaji: potongan.slip_gaji_potongan,
                    potongan: potongan.potongan,
                    jumlahPotongan: potongan.jumlahPotongan
                });
            });

            var groupedData = {};

            for (var employee in combinedData) {
                var employeeData = combinedData[employee];

                employeeData.pendapatan.forEach(function (pendapatan) {
                    var idRemunerasi = employeeData.idRemunerasi;
                    var employee = employeeData.employee;
                    var slipGaji = pendapatan.slip_gaji;
                    var pendapatanValue = pendapatan.pendapatan;
                    var jumlahPendapatan = pendapatan.jumlahPendapatan;

                    var groupKey = idRemunerasi + '_' + slipGaji;

                    if (!groupedData[groupKey]) {
                        groupedData[groupKey] = {
                            idRemunerasi: idRemunerasi,
                            employee: employee,
                            slipGaji: slipGaji,
                            lineItems: []
                        };
                    }

                    var lineItem = {
                        jenis: 'Pendapatan',
                        komponen: pendapatanValue,
                        jumlah: jumlahPendapatan
                    };

                    groupedData[groupKey].lineItems.push(lineItem);
                });

                employeeData.potongan.forEach(function (potongan) {
                    var idRemunerasi = employeeData.idRemunerasi;
                    var employee = employeeData.employee;
                    var slipGaji = potongan.slip_gaji;
                    var potonganValue = potongan.potongan;
                    var jumlahPotongan = potongan.jumlahPotongan;

                    var groupKey = idRemunerasi + '_' + slipGaji;

                    if (!groupedData[groupKey]) {
                        groupedData[groupKey] = {
                            idRemunerasi: idRemunerasi,
                            employee: employee,
                            slipGaji: slipGaji,
                            lineItems: []
                        };
                    }

                    var lineItem = {
                        jenis: 'Potongan',
                        komponen: potonganValue,
                        jumlah: jumlahPotongan
                    };

                    groupedData[groupKey].lineItems.push(lineItem);
                });
                
            }
            log.debug('groupedData', groupedData);

            
            for (var groupKey in groupedData) {
                var group = groupedData[groupKey];
                var employee = group.employee;
                log.debug('employee', employee);
                var slipGaji = group.slipGaji;
                var lineItems = group.lineItems;
                var searchSlip = search.create({
                    type: 'customrecord_slip_gaji',
                    columns: ['internalid', 'custrecord_lama_period', 'custrecord_tanggal_awal_period'],
                    filters: [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: slipGaji
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
                        if(lamaPeriod == 1){
                          var recCreate = record.create({
                            type : 'customrecord_msa_slip_gaji',
                            isDynamic: true
                          });
                          recCreate.setValue({
                              fieldId : 'custrecord_abj_msa_employee_slip',
                              value : employee
                          });
                          recCreate.setValue({
                            fieldId : 'custrecord_abj_msa_slipgaji_id',
                            value : slipGaji
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
                            if(period){
                              recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_period_gaji',
                                value : period
                              })
                            }
                            var sumKompPendapatan = 0;
                            var gajiPokok;
                            for (var i = 0; i < lineItems.length; i++) {
                              var lineItem = lineItems[i];
                              var jenis = lineItem.jenis;
                              var komponen = lineItem.komponen;
                              var jumlah = lineItem.jumlah;
                              //search PPH
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
                              var searchResultCount = customrecord58SearchObj.runPaged().count;
                              customrecord58SearchObj.run().each(function(result){
                                
                                return true;
                              }); 

                          
                              if (jenis == 'Pendapatan') {
                                  var isPPh21;
                                  var typeSalary;
                                  // search komponen pendapatan
                                  var customrecord_msa_komponen_pendapatanSearchObj = search.create({
                                    type: "customrecord_msa_komponen_pendapatan",
                                    filters:
                                    [
                                      {
                                        name : 'internalid',
                                        operator: search.Operator.IS,
                                        values: komponen
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
                                      log.debug('typeSalary', typeSalary);
                                      return true;
                                  });

                                  log.debug('komponen', { komponen: komponen, isPPh21: isPPh21, jumlah:jumlah });
                                  
                                  if (isPPh21 == true) {
                                      sumKompPendapatan += Number(jumlah);
                                  }
                                  if(typeSalary == '1'){
                                    gajiPokok = komponen
                                  }
                                  recCreate.selectNewLine({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                      fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                      value: komponen,
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                      fieldId: "custrecord_abj_msa_slip_pendapatan",
                                      value: jumlah,
                                  });
                                  recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                              }
                          
                              if (jenis == 'Potongan') {
                                  recCreate.selectNewLine({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                      fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                      value: komponen,
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                      fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                      value: jumlah,
                                  });
                                  recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                              }
                            }
                            log.debug('sumkomponenPendapatan', sumKompPendapatan);

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
                          var sumBPJSKesPerson;
                          var sumBPJSKesPerus;
                          customrecord_sbj_msa_bpjsSearchObj.run().each(function(result){
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
                              })
                              
                              if(isBPJKesehatan == true){
                                if(bpjsKesehatanPerson == '0'){
                                    
                                
                                }
                                if(basisPenggali == '1'){

                                }
                              }
                              
                            return true;
                          });
                          
                            // var recId = recCreate.save({
                            //   enableSourcing: true,
                            //   ignoreMandatoryFields: true,
                            // });
                            // log.debug('recid', recId);                          
                          }
                          
                        }
                        return true
                      });
                      
                    }
                   
            }
          
            
        }catch(e){
            log.debug('error', e);
        }
    }
    
    return {
        execute: execute
    };
});
