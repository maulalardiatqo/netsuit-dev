/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record'], function (serverWidget, search, record) {
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: 'Proses Penggajian'
        });
        if (context.request.method === 'GET') {
            
            var slip_gaji = form.addField({
                id: 'custpage_slip_gaji_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Slip Gaji',
                source : 'customrecord_slip_gaji'
            });
            var period = form.addField({
                id: 'custpage_slip_period',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Period',
                source : 'customrecord_monthly_period_gaji'
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_rekap_gaji.js";
            form.addSubmitButton({
                label: 'Search'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            try{
                var slipGaji = context.request.parameters.custpage_slip_gaji_select
                var period = context.request.parameters.custpage_slip_period

                var periodName;
                var searchPeriod = search.create({
                    type : 'customrecord_monthly_period_gaji',
                    filters : [{
                        name : 'internalid',
                        operator : 'is',
                        values : period
                    }],
                    columns : ['name']
                });
                var searchPeriodSet = searchPeriod.runPaged().count;
                if(searchPeriodSet > 0){
                    searchPeriod.run().each(function(result){
                        periodName = result.getValue({
                            name : 'name'
                        })     
                        return true;
                    }); 
                }
                log.debug('name', periodName);
                log.debug('slipGaji', slipGaji);
                
                if(periodName){
                    var currentRecord = createSublist("custpage_sublist_listemployee", form);

                    var customrecord_msa_slip_gajiSearchObj = search.create({
                        type: "customrecord_msa_slip_gaji",
                        filters:
                        [
                            ["custrecord_abj_msa_status_gaji","anyof","2"], 
                            "AND", 
                            ["custrecord_abj_msa_slipgaji_id","anyof",slipGaji], 
                            "AND", 
                            ["custrecord_abj_msa_period_gaji","is",periodName]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "id",
                                sort: search.Sort.ASC,
                                label: "ID"
                            }),
                            search.createColumn({name: "custrecord_abj_msa_employee_slip", label: "Employee"}),
                            search.createColumn({name: "custrecord_abj_msa_status_gaji", label: "Status"}),
                            search.createColumn({name: "custrecord_abj_msa_period_gaji", label: "Period Gaji"}),
                            search.createColumn({name: "custrecord_abj_msa_pph21perusahaan", label: "PPh21 Ditanggung Perusahaan"}),
                            search.createColumn({name: "custrecord_abj_msa_pph21karyawan", label: "PPH21 Ditanggung Karyawan"}),
                            search.createColumn({name: "custrecord_abj_msa_thp", label: "Take Home Pay"})
                        ]
                        });
                        var searchResultCount = customrecord_msa_slip_gajiSearchObj.runPaged().count;
                        log.debug("customrecord_msa_slip_gajiSearchObj result count",searchResultCount);
                        
                        var url = "https://9342705.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=287&id="
                        var i = 0;
                        var allIdSlip = [];
                        customrecord_msa_slip_gajiSearchObj.run().each(function(result){
                            var internalidSlip = result.getValue({
                                name: "id"
                            });
                            var employee = result.getText({
                                name : "custrecord_abj_msa_employee_slip"
                            });
                            var status = result.getText({
                                name : "custrecord_abj_msa_status_gaji"
                            });
                            var thp = result.getValue({
                                name: "custrecord_abj_msa_thp"
                            });
                            var urlSet = url + internalidSlip
                            log.debug('urlSet', urlSet)
                            currentRecord.setSublistValue({
                                sublistId: "custpage_sublist_listemployee",
                                id: "custpage_sublist_list_employee",
                                value: employee,
                                line: i,
                            });
                            currentRecord.setSublistValue({
                                sublistId: "custpage_sublist_listemployee",
                                id: "custpage_sublist_list_status",
                                value: status,
                                line: i,
                            });
                            currentRecord.setSublistValue({
                                sublistId: "custpage_sublist_listemployee",
                                id: "custpage_sublist_list_thp",
                                value: thp,
                                line: i,
                            });
                            currentRecord.setSublistValue({
                                sublistId: "custpage_sublist_listemployee",
                                id: "custpage_sublist_list_link",
                                value: "<a href='" + urlSet + "' target='_blank'>Lihat Slip</a>",
                                line: i,
                            });
                            allIdSlip.push({
                                internlId : internalidSlip
                            })
                            i++;
                            return true
                        });
                        if(searchResultCount > 0){
                            form.addButton({
                                id: 'custpage_btn_proses_gaji',
                                label: "Proses Gaji",
                                functionName: "prosesGaji(" + JSON.stringify(allIdSlip) + ")"
                            });
                            form.clientScriptModulePath = "SuiteScripts/abj_cs_proses_gaji.js"
                        }
                        context.response.writePage(form);
                    
                    
                }
            }catch(e){
                log.debug('error', e)
            }
            
            
        }
       
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "List Employee",
        });
        sublist_in.addField({
            id: "custpage_sublist_list_employee",
            label: "Employee",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_list_status",
            label: "Status",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_list_thp",
            label: "Take Home Pay",
            type: serverWidget.FieldType.CURRENCY,
        });
        sublist_in.addField({
            id: "custpage_sublist_list_link",
            label: "Action",
            type: serverWidget.FieldType.TEXT,
        });

        return sublist_in;
    }
    return {
        onRequest: onRequest
    };
});
