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
    
    function onRequest(context) {
        try{
            
            var allData = JSON.parse(context.request.parameters.allData);
            log.debug('allData', allData)
            if(allData.length<=0){
                var html = `<html>
                <h3>No Data for this selection!.</h3>
                <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                <body></body></html>`;
                var form_result = serverWidget.createForm({
                    title: "Result Download Vendor Budget",
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
                "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='50' />" +
                "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='180' />" +
                "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='180' />" +
                "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='130' />" +
                "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='80' />" +
                "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='150' />" +
                "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='80' />" +
                "<Row ss:Index='1' ss:Height='20'>" +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">No.</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">External ID</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">Vendor Name</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">Budget</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">Achive (Bill)/Open</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">Achive (Bill Payment)/Paid In Full</Data></Cell>' +
                '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                "</Row>";
                var No = 1;
                log.debug('allData bef Foreach', allData);
                if (typeof allData === 'string') {
                    allData = JSON.parse(allData);
                }
                if (Array.isArray(allData)) {
                    allData.forEach((data)=>{
                        var vendId = data.vendId;
                        var vendName = data.vendName;
                        var budgetVanedor = data.budgetVanedor;
                        var vendExtId = data.vendExtId
                        var startDate = data.startDate
                        var endDate = data.endDate
                        log.debug('vendId', vendId);
                        var totalAmountOpen = 0;
                        var totalAmountPaid = 0;
                        var statusBill = '';
                        var vendorbillSearchObj = search.create({
                            type: "vendorbill",
                            filters:
                            [
                                ["type","anyof","VendBill"], 
                                "AND", 
                                ["mainline","is","T"], 
                                "AND", 
                                ["vendor.internalid","anyof",vendId],
                                "AND",
                                ["trandate","within",startDate,endDate]
                            ],
                            columns:
                            [
                                search.createColumn({name: "amount", label: "Amount"}),
                                search.createColumn({name: "statusref", label: "Status"}),
                                search.createColumn({
                                    name: "entityid",
                                    join: "vendor",
                                    label: "ID"
                                })
                            ]
                        });
                        var searchResultCount = vendorbillSearchObj.runPaged().count;
                        log.debug("vendorbillSearchObj result count",searchResultCount);
                        vendorbillSearchObj.run().each(function(result){
                            var amount = result.getValue({
                                name : "amount"
                            });
                            statusBill = result.getValue({
                                name : "statusref"
                            });
                            log.debug('statusBill', statusBill);
                            if(statusBill == 'paidInFull'){
                                totalAmountPaid += Number(amount)
                            }
                            if(statusBill == 'open'){
                                totalAmountOpen += Number(amount)
                            }
                            return true;
                        });
                        
                        var prosentaseBudgetPaid = 0;
                        var prosentaseBudgetOpen = 0;
                        if(budgetVanedor != 0){
                            log.debug('budgetVendor', budgetVanedor)
                            prosentaseBudgetPaid = ((totalAmountPaid / budgetVanedor) * 100).toFixed(2);
                            prosentaseBudgetOpen = ((totalAmountOpen / budgetVanedor) * 100).toFixed(2)
                        }
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + No + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + vendExtId + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + vendName + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + budgetVanedor + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalAmountOpen + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + prosentaseBudgetOpen + '%</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalAmountPaid + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + prosentaseBudgetPaid + '%</Data></Cell>' +
                        "</Row>";
                        No ++
                    })
                }else {
                    log.debug('allData bukanlah array.');
                }
                
                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
                var objXlsFile = file.create({
                    name: "BudgetVendorReport.xls",
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
    return{
        onRequest : onRequest
    }
});