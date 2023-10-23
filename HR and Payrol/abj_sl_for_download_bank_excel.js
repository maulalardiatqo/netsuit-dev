/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        try{
            var allIdSlip = JSON.parse(context.request.parameters.allIdSlip);
            var bankId = context.request.parameters.bankId
            log.debug('bankid', bankId);
            log.debug('allIdSlip', allIdSlip);
            if(typeof bankId === 'undefined' || bankId === null || bankId === ''){
                var html = `<html>
                    <h3>Please Select Bank!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;
                    var form_result = serverWidget.createForm({
                        title: "Result Download Rekap Bank",
                    });
                    form_result.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "No Bank Selected!",
                        message: html,
                    });
                    context.response.writePage(form_result);
            }else{
                if(allIdSlip.length<=0){
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
                    
                    var currentDate = new Date();
                    log.debug('currdate',currentDate);
        
                    var formattedDate = convertToYYYYMMDD(currentDate);
                    log.debug('format date', formattedDate);
        
                    var jumlahSlip = allIdSlip.length
                    log.debug('jumlahSlip', jumlahSlip);

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
                        "<Font ss:Bold='1' ss:Color='#0A0A0A' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='Subtotal'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#FFFF00' ss:Pattern='Solid' />";
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
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='350' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='50' />" +
                    "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='17' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">P</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">'+formattedDate+'</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">1180012978465</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">'+jumlahSlip+'</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">118289704</Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    '<Cell><Data ss:Type="String"></Data></Cell>' +
                    "</Row>";
        
                    allIdSlip.forEach((data)=>{
                        var idSlip = data.internlId
                        log.debug('idSlip', idSlip)
                        var searchSlip = search.create({
                            type: "customrecord_msa_slip_gaji",
                            columns : ['internalid', 'custrecord_abj_msa_employee_slip', 'custrecord_abj_msa_thp'],
                            filters: [{
                                name: 'internalid',
                                operator: 'is',
                                values: idSlip
                            }]
                        });
                        var searchSlipSet = searchSlip.run();
                        searchSlip = searchSlipSet.getRange({
                            start: 0,
                            end: 1
                        });
                        if(searchSlip.length>0){
                            var searchSlipRecord = searchSlip[0];
                            var employeeId = searchSlipRecord.getValue({
                                name : 'custrecord_abj_msa_employee_slip'
                            });
                            var thp = searchSlipRecord.getValue({
                                name : 'custrecord_abj_msa_thp'
                            })
                            log.debug('employeeId', employeeId);
                            var searchRemu = search.create({
                                type: "customrecord_remunasi",
                                columns : ['internalid', 'custrecord3', 'custrecord_bank_name', 'custrecord_employee_bank_name', 'custrecord_norek', 'custrecord_kacab'],
                                filters: [{
                                    name: 'custrecord3',
                                    operator: 'is',
                                    values: employeeId
                                }]
                            });
                            var searchRemuSet = searchRemu.run();
                            searchRemu = searchRemuSet.getRange({
                                start: 0,
                                end: 1
                            });
                            if(searchRemu.length>0){
                                var recRemu = searchRemu[0];
                                var bankName = recRemu.getText({
                                    name : 'custrecord_bank_name'
                                })
                                var noRek = recRemu.getValue({
                                    name : 'custrecord_norek'
                                })
                                var kanCab = recRemu.getValue({
                                    name : 'custrecord_kacab'
                                })
                            }
                            var searchListEmp = search.create({
                                type: "employee",
                                columns : ['internalid','email', 'entityid', 'firstname', 'lastname'],
                                filters: [{
                                    name: 'internalid',
                                    operator: 'is',
                                    values: employeeId
                                }]
                            })
                            var searchListEmpSet = searchListEmp.run();
                            searchListEmp = searchListEmpSet.getRange({
                                start: 0,
                                end: 1
                            });
                            if (searchListEmp.length > 0) {
                                var empRec = searchListEmp[0];
                                var email = empRec.getValue({
                                    name : 'email'
                                });
                                var empID = empRec.getValue({
                                    name : 'entityid'
                                });
                                var firstName = empRec.getValue({
                                    name : 'firstname'
                                });
                                var lastName = empRec.getValue({
                                    name : 'lastname'
                                })
                                var nameEmploye = firstName + ' ' +lastName 
                            }
                            xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noRek + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + nameEmploye + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">IDR</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Rp. '+ thp +'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Pembayaran Gaji</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+ empID +'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">IBU</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+bankName+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+kanCab+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Y</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+email+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">OUR</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">1</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">E</Data></Cell>' +
                            "</Row>";
                        }
                    })
                    xmlStr += "</Table></Worksheet></Workbook>";
                    var strXmlEncoded = encode.convert({
                        string: xmlStr,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64,
                    });
                    var bank;
                    if(bankId == '1'){
                        bank = 'Mandiri'
                    }else{
                        bank = 'BCA'
                    }
                    var objXlsFile = file.create({
                        name: "Rekap Bank Transfer"+ " " + bank + ".xls",
                        fileType: file.Type.EXCEL,
                        contents: strXmlEncoded,
                    });
            
                    context.response.writeFile({
                        file: objXlsFile,
                    });
                }
            }
            
           
        }catch(e){
            log.debug('error', e)
        }
        
    }
    function convertToYYYYMMDD(nsFormattedDate) {
        var year = nsFormattedDate.getFullYear().toString();
        var month = (nsFormattedDate.getMonth() + 1).toString().padStart(2, '0');
        var day = nsFormattedDate.getDate().toString().padStart(2, '0');
    
        var formattedDate = year + month + day;
    
        return formattedDate;
    }
    return {
        onRequest: onRequest
    };
});