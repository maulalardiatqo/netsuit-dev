/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/file', 'N/ui/message'], function (serverWidget, search, record, file, message) {
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: 'CSV eSPT PPh 21'
        });
        if (context.request.method === 'GET') {
            var monthName = form.addField({
                id: 'custpage_pph_select_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bulan',
            });
            monthName.addSelectOption({
                value: '',
                text: ''
            });
            var monthNamesIndonesia = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            var monthNamesEnglish = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            for (var i = 1; i <= 12; i++) {
                monthName.addSelectOption({
                    value: monthNamesEnglish[i - 1],
                    text: monthNamesIndonesia[i - 1]
                });
            }
            monthName.isMandatory = true;
            var yearName = form.addField({
                id: 'custpage_pph_select_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Tahun',
            });
            yearName.addSelectOption({
                value: '',
                text: ''
            });
            for (var year = 2020; year <= 2030; year++) {
                yearName.addSelectOption({
                    value: year.toString(),
                    text: year.toString()
                });
            }
            yearName.isMandatory = true;
            form.addSubmitButton({
                label: 'Download 1721 I Bulanan'
            });
            context.response.writePage(form);
        }  else if (context.request.method === 'POST'){
            try{
                var bulan = context.request.parameters.custpage_pph_select_month
                var masaPajak;
                var indeksBulan = new Date(Date.parse(bulan + " 1, 2023")).getMonth();

                if (indeksBulan >= 0) {
                    masaPajak = indeksBulan + 2;
                    if (masaPajak > 12) {
                        masaPajak -= 12;
                    }
                }
                log.debug('masaPajak', masaPajak);
                var tahun = context.request.parameters.custpage_pph_select_year
                var bulanTahun = bulan + " " + tahun + " " + "-"
                log.debug('bulanTahun', bulanTahun);

                var searchSlip = search.create({
                    type : 'customrecord_msa_slip_gaji',
                    filters : [{
                        name : 'custrecord_abj_msa_period_gaji',
                        operator : 'contains',
                        values : bulanTahun
                    }], 
                    columns:
                    [
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "custrecord_abj_msa_employee_slip", label: "Employee"}),
                    search.createColumn({name: "custrecord_abj_msa_pph21perusahaan", label: "PPh21 Ditanggung Perusahaan"}),
                    search.createColumn({name: "custrecord_abj_msa_pph21karyawan", label: "PPH21 Ditanggung Karyawan"}),
                    search.createColumn({name: "custrecord_abj_msa_thp", label: "Take Home Pay"}),
                    search.createColumn({name: "custrecord_abj_msa_bruto", label: "Gaji Bruto"})
                    ]
                });
                var searchSlipSet = searchSlip.runPaged().count;
                if(searchSlipSet > 0){
                    var allData = [];
                    searchSlip.run().each(function(result){
                        var employee = result.getValue({
                            name : 'custrecord_abj_msa_employee_slip'
                        });
                        var pphPerusahaan = result.getValue({
                            name : 'custrecord_abj_msa_pph21perusahaan'
                        });
                        var pphKaryawan = result.getValue({
                            name : 'custrecord_abj_msa_pph21karyawan'
                        });
                        var bruto = result.getValue({
                            name : 'custrecord_abj_msa_bruto'
                        });

                        allData.push({
                            employee : employee,
                            pphPerusahaan : pphPerusahaan,
                            pphKaryawan : pphKaryawan,
                            bruto : bruto
                        })
                        return true
                        
                    });
                    log.debug('alldata', allData );
                    if(allData.length <= 0){
                        var html = `<html>
                        <h3>No Data for this selection!.</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Result Download Rekap Bank",
                        });
                        form_result.addPageInitMessage({
                            type: message.Type.ERROR,
                            title: "No Data!",
                            message: html,
                        });
                        context.response.writePage(form_result);
                        
                    }else{
                        var csvStr = "Masa Pajak,Tahun Pajak,Pembetulan,NPWP,Nama,Kode Pajak,Jumlah Bruto, Jumlah PPh, Kode Negara\n";
                        allData.forEach((data) => {
                            var employee = data.employee;
                            var pphPerusahaan = data.pphPerusahaan;
                            var pphKaryawan = data.pphKaryawan;
                            var bruto = data.bruto;
    
                            if(pphPerusahaan != "" || pphKaryawan != ""){
                                log.debug('ada pph');
                                var searchRemu = search.create({
                                    type : 'customrecord_remunasi',
                                    filters : [{
                                        name : 'custrecord3',
                                        operator : 'is',
                                        values : employee
                                    }],
                                    columns : ['custrecord_no_npwp', 'custrecord3']
                                });
                                var searchRemuSet = searchRemu.run();
                                searchRemu = searchRemuSet.getRange({
                                    start: 0,
                                    end: 1
                                });
                                if(searchRemu.length > 0){
                                    var recRemu = searchRemu[0];
                                    var employeeName = recRemu.getText({
                                        name : 'custrecord3'
                                    });
                                    var npwp = recRemu.getValue({
                                        name : 'custrecord_no_npwp'
                                    });
                                    log.debug('remu', {employeeName : employeeName, npwp : npwp});

                                    csvStr += '"' + masaPajak + '",';
                                    csvStr += '"' + tahun + '",';
                                    csvStr += '0,';
                                    csvStr += '"' + npwp + '",';
                                    csvStr += '"' + employeeName + '",';
                                    csvStr += '21-100-01,';
                                    csvStr += '"' + bruto + '",';
                                    if(pphPerusahaan != ""){
                                        csvStr += '"' + pphPerusahaan + '",';
                                    }else{
                                        csvStr += '"' + pphKaryawan + '",';
                                    }
                                    
                                    csvStr += ',';
                                    csvStr += '\n';
                                }
                            }
                        });
                        var nameFile = tahun + bulan
                        var objCsvFile = file.create({
                            name: nameFile + "1721|Bulanan.csv",
                            fileType: file.Type.CSV,
                            contents: csvStr,
                        });
        
                        context.response.writeFile({
                            file: objCsvFile,
                        });
                    }
                    
                }else{
                    var html = `<html>
                        <h3>No Data for this selection!.</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Result Download Rekap Bank",
                        });
                        form_result.addPageInitMessage({
                            type: message.Type.ERROR,
                            title: "No Data!",
                            message: html,
                        });
                        context.response.writePage(form_result);
                }
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return {
        onRequest: onRequest
    };
});
