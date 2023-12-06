/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        try{
            if(context.request.method === 'GET'){
                var allId = context.request.parameters.allid;
                log.debug('allId', allId);
                var allIdArray = allId.split(",");
                log.debug('allIdArray', allIdArray);
                var contextRequest = context.request;
                var form = serverWidget.createForm({
                    title: "Data Unggah Tambah TK BPJS Ketenagakerjaan",
                });
                var sublist_in = form.addSublist({
                    id: "custpage_sublist_data",
                    type: serverWidget.SublistType.LIST,
                    label: "(Silahkan checklist personalia yang belum didaftarkan ke SIPP)",
                    tab: "matchedtab",
                });
                sublist_in.addField({
                    id: "custpage_sublist_checklist",
                    label: "Select",
                    type: serverWidget.FieldType.CHECKBOX,
                });
                sublist_in.addField({
                    id: "custpage_sublist_internalid",
                    label: "internalid",
                    type: serverWidget.FieldType.TEXT,
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });;
                sublist_in.addField({
                    id: "custpage_sublist_emp",
                    label: "Personalia",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_noid",
                    label: "ID Personalia",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_alamat",
                    label: "Alamat",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist_in.addField({
                    id: "custpage_sublist_nobpjs",
                    label: "No. KPJ BPJS Ketenagakerjaan",
                    type: serverWidget.FieldType.TEXT,
                });
                var customrecord_remunasiSearchObj = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                        ["internalid","anyof",allIdArray]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({name: "internalid",}),
                        search.createColumn({name: "custrecord3", label: "Emplyee"}),
                        search.createColumn({name: "custrecord_abj_msa_status_karyawan", label: "Status Karyawan"}),
                        search.createColumn({name: "custrecord_abj_msa_noid", label: "NIK / No.id Personalia"}),
                        search.createColumn({name: "custrecord_abj_msa_alamat", label: "Alamat"}),
                        search.createColumn({name: "custrecord_no_bpjs_ket", label: "No. KPJ BPJS Ketenaga Kerjaan"})
                    ]
                });
                var searchResultCount = customrecord_remunasiSearchObj.runPaged().count;
                log.debug("customrecord_remunasiSearchObj result count",searchResultCount);
                var i = 0;
                customrecord_remunasiSearchObj.run().each(function(result){
                    var internalid = result.getValue({
                        name : "custrecord3"
                    });
                    var empName = result.getText({
                        name : "custrecord3"
                    });
                    log.debug('empName', empName);
                    var noId = result.getValue({
                        name : "custrecord_abj_msa_noid"
                    });
                    var alamat = result.getValue({
                        name : "custrecord_abj_msa_alamat"
                    })
                    var noBPjS = result.getValue({
                        name : "custrecord_no_bpjs_ket"
                    })
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_internalid",
                        value: internalid,
                        line: i,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_checklist",
                        value: 'F',
                        line: i,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_emp",
                        value: empName,
                        line: i,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_noid",
                        value: noId,
                        line: i,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_alamat",
                        value: alamat,
                        line: i,
                    });
                    sublist_in.setSublistValue({
                        sublistId: "custpage_sublist_data",
                        id: "custpage_sublist_nobpjs",
                        value: noBPjS,
                        line: i,
                    });
                    i++
                    return true
                });
                form.addButton({
                    id: 'custpage_button_tambahtk',
                    label: "Login SIPP",
                    functionName: "loginSIPP()"
                })
                form.addButton({
                    id: 'custpage_button_download',
                    label: "Download File",
                    functionName: "downloadTtku()"
                })
                form.clientScriptModulePath = "SuiteScripts/abj_cs_bpjs_tku.js";
                // form.addSubmitButton({
                //     label: "Download",
                // });
                context.response.writePage(form);
            }else{
                var sublistData = context.request.parameters.custpage_sublist_data;
                
            }
            
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        onRequest: onRequest
    };
});