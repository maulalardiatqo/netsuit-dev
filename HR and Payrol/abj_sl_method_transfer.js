/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/format'], function (serverWidget, search, record, format) {
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: 'Metode Transfer'
        });
        if (context.request.method === 'GET') {
            var allIdSlip = JSON.parse(context.request.parameters.allIdSlip);
            log.debug('allIdSlip', allIdSlip);
            var TransferBank = form.addField({
                id: 'custpage_bank',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bank Transfer',
            });
            TransferBank.addSelectOption({
                value: '',
                text: ''
            });
            TransferBank.addSelectOption({
                value: '1',
                text: 'Mandiri'
            });
            TransferBank.addSelectOption({
                value: '2',
                text: 'BCA'
            });
            TransferBank.isMandatory = true;

            var allDataString = JSON.stringify(allIdSlip);
            var listData = form.addField({
                id: "custpage_list_data",
                label: "List Data",
                type: serverWidget.FieldType.TEXTAREA,
            });
            listData.defaultValue = allDataString;

            listData.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN, 
            });
            
            
            form.addButton({
                id: "custpage_btn_download",
                label: "Download CSV Rekap Bank Transfer",
                functionName: "downloadCSV( "+JSON.stringify(allIdSlip)+")",
            });
            
            form.addButton({
                id: "custpage_btn_download",
                label: "Download Excel Rekap Bank Transfer",
                functionName: "downloadExcel("+JSON.stringify(allIdSlip)+")",
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_rekap_gaji.js";
            form.addSubmitButton({
                label: 'Bayar Gaji'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            try{
                var postData = JSON.parse(context.request.parameters.custpage_list_data);
                log.debug('postData', postData);
                var currentDate = new Date();
                function sysDate() {
                    var date = currentDate;
                    var tdate = date.getUTCDate();
                    var month = date.getUTCMonth() + 1; // jan = 0
                    var year = date.getUTCFullYear();
                    
                    return tdate + '/' + month + '/' + year;
                }
                currentDate = sysDate();
                currentDate = format.format({
                    value: currentDate,
                    type: format.Type.DATE
                });

                var jumlahSlip = postData.length
                var slip;
                var periodGaji;
                var metode = 'Manual'
                var status = 'sukses'
                var jumlahTransfer = 0
                postData.forEach((data)=>{
                    var idSlip = data.internlId;
                    log.debug('idSlip', idSlip)
                    var recSlip = record.load({
                        type : 'customrecord_msa_slip_gaji',
                        id: idSlip,
                        isDynamic: false
                    });
                    recSlip.setValue({
                        fieldId: 'custrecord_abj_msa_status_gaji',
                        value: 3,
                        ignoreFieldChange: true
                    });
                    recSlip.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    periodGaji = recSlip.getValue('custrecord_abj_msa_period_gaji');
                    slip = recSlip.getValue('custrecord_abj_msa_slipgaji_id');
                    var thp = recSlip.getValue('custrecord_abj_msa_thp');
                    jumlahTransfer += Number(thp)
                    
                });
                if(periodGaji){
                    var searchPeriod = search.create({
                        type: "customrecord_monthly_period_gaji",
                        columns : ['internalid', 'name', ],
                        filters: [{
                            name: 'name',
                            operator: 'is',
                            values: periodGaji
                        }]
                    });
                    var searchPeriodSet = searchPeriod.run();
                    searchPeriod = searchPeriodSet.getRange({
                        start: 0,
                        end: 1
                    });
                    if(searchPeriod.length>0){
                        var recPeriod = searchPeriod[0];
                        var idPeriod = recPeriod.getValue({
                            name : 'internalid'
                        });
                        log.debug('idPeriod', idPeriod);
                    }
                }
                log.debug('data', {currentDate : currentDate, jumlahSlip : jumlahSlip, slip : slip, periodGaji : periodGaji, jumlahTransfer : jumlahTransfer})

                var recHistory = record.create({
                    type: 'customrecord_abj_msa_history_gaji',
                    isDynamic: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_tanggal_instruksi',
                    value: currentDate, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_group_slip',
                    value: slip, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_history_period_gaji',
                    value: idPeriod, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_total_personalia',
                    value: jumlahSlip, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_total_transfer',
                    value: jumlahTransfer, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecord_abj_msa_metode',
                    value: metode, 
                    ignoreFieldChange: true
                });
                recHistory.setValue({
                    fieldId: 'custrecordabj_msa_history_status',
                    value: status, 
                    ignoreFieldChange: true
                });
                recHistory.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

            }catch(e){
                log.debug('error', e)
            }
            
            
        }
       
    }
    return {
        onRequest: onRequest
    };
});
