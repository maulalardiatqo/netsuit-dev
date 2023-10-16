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
            var allData = [];
            var searchRemunasi = search.create({
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
                    name: "custrecord_remu_slipgaji",
                    join: "CUSTRECORD_REMUNERASI",
                    label: "Slip Gaji"
                  }),
                  search.createColumn({
                    name: "custrecord_msa_slip_gaji_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    label: "Slip Gaji"
                  })
              ]
           });
            var searchRemunasiSet = getAllResults(searchRemunasi);
            searchRemunasiSet.forEach(function (row) {
              var idRemunerasi = row.getValue({
                  name : 'internalid'
              });
                var employee = row.getValue({
                  name : 'custrecord_remunerasi_employee'
                });
                var slip_gaji_pendapatan = row.getValue({
                  name: "custrecord_remu_slipgaji",
                  join: "CUSTRECORD_REMUNERASI",
                });
                var slip_gaji_potongan = row.getValue({
                    name: "custrecord_msa_slip_gaji_potongan",
                    join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });
                var pendapatan = row.getValue({
                  name: "custrecord_id_pendapatan",
                  join: "CUSTRECORD_REMUNERASI",
                });
                var jumlahPendapatan = row.getValue({
                  name: "custrecord_jumlah_pendapatan",
                  join: "CUSTRECORD_REMUNERASI",
                });
                var potongan = row.getValue({
                  name: "custrecord_msa_id_potongan",
                  join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                });
                var jumlahPotongan = row.getValue({
                  name: "custrecord_msa_jumlah_potongan",
                  join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                })
                allData.push({
                  idRemunerasi : idRemunerasi,
                  employee : employee,
                  slip_gaji_pendapatan : slip_gaji_pendapatan,
                  slip_gaji_potongan : slip_gaji_potongan,
                  pendapatan : pendapatan,
                  jumlahPendapatan : jumlahPendapatan,
                  potongan : potongan,
                  jumlahPotongan : jumlahPotongan

                });
            });
            var groupedData = {};
            var groupedPotongan = {};
            
            allData.forEach(function (row) {
              var idRemunerasi = row.idRemunerasi;
              var slipGajiKey = row.slip_gaji_pendapatan;
              var slipPotongan = row.slip_gaji_potongan;
            
              if (!groupedData[idRemunerasi]) {
                groupedData[idRemunerasi] = {};
              }
            
              if (!groupedData[idRemunerasi][slipGajiKey]) {
                groupedData[idRemunerasi][slipGajiKey] = {
                  idRemunerasi: idRemunerasi,
                  employee: row.employee,
                  slip_gaji_pendapatan: row.slip_gaji_pendapatan,
                  details: []
                };
              }
            
              groupedData[idRemunerasi][slipGajiKey].details.push({
                pendapatan: row.pendapatan,
                jumlahPendapatan: row.jumlahPendapatan,
              });
            
              if (slipPotongan) {
                if (!groupedPotongan[idRemunerasi]) {
                  groupedPotongan[idRemunerasi] = {};
                }
            
                if (!groupedPotongan[idRemunerasi][slipPotongan]) {
                  groupedPotongan[idRemunerasi][slipPotongan] = {
                    idRemunerasi: idRemunerasi,
                    slip_gaji_potongan: row.slip_gaji_potongan,
                    details: []
                  };
                }
            
                groupedPotongan[idRemunerasi][slipPotongan].details.push({
                  potongan: row.potongan,
                  jumlahPotongan: row.jumlahPotongan
                });
              }
            });
            
            log.debug('groupedPotongan', groupedPotongan);
            
            var result = Object.values(groupedData).map(function (idRemunerasiGroup) {
              return Object.values(idRemunerasiGroup);
            });
            
            var resultPotongan = Object.values(groupedPotongan).map(function (idRemunerasiGroup) {
              return Object.values(idRemunerasiGroup);
            });

            log.debug('result', result);
            log.debug('resultPotongan', resultPotongan);
            result.forEach(function (idRemunerasiGroup) {
              idRemunerasiGroup.forEach(function (slipGajiGroup) {
                var employee = slipGajiGroup.employee;
                var slipGaji = slipGajiGroup.slip_gaji_pendapatan
                log.debug('dataFor1', {employee : employee, slipGaji : slipGaji})
                var searchSlip = search.create({
                  type : 'customrecord_slip_gaji',
                  columns : ['internalid','custrecord_lama_period', 'custrecord_tanggal_awal_period'],
                  filters : [{
                    name : 'internalid',
                    operator: 'is',
                    values: slipGaji
                  }]
                })
                var searchSlipset = searchSlip.runPaged().count;
                log.debug('searchSlip', searchSlipset);
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
                        recCreate.setValue({
                          fieldId : 'custrecord_abj_msa_period_gaji',
                          value : period
                        })
                      }

                      slipGajiGroup.details.forEach(function (detail) {
                        var pendapatan = detail.pendapatan
                        var jumlahPendapatan = detail.jumlahPendapatan
                        var potongan = detail.potongan
                        var jumlahPotongan = detail.jumlahPotongan
                        log.debug('potongan', potongan);
                        if(pendapatan){
                          recCreate.selectNewLine({
                            sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                          });
                          recCreate.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId: "custrecord_abj_msa_slip_rem_pendapatan",
                            value: pendapatan,
                          });
                          recCreate.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_slip_gaji",
                            fieldId: "custrecord_abj_msa_slip_pendapatan",
                            value: jumlahPendapatan,
                          });
                          // recCreate.commitLine("recmachcustrecord_abj_msa_slip_slip_gaji");
                          
                        }
                        if(potongan){
                          recCreate.selectNewLine({
                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                          });
                          recCreate.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                            fieldId: "custrecord_abj_msa_slip_slip_potongan",
                            value: potongan,
                          });
                          recCreate.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_abj_msa_slip_potongan",
                            fieldId: "custrecord_abj_msa_slip_slip_jumlah",
                            value: jumlahPotongan,
                          });
                          // recCreate.commitLine("recmachcustrecord_abj_msa_slip_potongan");
                        }
                      })
                      
                    }
                  });
                  
                }
                  // var recId = recCreate.save({
                      //   enableSourcing: true,
                      //   ignoreMandatoryFields: true,
                      // });
                      // log.debug('recId', recId);
                
              })
            })
            
        }catch(e){
            log.debug('error', e);
        }
    }
    
    return {
        execute: execute
    };
});
