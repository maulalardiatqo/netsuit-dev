/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode",], function(serverWidget,search,record,message,url,redirect, xml,file, encode){
    function onRequest(context){
        try{
            var customSearchId = 'customsearch_abj_siap_gaji';
            var mySearch = search.load({
                id: customSearchId
            });

            var allData = [];

            mySearch.run().each(function (row) {
                var employeeID = row.getValue({
                    name: 'custrecord_employee_gaji'
                });
                var employeeName = row.getText({
                    name: 'custrecord_employee_gaji'
                });
                
                var thp = row.getValue({
                    name: 'custrecord_take_home_pay'
                });

                allData.push({
                    employeeID: employeeID,
                    employeeName : employeeName,
                    thp : thp
                });
                return true;
            });
            log.debug('allData', allData)
            if(allData.length<=0){
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
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">P</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">20230920</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">1180012978465</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">2</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">5369613</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>";
                    // End Kolom Excel Header
                    // body data
                    var thp
                    allData.forEach((data)=>{
                    var employeeID = data.employeeID;
                    var employeeName = data.employeeName;
                    thp = data.thp

                    if(employeeID){
                        var searchGaji = search.create({
                            type: 'customrecord_remunasi',
                            columns: ['internalid', 'custrecord3', 'custrecord_bank_name', 'custrecord_employee_bank_name', 'custrecord_norek', 'custrecord_kacab'],
                            filters: [{
                                name: 'custrecord3',
                                operator: 'is',
                                values: employeeID
                            }]
                        });
                        var searchGajiSet= searchGaji.runPaged().count;
                        searchGaji.run().each(function(row){
                            var namaBank = row.getText({
                                name : 'custrecord_bank_name'
                            });
                            var noRek = row.getValue({
                                name : 'custrecord_norek'
                            });
                            var nameEmploye = row.getValue({
                                name : 'custrecord_employee_bank_name'
                            }); 
                            var kanCab = row.getValue({
                                name : 'custrecord_kacab'
                            })
                            log.debug('thp', thp);
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
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+ employeeName +'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">IBU</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+namaBank+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+kanCab+'</Data></Cell>' +
                            "</Row>";
        
                        });
                    }
                    
                });
                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "Rekap Data Bank Transfer.xls",
                    fileType: file.Type.EXCEL,
                    contents: strXmlEncoded,
                });
        
                context.response.writeFile({
                    file: objXlsFile,
                });

            }

        }catch(e){
            log.debug('error', e);
        }
        
    }

    return {
        onRequest: onRequest
    };
});
