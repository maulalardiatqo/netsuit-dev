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
                var pendapatanText = row.getText({
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
                  pendapatanText : pendapatanText,
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
                var potonganText = result.getText({
                  name: "custrecord_msa_id_potongan",
                  join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                })
                var jumlahPotongan = result.getValue({
                    name: "custrecord_msa_jumlah_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });

                dataPotongan.push({
                  idRemunerasi : idRemunerasi,
                  employee : employee,
                  slip_gaji_potongan : slip_gaji_potongan,
                  potongan : potongan,
                  potonganText : potonganText,
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
                        pendapatanText : [],
                        potongan: [],
                        potonganText : []
                    };
                }

                combinedData[employee].pendapatan.push({
                    slip_gaji: pendapatan.slip_gaji_pendapatan,
                    pendapatan: pendapatan.pendapatan,
                    pendapatanText : pendapatan.pendapatanText,
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
                        pendapatanText : [],
                        potongan: [],
                        potonganText : [],
                    };
                }

                combinedData[employee].potongan.push({
                    slip_gaji: potongan.slip_gaji_potongan,
                    potongan: potongan.potongan,
                    potonganText : potongan.potonganText,
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
                    var pendapatanText = pendapatan.pendapatanText;
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
                        komponenText : pendapatanText,
                        jumlah: jumlahPendapatan
                    };

                    groupedData[groupKey].lineItems.push(lineItem);
                });

                employeeData.potongan.forEach(function (potongan) {
                    var idRemunerasi = employeeData.idRemunerasi;
                    var employee = employeeData.employee;
                    var slipGaji = potongan.slip_gaji;
                    var potonganValue = potongan.potongan;
                    var potonganText = potongan.potonganText;
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
                        komponenText : potonganText,
                        jumlah: jumlahPotongan
                    };

                    groupedData[groupKey].lineItems.push(lineItem);
                });
                
            }

            
            for (var groupKey in groupedData) {
                var group = groupedData[groupKey];
                var employee = group.employee;
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
                              });
                                var periodSearch = search.create({
                                  type : 'customrecord_monthly_period_gaji',
                                  columns : ['internalid', 'name'],
                                  filters: [{
                                      name: 'name',
                                      operator: 'is',
                                      values: period
                                  }]
                              });
              
                              var searchPeriodSet = periodSearch.run();
                              periodSearch = searchPeriodSet.getRange({
                                  start : 0,
                                  end : 1
                              });
                              if(periodSearch == 0){
                                  var recordMonthlyPeriod = record.create({
                                      type : 'customrecord_monthly_period_gaji'
                                  });
                                  recordMonthlyPeriod.setValue({
                                      fieldId : 'name',
                                      value : period,
                                      ignoreFieldChange: true
                                  });
                                  var saveMonthly = recordMonthlyPeriod.save();
                                  log.debug('saveMonthly', saveMonthly);
                              }
                            }
                            var sumJumlahKomponenPendapatan = 0;
                            var sumJumlahKomponenPotongan = 0;
                            var sumKompPendapatan = 0;
                            var gajiPokok = 0;
                            var tunjangan = 0;
                            for (var i = 0; i < lineItems.length; i++) {
                              var lineItem = lineItems[i];
                              var jenis = lineItem.jenis;
                              var komponen = lineItem.komponen;
                              var komponenText = lineItem.komponenText;
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
                                  
                                  if (isPPh21 == true) {
                                      sumKompPendapatan += Number(jumlah);
                                  }
                                  if(typeSalary == '1'){
                                    gajiPokok = jumlah
                                  }
                                  if(typeSalary == '7'){
                                    tunjangan = jumlah
                                  }
                                  recCreate.selectNewLine({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                      fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                      value: komponenText,
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                      fieldId: "custrecord_abj_msa_slip_pendapatan",
                                      value: jumlah,
                                  });
                                  recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                                  sumJumlahKomponenPendapatan += Number(jumlah)
                              }
                          
                              if (jenis == 'Potongan') {
                                  log.debug('potongan', jumlah);
                                  recCreate.selectNewLine({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                      fieldId: "custrecord_abj_msa_slip_slip_potongan",
                                      value: komponenText,
                                  });
                                  recCreate.setCurrentSublistValue({
                                      sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                                      fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                                      value: jumlah,
                                  });
                                  recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                                  sumJumlahKomponenPotongan += Number(jumlah)
                              }
                            }

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
                                }else{
                                  var komponenBPJSKes = 'Tunjangan Premi BPJS Kesehatan(4% Perusahaan)'
                                  var komponenPotBPJSKes = 'Premi BPJS Kesehatan (1% Karyawan)'
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
                                  komponenPotBPJSText.push(komponenPotBPJSKes);
                                  jumlahPotBPJS.push(jumlahPotBpjsKes);
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
                                
                              }

                              
                            return true;
                          });
                            
                            var combineBPJSpend = []
                            for (var i = 0; i < komponenPendBPJSText.length; i++) {
                              var dataObject = {
                                komponenPendBPJS: komponenPendBPJSText[i],
                                jumlahPendBPJS: jumlahPendBPJS[i],
                              }
                              combineBPJSpend.push(dataObject);
                            }

                            if(combineBPJSpend){
                              var sumjumlahPendBPJS = 0;
                              for (var i = 0; i < combineBPJSpend.length; i++) {
                                var dataLine = combineBPJSpend[i];
                                var komponenPendBPJS = dataLine.komponenPendBPJS;
                                var jumlahPendBPJS = dataLine.jumlahPendBPJS;
                            
                                recCreate.selectNewLine({
                                  sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
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
                            log.debug('dataPotongan', {komponenPotBPJSText : komponenPotBPJSText, jumlahPotBPJS : jumlahPotBPJS});
                            var combineBPJSpot = [];

                            for (var i = 0; i < komponenPotBPJSText.length; i++) {
                                var dataObject = {
                                    komponenPotBPJS: komponenPotBPJSText[i],
                                    jumlahPotBPJS: jumlahPotBPJS[i],
                                };
                                combineBPJSpot.push(dataObject);
                            }

                            log.debug('combineBPJSpot', combineBPJSpot);

                            if(combineBPJSpot){
                              var sumJumlahPotBPJS = 0
                              for (var j = 0; j < combineBPJSpot.length; j++) {
                                var dataLineSpot = combineBPJSpot[j];
                                
                                var komponenPotBPJS = dataLineSpot.komponenPotBPJS;
                                var jumlahPotBPJS = dataLineSpot.jumlahPotBPJS;
                            
                                log.debug('Processing combineBPJSpot line ' + j, {
                                    komponenPotBPJS: komponenPotBPJS,
                                    jumlahPotBPJS: jumlahPotBPJS
                                });
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

                            var totalIncome = sumjumlahBPJS + sumKompPendapatan
                            log.debug('totalIncome', totalIncome);
                            var tipePTKP;
                            var statusKaryawan;
                            // searchNonRemunerasi
                            var customrecord_remunasiSearchObj = search.create({
                              type: "customrecord_remunasi",
                              filters:
                              [
                                ["custrecord3","anyof",employee]
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
                            var ptkp;
                            var ptkpIstri;
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
                            log.debug("customrecord58SearchObj result count",searchResultCount);
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
                              ptkp = result.getValue({
                                name: "custrecord_abj_msa_ptkp_wajib"
                              });
                              ptkpIstri = result.getValue({
                                name: "custrecord_abj_msa_ptkp_istri"
                              });
                                return true;
                            });
                            
                            log.debug('metodePajak', metodePajak);
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

                            var pkp = penghasilanNetto - Number(tipePTKP)
                            log.debug('jumlahPTKP', tipePTKP);

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
                                log.debug('pajakPerbulan', pajakperBulan)
                            }

                            
                            if(metodePajak == '1'){
                              sumJumlahKomponenPendapatan += pajakperBulan
                              sumJumlahKomponenPotongan += pajakperBulan
                              recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_pph21perusahaan',
                                value : pajakperBulan
                              });
                              recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_pph21karyawan',
                                value : pajakperBulan
                              });


                              recCreate.selectNewLine({
                                sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                              });
                              recCreate.setCurrentSublistValue({
                                  sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                  value: 'Tunjangan PPh21',
                              });
                              recCreate.setCurrentSublistValue({
                                  sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  fieldId: "custrecord_abj_msa_slip_pendapatan",
                                  value: jumlahPendBPJS,
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
                                  value: pajakperBulan,
                              });
                              recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
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
                              sumJumlahKomponenPendapatan += pajakperBulan
                              sumJumlahKomponenPotongan += pajakperBulan
                              recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_pph21perusahaan',
                                value : pajakperBulan
                              });
                              recCreate.setValue({
                                fieldId : 'custrecord_abj_msa_pph21karyawan',
                                value : pajakperBulan
                              });

                              recCreate.selectNewLine({
                                sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                              });
                              recCreate.setCurrentSublistValue({
                                  sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                                  value: 'Tunjangan PPh21',
                              });
                              recCreate.setCurrentSublistValue({
                                  sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                                  fieldId: "custrecord_abj_msa_slip_pendapatan",
                                  value: jumlahPendBPJS,
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
                                  value: pajakperBulan,
                              });
                              recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                            }
                            log.debug('pendapatan', {sumJumlahKomponenPendapatan : sumJumlahKomponenPendapatan, sumjumlahPendBPJS : sumjumlahPendBPJS});
                            log.debug('potongan', {sumJumlahKomponenPotongan : sumJumlahKomponenPotongan, sumJumlahPotBPJS : sumJumlahPotBPJS});
                            var pendapatanToCount = Number(sumJumlahKomponenPendapatan) + Number(sumjumlahPendBPJS);
                            var potonganToCount = Number(sumJumlahKomponenPotongan) + Number(sumJumlahPotBPJS)
                            var takeHomePay = pendapatanToCount - potonganToCount
                            log.debug('takeHomePay', takeHomePay);
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
