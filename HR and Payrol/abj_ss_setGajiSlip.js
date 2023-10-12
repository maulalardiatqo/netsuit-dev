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
            var allData = [];
            var searchRemunasi = search.create({
              type: "customrecord_msa_remunerasi",
              filters:
              [
                  ["custrecord_remunerasi.custrecord_remu_slipgaji","anyof","10"], 
                  "AND", 
                  ["custrecord_msa_potongan_remunerasi.custrecord_msa_slip_gaji_potongan","anyof","10"]
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
            log.debug('allData', allData);
            
        }catch(e){
            log.debug('error', e);
        }
    }
    
    return {
        execute: execute
    };
});
