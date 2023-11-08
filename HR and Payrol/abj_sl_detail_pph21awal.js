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
    "N/encode","N/url","N/redirect","N/xml","N/file", "N/format", "N/ui/message",
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
    file, format, message
){
    
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: "Edit PPh 21/26 Awal",
        });
        try{
            if (context.request.method === 'GET') {
                var internalId = context.request.parameters.internalId;
                var year = context.request.parameters.tahun;
                var empId = context.request.parameters.employId;
                var empName = context.request.parameters.empName;
                var hireDate = context.request.parameters.hireDate;
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
                var intIdPph = form.addField({
                    id: 'custpage_intidpph',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TAHUN',
                });
                intIdPph.defaultValue = idpph;
                intIdPph.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.HIDDEN
                });

                var intId = form.addField({
                    id: 'custpage_intid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TAHUN',
                });
                intId.defaultValue = internalId;
                intId.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.HIDDEN
                });

                var tahun = form.addField({
                    id: 'custpage_tahun',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TAHUN',
                });
                tahun.defaultValue = year;
                tahun.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.DISABLED
                });
                var idpersonalia = form.addField({
                    id: 'custpage_idpersonalia',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID PERSONALIA',
                });
                idpersonalia.defaultValue = empId
                idpersonalia.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.DISABLED
                });
                var namasonalia = form.addField({
                    id: 'custpage_namapersonalia',
                    type: serverWidget.FieldType.TEXT,
                    label: 'NAMA PERSONALIA',
                });
                namasonalia.defaultValue = empName
                namasonalia.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.DISABLED
                });
                var Fromhiredate = form.addField({
                    id: 'custpage_hiredate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TANGGAL MULAI KERJA',
                });
                Fromhiredate.defaultValue = hireDate
                Fromhiredate.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.DISABLED
                });
                var from = form.addField({
                    id: 'custpage_from',
                    type: serverWidget.FieldType.SELECT,
                    source : 'customlist_abj_msa_list_bulan',
                    label: 'DARI BULAN',
                });
                from.defaultValue = dariRec
                var to = form.addField({
                    id: 'custpage_to',
                    type: serverWidget.FieldType.SELECT,
                    source : 'customlist_abj_msa_list_bulan',
                    label: 'KE BULAN',
                });
                to.defaultValue = keRec
                var gaji = form.addField({
                    id: 'custpage_gaji',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'GAJI/PENSIUN ATAU THT/JHT',
                });
                gaji.defaultValue = gajiRec
                var tunjangan = form.addField({
                    id: 'custpage_tunjangan',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'TUNJANGAN PPH',
                });
                tunjangan.defaultValue = tunjanagnRec
                var lainya = form.addField({
                    id: 'custpage_tunjangan_lainya',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'TUNJANGAN LAINNYA, UANG LEMBUR DAN SEBAGAINYA',
                });
                lainya.defaultValue = lainyaRec
                var honor = form.addField({
                    id: 'custpage_honor',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'HONORARIUM DAN IMBALAN LAIN SEJENISNYA',
                });
                honor.defaultValue = honorRec
                var premi = form.addField({
                    id: 'custpage_premi',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'PREMI ASURANSI YANG DIBAYAR PEMBERI KERJA',
                });
                premi.defaultValue = premiRec
                var natura = form.addField({
                    id: 'custpage_natura',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'PENERIMAAN DALAM BENTUK NATURA DAN KENIKMATAN LAINNYA YANG DIKENAKAN PEMOTONGAN PPH PASAL 21',
                });
                natura.defaultValue = naturaRec
                var tantiem = form.addField({
                    id: 'custpage_tantiem',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'TANTIEM, BONUS, GRATIFIKASI, JASA PRODUKSI, DAN THR',
                });
                tantiem.defaultValue = tantiemRec
                var iuran = form.addField({
                    id: 'custpage_iuran',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'IURAN PENSIUN ATAU IURAN THT/JHT',
                });
                iuran.defaultValue = iuranRec
                var pphterbayar = form.addField({
                    id: 'custpage_pphterbayar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'PPH 21 TERBAYAR',
                });
                pphterbayar.defaultValue = pphterbayarRec
                var netobef = form.addField({
                    id: 'custpage_netobef',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'PENGHASILAN NETO MASA SEBELUMNYA',
                });
                netobef.defaultValue = netobefRec
                var pphbef = form.addField({
                    id: 'custpage_pphbef',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'PPH21 YANG TELAH DIPOTONG MASA SEBELUMNYA',
                });
                pphbef.defaultValue = pphbefRec
                form.addSubmitButton({
                    label: 'Save'
                });
                context.response.writePage(form);
            }else{
                var intId = contextRequest.parameters.custpage_intid;
                log.debug('intId', intId)
                var tahun = contextRequest.parameters.custpage_tahun;
                var namaPersonalia = contextRequest.parameters.custpage_namapersonalia;
                var hireDate = contextRequest.parameters.custpage_hiredate;
                var from = contextRequest.parameters.custpage_from;
                var to = contextRequest.parameters.custpage_to;
                var gaji = contextRequest.parameters.custpage_gaji;
                var tunjangan = contextRequest.parameters.custpage_tunjangan;
                var lainya = contextRequest.parameters.custpage_tunjangan_lainya;
                var honor = contextRequest.parameters.custpage_honor;
                var premi = contextRequest.parameters.custpage_premi;
                var natura = contextRequest.parameters.custpage_natura;
                var tantiem = contextRequest.parameters.custpage_tantiem;
                var iuran = contextRequest.parameters.custpage_iuran;
                var pphterbayar = contextRequest.parameters.custpage_pphterbayar;
                var netobef = contextRequest.parameters.custpage_netobef;
                var pphbef = contextRequest.parameters.custpage_pphbef;
                var internalidpph = contextRequest.parameters.custpage_intidpph;
                log.debug('internalidpph', internalidpph);
                if (internalidpph == null || internalidpph == '') {
                    var recPPh = record.create({
                        type: 'customrecord_abj_msa_pph21awal',
                        isDynamic: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_id_personalia',
                        value: intId, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tahun',
                        value: tahun, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_nama_personalia',
                        value: namaPersonalia, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tgl_mulai_kerja',
                        value: from, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tgl_mulai_kerja',
                        value: hireDate, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_from_month',
                        value: from, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_ke_bulan',
                        value: to, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_gaji_pen',
                        value: gaji, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tunjangan_pph',
                        value: tunjangan, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tunjanganlainya',
                        value: lainya, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecordabj_msa_honorarium',
                        value: honor, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecordabj_msa_premi_asuransi',
                        value: premi, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_natura',
                        value: natura, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_tantiem',
                        value: tantiem, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_iuran_pensiun',
                        value: iuran, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_pph_terbayar',
                        value: pphterbayar, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_neto_bef',
                        value: netobef, 
                        ignoreFieldChange: true
                    })
                    recPPh.setValue({
                        fieldId: 'custrecord_abj_msa_pph21_bef',
                        value: pphbef, 
                        ignoreFieldChange: true
                    })
                    saveRec = recPPh.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    if(saveRec){
                        var html = `<html>
                        <h3>Data Berhasil Disimpan</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Result Save PPh 21/26 awal",
                        });
                        form_result.addPageInitMessage({
                            type: message.Type.CONFIRMATION,
                            title: "Sukses Simpan Data",
                            message: html,
                        });
                        context.response.writePage(form_result);
                    }
                }else{
                    var searchPPh = search.create({
                        type : 'customrecord_abj_msa_pph21awal',
                        filters : ["internalid","anyof",internalidpph],
                        columns : ["custrecord_abj_msa_id_personalia"]
                    });
                    var searchPPhSet = searchPPh.run()
                    var searchPPhResult = searchPPhSet.getRange({
                        start: 0,
                        end: 1
                    });
                    if(searchPPhResult.length > 0){
                        var recpphawal = record.load({
                            type: 'customrecord_abj_msa_pph21awal',
                            id : internalidpph,
                            isDynamic: false
                        })
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_from_month',
                            value: from,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_ke_bulan',
                            value: to,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_gaji_pen',
                            value: gaji,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_tunjangan_pph',
                            value: tunjangan,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_tunjanganlainya',
                            value: lainya,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecordabj_msa_honorarium',
                            value: honor,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecordabj_msa_premi_asuransi',
                            value: premi,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_natura',
                            value: natura,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_tantiem',
                            value: tantiem,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_iuran_pensiun',
                            value: iuran,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_pph_terbayar',
                            value: pphterbayar,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_neto_bef',
                            value: netobef,
                            ignoreFieldChange: true
                        });
                        recpphawal.setValue({
                            fieldId: 'custrecord_abj_msa_pph21_bef',
                            value: pphbef,
                            ignoreFieldChange: true
                        });
                        var updtSave = recpphawal.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        if(updtSave){
                            var html = `<html>
                            <h3>Data Berhasil di update</h3>
                            <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                            <body></body></html>`;
                            var form_result = serverWidget.createForm({
                                title: "Result Save PPh 21/26 awal",
                            });
                            form_result.addPageInitMessage({
                                type: message.Type.CONFIRMATION,
                                title: "Sukses Update Data",
                                message: html,
                            });
                            context.response.writePage(form_result);
                        }
                    }
                }
                

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        onRequest: onRequest
    };
});