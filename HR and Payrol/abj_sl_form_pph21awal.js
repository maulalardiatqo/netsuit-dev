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
                var xmlStr =
                        '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                    xmlStr +=
                        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                    xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                    xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                    // Styles
                    xmlStr += "<Styles>";
                    xmlStr += "<Style ss:ID='BC'>";
                    xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='Subtotal'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='15' ss:Bold='1' />";
                    xmlStr += "<Interior ss:Color='#FCFCF8' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='SubHead'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='13' />";
                    xmlStr += "<Interior ss:Color='#FCFCF8' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='SubKet'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='11' />";
                    xmlStr += "<Interior ss:Color='#FCFCF8' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='ColAB'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#f79925' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNC'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNCN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NB'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NBN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "</Styles>";
                    //   End Styles

                    // Sheet Name
                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name
                    // Kolom Excel Header
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='20' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='80' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='17' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="Subtotal" ss:MergeAcross="3"><Data ss:Type="String">Template Upload PPh 21/26 Awal</Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>"+
                    "<Row ss:Index='2' ss:Height='20'>" +
                    '<Cell ss:StyleID="SubHead" ss:MergeAcross="3"><Data ss:Type="String">Remaining PPh 21/26 Template</Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubHead"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>"+
                    "<Row ss:Index='3' ss:Height='20'>" +
                    '<Cell ss:StyleID="Subtotal" ss:MergeAcross="3"><Data ss:Type="String">CV. Marina Sukses Abadi</Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>"+
                    "<Row ss:Index='4' ss:Height='20'>" +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String">!</Data></Cell>' +
                    '<Cell ss:StyleID="SubKet" ss:MergeAcross="2"><Data ss:Type="String">Silakan input angka nominal tanpa menggunakan titik (.) atau koma (,) </Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>"+
                    "<Row ss:Index='5' ss:Height='20'>" +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet" ss:MergeAcross="2"><Data ss:Type="String">Please Input the nominal number without using point (.) or comma (,)</Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="SubKet"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>"+
                    "<Row ss:Index='6' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Tahun</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">ID Personalia</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Tanggal Mulai Kerja</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Dari Bulan</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Sampai Bulan</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Gaji/Pensiun/THT</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Tunlangan PPh</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Tunjangan Lainnya, Uang Lembur dan sebagainya</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Honorarium dan Imbalan Lain Sejenisnya</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Premi Asuransi yang Dibayar Pemberi Kerja</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Penerimaan dalam Bentuk Natura dan Kenikmatan Lainnya yang Dikenakan Pemotongan PPh Pasal 21</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Tantiem, Bonus, Gratifikasi, Jasa Produksi dan THR</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Iuran Pensiun atau Iuran THT/JHT</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">PPh21/26 Terbayar</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Penghasilan Neto Masa Sebelumnya</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">PPh21 Yang Telah Dipotong Masa Sebelumnya</Data></Cell>' +
                    "</Row>";
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
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + i + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + year + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+employeeID+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+empName+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+hireDate+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+dariRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+keRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+gajiRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+tunjanagnRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+ lainyaRec +'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+honorRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+premiRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+naturaRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+tantiemRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+iuranRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+pphterbayarRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+netobefRec+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+pphbefRec+'</Data></Cell>' +
                            "</Row>";

                        return true
                    })

                    xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "Template Upload PPh21_26 Awal.xls",
                    fileType: file.Type.EXCEL,
                    contents: strXmlEncoded,
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