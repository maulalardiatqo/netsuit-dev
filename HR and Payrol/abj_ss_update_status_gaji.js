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
            log.debug('forFilter', forFilter);
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
            log.debug("customrecord_msa_slip_gajiSearchObj result count",searchResultCount);
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
                    log.debug("idslip", idSlip);
                    var takeHomePay = data.takeHomePay;
                    var bruto = data.bruto;
                    var slipGajiId = data.slipGajiId
                    log.debug('slipgajiId', slipGajiId);

                    var periodGaji = data.periodGaji
                    log.debug('periodGaji', periodGaji);
                    var dateRange = periodGaji.split(" - ");
                    var startDate = dateRange[0];
                    var endDate = dateRange[1];

                    var formattedStartDate = formatDate(startDate);
                    var formattedEndDate = formatDate(endDate);
                    log.debug("formattedStartDate", formattedStartDate)
                    log.debug("formattedEndDate", formattedEndDate)
                    var customrecord_attendance_overtimeSearchObj = search.create({
                        type: "customrecord_attendance_overtime",
                        filters:
                        [
                            ["custrecord_ao_date","within",formattedStartDate,formattedEndDate]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC,
                                label: "Script ID"
                            }),
                            search.createColumn({name: "custrecord_ao_employee", label: "Employee"}),
                            search.createColumn({name: "custrecord_ao_date", label: "Date"}),
                            search.createColumn({name: "custrecord_ao_time", label: "Time"}),
                            search.createColumn({name: "custrecord_ao_notes", label: "Notes"}),
                            search.createColumn({name: "custrecord_ao_status", label: "Status"}),
                            search.createColumn({name: "custrecord_ao_approval_status", label: "Approval Status"})
                        ]
                    });
                    var searchResultCount = customrecord_attendance_overtimeSearchObj.runPaged().count;
                    log.debug("customrecord_attendance_overtimeSearchObj result count",searchResultCount);
                    customrecord_attendance_overtimeSearchObj.run().each(function(result){
                        var time = result.getValue({
                            name : "custrecord_ao_time"
                        });
                        log.debug('time', time);
                        return true;
                    });


                    var recSlip = record.load({
                        type : "customrecord_slip_gaji",
                        id : slipGajiId
                    });
                    var pendapatanCount = recSlip.getLineCount({
                        sublistId: 'recmachcustrecord_msa_remunasipend'
                    });
                    log.debug("pendapatancount", pendapatanCount);
                    if(pendapatanCount > 0){
                        for(var index = 0; index < pendapatanCount; index++){
                            var kompPendapatan = recSlip.getSublistValue({
                                sublistId : 'recmachcustrecord_msa_remunasipend',
                                fieldId : 'custrecord_msa_slipgaji_pendapatan',
                                line : index,
                            });
                            log.debug('komponenPendapatan', kompPendapatan);
                            if(kompPendapatan){
                                var recKompPendapatan = record.load({
                                    type : "customrecord_msa_komponen_pendapatan",
                                    id : kompPendapatan
                                });
                                var typeKomponen = recKompPendapatan.getValue("custrecord_msa_type_salary");
                                if(typeKomponen == '4'){
                                    var formulaLembur = recKompPendapatan.getValue("custrecord_list_overtime");
                                    if(formulaLembur == '3'){
                                        var jumlah = recKompPendapatan.getValue("custrecord_jumlah_rupiah");
                                        log.debug("jumlah", jumlah);
                                    }
                                }
                            }
                        }
                    }
                    if(formattedEndDate == currnetDate){
                        log.debug('todayisenddate');
                    }
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