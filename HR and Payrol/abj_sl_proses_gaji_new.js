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
            // var period = form.addField({
            //     id: 'custpage_slip_period',
            //     type: serverWidget.FieldType.SELECT,
            //     label: 'Pilih Period',
            //     source : 'customrecord_monthly_period_gaji'
            // });
            var bulanSearch = form.addField({
                id: 'custpage_bulan_penggajian',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bulan Gaji',
            });
            
            // Add options for the months in Bahasa Indonesia
            bulanSearch.addSelectOption({
                value: 'Januari',
                text: 'Januari'
            });
            bulanSearch.addSelectOption({
                value: 'Februari',
                text: 'Februari'
            });
            bulanSearch.addSelectOption({
                value: 'Maret',
                text: 'Maret'
            });
            bulanSearch.addSelectOption({
                value: 'April',
                text: 'April'
            });
            bulanSearch.addSelectOption({
                value: 'Mei',
                text: 'Mei'
            });
            bulanSearch.addSelectOption({
                value: 'Juni',
                text: 'Juni'
            });
            bulanSearch.addSelectOption({
                value: 'Juli',
                text: 'Juli'
            });
            bulanSearch.addSelectOption({
                value: 'Agustus',
                text: 'Agustus'
            });
            bulanSearch.addSelectOption({
                value: 'September',
                text: 'September'
            });
            bulanSearch.addSelectOption({
                value: 'Oktober',
                text: 'Oktober'
            });
            bulanSearch.addSelectOption({
                value: 'November',
                text: 'November'
            });
            bulanSearch.addSelectOption({
                value: 'Desember',
                text: 'Desember'
            });

            var tahunSearch = form.addField({
                id: 'custpage_tahun_penggajian',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Tahun Gaji',
            });
            
            var currentYear = new Date().getFullYear();
            
            tahunSearch.addSelectOption({
                value: currentYear.toString(),
                text: currentYear.toString()
            });
            
            tahunSearch.addSelectOption({
                value: (currentYear + 1).toString(),
                text: (currentYear + 1).toString()
            });
            
            tahunSearch.addSelectOption({
                value: (currentYear + 2).toString(),
                text: (currentYear + 2).toString()
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_rekap_gaji.js";
            form.addSubmitButton({
                label: 'Search'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            try{
                var slipGaji = context.request.parameters.custpage_slip_gaji_select
                var bulan = context.request.parameters.custpage_bulan_penggajian
                var tahun = context.request.parameters.custpage_tahun_penggajian
                log.debug('bulandantahun', {bulan : bulan, tahun : tahun})
                var periodTo = bulan + " " + tahun + " " + "-"
                log.debug('periodTo', periodTo);
                    var currentRecord = createSublist("custpage_sublist_listemployee", form);

                    var customrecord_msa_slip_gajiSearchObj = search.create({
                        type: "customrecord_msa_slip_gaji",
                        filters:
                        [ 
                            ["custrecord_abj_msa_slipgaji_id","anyof",slipGaji], 
                            "AND", 
                            ["custrecord_abj_msa_period_gaji","contains",periodTo]
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
