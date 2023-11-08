/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file"
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file
){
    function openEmployeeDetails(employeeId, year, empName, hireDate) {
        log.debug('employeeId', employeeId);
        // var url = urlSet + '?employeeId=' + encodeURIComponent(employeeId) + '&year=' + encodeURIComponent(year) + '&empName=' + encodeURIComponent(empName) + '&hiredate=' + encodeURIComponent(hireDate);
        // window.open(url, '_blank');
    }
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "PPh 21/26 Awal",
        });
        try{
            if (context.request.method === 'GET') {
                var sublist = form.addSublist({
                    id: "custpage_sublist_list_employee",
                    type: serverWidget.SublistType.LIST,
                    label: "List Employee",
                });
                sublist.addField({
                    id: "custpage_sublist_tahun",
                    label: "Tahun",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_id_employee",
                    label: "ID Employee",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_emp_name",
                    label: "Nama Karyawan",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_start",
                    label: "Tgl Mulai Kerja",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_action",
                    label: "Aksi",
                    type: serverWidget.FieldType.TEXT,
                });
                var idsEmployee = [];
                var url = 'https://9342705.app.netsuite.com/app/site/hosting/scriptlet.nl?script=668&deploy=1'
                var searchRem = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                    ],
                    columns:
                    ["custrecord3"]
                });
                var searchRemset = searchRem.runPaged().count;
                if(searchRemset > 0){
                    searchRem.run().each(function(result){
                        var empId = result.getValue({
                            name : "custrecord3"
                        });
                        if(empId){
                            idsEmployee.push(empId);
                        }
                        return true
                    })
                }
                log.debug('idsEmp', idsEmployee);
                var searchEmploye = search.create({
                    type: "employee",
                    filters: [
                        ["internalid", "anyof", idsEmployee]
                    ],
                    columns:
                    ["internalid","hiredate", "entityid", "firstname", "lastname"]
                });
                var searchempset = searchEmploye.runPaged().count;
                if(searchempset > 0){
                    var i = 0
                    searchEmploye.run().each(function(result){
                        var internalId = result.getValue({
                            name : "internalid"
                        })
                        var fname = result.getValue({
                            name : "firstname"
                        });
                        var lName =  result.getValue({
                            name : "lastname"
                        }) || '';
                        var empName = fname + lName
                        var hireDate = result.getValue({
                            name : "hiredate"
                        });
                        var employeeID = result.getValue({
                            name : "entityid"
                        })
                        var thisDate = new Date();
                        var year = thisDate.getUTCFullYear();
                        var urlSet = url + '&employId=' + employeeID + '&tahun=' + year + '&empName=' + empName +  '&hireDate=' + hireDate + '&internalId=' + internalId ;
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_tahun",
                            value: year,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_id_employee",
                            value: employeeID,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_emp_name",
                            value: empName,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_start",
                            value: hireDate,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_action",
                            value: "<a href='" + urlSet + "' target='_blank'>Lengapi/Edit Data</a>",
                            line: i,
                        });
    
                        i ++
                        return true
                    })
                }
                form.addSubmitButton({
                    label: 'Download PPh 21/26 Awal'
                });
                form.addButton({
                    id: "custpage_btn_download",
                    label: "Upload PPh 21/26 Awal",
                    functionName: "upload()",
                });
                form.clientScriptModulePath = 'SuiteScripts/abj_cs_pph21awal.js';
                context.response.writePage(form);
            }else{
                    var csvStr = "No,Tahun,ID Personalia,Nama, internalid Personalia, Tanggal Mulai Kerja,Dari Bulan,Sampai Bulan,Gaji/Pensiun/THT,Tunlangan PPh,Tunjangan Lainnya,Uang Lembur dan sebagainya,Honorarium dan Imbalan Lain Sejenisnya,Premi Asuransi yang Dibayar Pemberi Kerja,Penerimaan dalam Bentuk Natura dan Kenikmatan Lainnya yang Dikenakan Pemotongan PPh Pasal 21,Tantiem Bonus Gratifikasi Jasa Produksi dan THR,Iuran Pensiun atau Iuran THT/JHT,PPh21/26 Terbayar,Penghasilan Neto Masa Sebelumnya,PPh21 Yang Telah Dipotong Masa Sebelumnya\n";

                    // End Kolom Excel Header
                var idsEmployee = [];
                var searchRem = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                    ],
                    columns:
                    ["custrecord3"]
                });
                var searchRemset = searchRem.runPaged().count;
                if(searchRemset > 0){
                    searchRem.run().each(function(result){
                        var empId = result.getValue({
                            name : "custrecord3"
                        });
                        if(empId){
                            idsEmployee.push(empId);
                        }
                        return true
                    })
                }
                log.debug('idsEmp', idsEmployee);
                var searchEmploye = search.create({
                    type: "employee",
                    filters: [
                        ["internalid", "anyof", idsEmployee]
                    ],
                    columns:
                    ["internalid","hiredate", "entityid", "firstname", "lastname"]
                });
                var searchempset = searchEmploye.runPaged().count;
                if(searchempset > 0){
                    var i = 1
                    searchEmploye.run().each(function(result){
                        var internalId = result.getValue({
                            name : "internalid"
                        })
                        var fname = result.getValue({
                            name : "firstname"
                        });
                        var lName =  result.getValue({
                            name : "lastname"
                        }) || '';
                        var empName = fname + lName
                        var hireDate = result.getValue({
                            name : "hiredate"
                        });
                        var employeeID = result.getValue({
                            name : "entityid"
                        })
                        var thisDate = new Date();
                        var year = thisDate.getUTCFullYear();

                        var searchPphAwal = search.create({
                            type: "customrecord_abj_msa_pph21awal",
                            filters:
                            [
                                ["custrecord_abj_msa_id_personalia","anyof",internalId]
                            ],
                            columns:
                            [
                                search.createColumn({name: "internalid", label: "id"}),
                                search.createColumn({name: "custrecord_abj_msa_tahun", label: "Tahun"}),
                                search.createColumn({name: "custrecord_abj_msa_id_personalia", label: "ID Personalia"}),
                                search.createColumn({name: "custrecord_abj_msa_nama_personalia", label: "Nama Personalia"}),
                                search.createColumn({name: "custrecord_abj_msa_tgl_mulai_kerja", label: "Tanggal Mulai Kerja"}),
                                search.createColumn({name: "custrecord_abj_msa_from_month", label: "Dari Bulan"}),
                                search.createColumn({name: "custrecord_abj_msa_ke_bulan", label: "Ke Bulan"}),
                                search.createColumn({name: "custrecord_abj_msa_gaji_pen", label: "Gaji/Pensiun atau THT/JHT"}),
                                search.createColumn({name: "custrecord_abj_msa_tunjangan_pph", label: "Tunjangan PPh"}),
                                search.createColumn({name: "custrecord_abj_msa_tunjanganlainya", label: "Tunjangan Lainnya, Uang Lembur dan Sebagainya"}),
                                search.createColumn({name: "custrecordabj_msa_honorarium", label: "Honorarium dan Imbalan Lain Sejenisnya"}),
                                search.createColumn({name: "custrecordabj_msa_premi_asuransi", label: "Premi Asuransi yang Dibayar Pemberi Kerja"}),
                                search.createColumn({name: "custrecord_abj_msa_natura", label: "Penerimaan dalam Bentuk Natura dan Kenikmatan Lainnya yang Dikenakan Pemotongan PPh Pasal 21"}),
                                search.createColumn({name: "custrecord_abj_msa_tantiem", label: "Tantiem, Bonus, Gratifikasi, Jasa Produksi, dan THR"}),
                                search.createColumn({name: "custrecord_abj_msa_iuran_pensiun", label: "Iuran Pensiun atau Iuran THT/JHT"}),
                                search.createColumn({name: "custrecord_abj_msa_pph_terbayar", label: "PPh 21 Terbayar"}),
                                search.createColumn({name: "custrecord_abj_msa_neto_bef", label: "Penghasilan Neto Masa Sebelumnya"}),
                                search.createColumn({name: "custrecord_abj_msa_pph21_bef", label: "PPh21 Yang Telah Dipotong Masa Sebelumnya"})
                            ]
                        }); var searchPphSet = searchPphAwal.run();
                        var searchPphResult = searchPphSet.getRange({
                            start: 0,
                            end: 1,
                        });
                        var dariRec = '';
                        var keRec = '';
                        var gajiRec = '';
                        var tunjanagnRec = '';
                        var lainyaRec = '';
                        var honorRec = '';
                        var premiRec = '';
                        var naturaRec = '';
                        var tantiemRec = '';
                        var iuranRec = '';
                        var pphterbayarRec = '';
                        var netobefRec = '';
                        var pphbefRec = '';
                        var idpph = '';
                        if(searchPphResult.length > 0){
                            var recPphAwal = searchPphResult[0];
                            idpph = recPphAwal.getValue({
                                name : 'internalid'
                            });
                            dariRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_from_month'
                            });
                            keRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_ke_bulan'
                            });
                            gajiRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_gaji_pen'
                            });
                            tunjanagnRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_tunjangan_pph'
                            }); 
                            lainyaRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_tunjanganlainya'
                            }); 
                            honorRec = recPphAwal.getValue({
                                name : 'custrecordabj_msa_honorarium'
                            }); 
                            premiRec = recPphAwal.getValue({
                                name : 'custrecordabj_msa_premi_asuransi'
                            }); 
                            naturaRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_natura'
                            }); 
                            tantiemRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_tantiem'
                            });
                            iuranRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_iuran_pensiun'
                            }); 
                            pphterbayarRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_pph_terbayar'
                            });
                            netobefRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_neto_bef'
                            });
                            pphbefRec = recPphAwal.getValue({
                                name : 'custrecord_abj_msa_pph21_bef'
                            }); 
        
                        }
                        log.debug('hireDate', hireDate);
                        csvStr +=
                        i + ',' +
                        year + ',' +
                        employeeID + ',' +
                        empName + ',' +
                        internalId + ',' +
                        hireDate + ',' +
                        dariRec + ',' +
                        keRec + ',' +
                        gajiRec + ',' +
                        tunjanagnRec + ',' +
                        lainyaRec + ',' +
                        honorRec + ',' +
                        premiRec + ',' +
                        naturaRec + ',' +
                        tantiemRec + ',' +
                        iuranRec + ',' +
                        pphterbayarRec + ',' +
                        netobefRec + ',' +
                        pphbefRec + '\n';

                        i ++
                        return true
                    })
        
                var objXlsFile = file.create({
                    name: "Template_Upload_PPh21_26_Awal.csv", 
                    fileType: file.Type.CSV,
                    contents: csvStr,
                });
                
        
                context.response.writeFile({
                    file: objXlsFile,
                });
                }
            }
        }catch(e){
            log.debug('error', e);
        }
        
        
    }
    return {
        onRequest: onRequest
    };
});