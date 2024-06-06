/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode","N/format"], function(serverWidget,search,record,message,url,redirect, xml,file, encode,format){
    function onRequest(context){
        try{
            var allData = JSON.parse(context.request.parameters.allData);
            log.debug('allData', allData)
            if(allData.length<=0){
                var html = `<html>
                <h3>No Data for this selection!.</h3>
                <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                <body></body></html>`;
                var form_result = serverWidget.createForm({
                    title: "Result Export Monthly Review",
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
                        "<Font ss:Color='#0E0D0D' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#A9AAAA' ss:Pattern='Solid' />";
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
                    xmlStr += "<Style ss:ID='headerStyle1'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "</Styles>";
                    //   End Styles

                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name
                    // Kolom Excel Header
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='450' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='250' />" +

                    "<Row ss:Index='1' ss:Height='20'>" +
                        '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String">Report Cash Advance</Data></Cell>' +
                        "</Row>";
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">No. Form</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Name Of Employee</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Project Number</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Description</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Amount</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Transfer Date</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Bank</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nomor Rekening</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama Rekening</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Settlement Date </Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Settlement Amount</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Different</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Refund</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Kurang Bayar</Data></Cell>' +
                            "</Row>";
                        allData.forEach((data)=>{
                            xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.noTrans + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.empName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.projectName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.memo + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.amountCash + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.transferDate + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.bank + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.bankAcc + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.norec + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.expDate + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.expAmount + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.diffAmt + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.depoAmount + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.paymentAmount + '</Data></Cell>' +
                            "</Row>";

                        });
                        xmlStr += "</Table></Worksheet></Workbook>";
                        var strXmlEncoded = encode.convert({
                            string: xmlStr,
                            inputEncoding: encode.Encoding.UTF_8,
                            outputEncoding: encode.Encoding.BASE_64,
                        });
                
                        var objXlsFile = file.create({
                            name: "Report Cash Advance.xls",
                            fileType: file.Type.EXCEL,
                            contents: strXmlEncoded,
                        });
                
                        context.response.writeFile({
                            file: objXlsFile,
                        });
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        onRequest: onRequest
    };
});
