/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode","N/format"], function(serverWidget,search,record,message,url,redirect, xml,file, encode,format){
    function onRequest(context){
        try{
            var allData = JSON.parse(context.request.parameters.allData);
            var totalan = JSON.parse(context.request.parameters.totalan);
            var nameAct = JSON.parse(context.request.parameters.nameAct);
            log.debug('nameAct', nameAct)
            log.debug('totalan', totalan)
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
                        "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
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
                    xmlStr += "<Interior ss:Color='#FEFFFF' ss:Pattern='Solid' />";
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
                    xmlStr += "<Interior ss:Color='#F8F9FA' ss:Pattern='Solid' />";
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
                    var periodNamely = '-'
                    var periodNamety = '-'
                    var thisYear = '-'
                    var lastYear = '-'
                    nameAct.forEach(function(data) {
                        if (data.periodNamely) {
                            periodNamely = data.periodNamely;
                        }
                        if (data.periodNamety) {
                            periodNamety = data.periodNamety;
                        }
                        if (data.thisYear) {
                            thisYear = data.thisYear;
                        }
                        if (data.lastYear) {
                            lastYear = data.lastYear;
                        }
                    });
                    // Sheet Name
                    log.debug('data', {periodNamely : periodNamely, periodNamety : periodNamety, thisYear : thisYear, lastYear : lastYear})
                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name
                    // Kolom Excel Header
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='200' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='200' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='200' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='80' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='80' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Summary</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">'+periodNamely+'</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">'+periodNamety+'</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">% YoY Growth</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">estimated FY</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">FY '+thisYear+' Target</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">FY '+lastYear+' Target</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                    "</Row>";
                    var index = 2
                    allData.forEach((data) => {
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.summary+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.act_py+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.act_ty+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.yoy+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.est_fy+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.fy_target+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.fy_target_p+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.fy_py+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+data.fy_py_p+'</Data></Cell>' +
                            "</Row>";
                            index++
                    })
                    index = index + 4
                    var totalBilling = 0
                    var totalCostOfBilling = 0
                    var totalDepre = 0
                    var grossProfitTotal = 0
                    var tax = 0
                    var deprely = 0
                    var deprety = 0
                    totalan.forEach(function(data){
                        totalBilling = data.totalBilling
                        totalCostOfBilling = data.totalCostOfBilling
                        totalDepre = data.totalDepre
                        grossProfitTotal = data.grossProfitTotal
                        tax = data.tax
                        deprely = data.deprely
                        deprety = data.deprety
                    });

                    xmlStr +=
                            "<Row ss:Index='"+index+"' ss:Height='20'>" +
                                    '<Cell ss:StyleID="BC"><Data ss:Type="String">*WIP onhand from reconcile file</Data></Cell>' +
                                    "</Row>";

                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Billing</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalBilling+'</Data></Cell>' +
                            "</Row>";
                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Cost Of Billing</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalCostOfBilling+'</Data></Cell>' +
                            "</Row>";
                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Gross Profit</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+grossProfitTotal+'</Data></Cell>' +
                            "</Row>";

                    index = index + 6
                    xmlStr +=
                            "<Row ss:Index='"+index+"' ss:Height='20'>" +
                                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                                    "</Row>";
                    xmlStr +=
                    "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Total Deprecation per Month</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+periodNamely+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+periodNamety+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Full Year</Data></Cell>' +
                            "</Row>";
                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+deprely+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+deprety+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalDepre+'</Data></Cell>' +
                            "</Row>";
                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Tax Rate</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+tax+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+tax+'</Data></Cell>' +
                            "</Row>";

                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "Report Monthly Review.xls",
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
