/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode","N/format"], function(serverWidget,search,record,message,url,redirect, xml,file, encode,format){
    function onRequest(context){
        try{
            var allData = JSON.parse(context.request.parameters.allData);
            var idSub = JSON.parse(context.request.parameters.idSub);
            if(idSub){
                var subsidiariRec = record.load({
                    type: "subsidiary",
                    id: idSub,
                    isDynamic: false,
                  });
                  var legalName = subsidiariRec.getValue('legalname');
            }
            log.debug('allData', allData)
            if(allData.length<=0){
                var html = `<html>
                <h3>No Data for this selection!.</h3>
                <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                <body></body></html>`;
                var form_result = serverWidget.createForm({
                    title: "Result Download Cash Flow",
                });
                form_result.addPageInitMessage({
                    type: message.Type.ERROR,
                    title: "No Data!",
                    message: html,
                });
                context.response.writePage(form_result);
            }else{
                function convertCurr(data){
                    data = format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });

                    return data
                }
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

                    xmlStr += "<Style ss:ID='BCN'>";
                    xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
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
                    var uniquePeriods = {};
                    allData.forEach(function(category) {
                        for (var key in category) {
                            if (category.hasOwnProperty(key) && Array.isArray(category[key])) {
                                category[key].forEach(function(item) {
                                    if (item.periodToset !== undefined) {
                                        uniquePeriods[item.periodToset] = true;
                                    }
                                });
                            }
                        }
                    }); 
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='250' />";
                    var jumlahCell = 0;
                    var index = 2;
                    for (var period in uniquePeriods) {
                        xmlStr += `<Column ss:Index='${index}' ss:AutoFitWidth='0' ss:Width='100' />`;
                        index++;
                        jumlahCell ++
                    }
                    log.debug('index', index)
                    var headRow1 = "<Row ss:Index='1' ss:Height='20'>";
                    headRow1 += `<Cell ss:StyleID="BCN" ss:MergeAcross='${jumlahCell}'><Data ss:Type="String">Cash Flow Projection</Data></Cell>`;
                    headRow1 += "</Row>";
                    if(legalName){
                        headRow1 += "<Row>";
                        headRow1 += `<Cell ss:StyleID="BCN" ss:MergeAcross='${jumlahCell}'><Data ss:Type="String">`+legalName+`</Data></Cell>`;
                        headRow1 += "</Row>";
                    }
                    log.debug('uniquePeriods', uniquePeriods)
                    var keys = Object.keys(uniquePeriods);
                    var firstPeriod = keys[0];
                    var lastPeriod = keys[keys.length - 1];
                    var formattedFirstPeriod = firstPeriod.charAt(0).toUpperCase() + firstPeriod.slice(1).replace("_", " ");
                    var formattedLastPeriod = lastPeriod.charAt(0).toUpperCase() + lastPeriod.slice(1).replace("_", " ");
                    headRow1 += "<Row>";
                    headRow1 += `<Cell ss:StyleID="BCN" ss:MergeAcross='${jumlahCell}'><Data ss:Type="String">Periode `+formattedFirstPeriod+` sd `+formattedLastPeriod+`</Data></Cell>`;
                    headRow1 += "</Row>";

                    xmlStr += headRow1;
                    
                    var headerRow = "<Row ss:Index='4' ss:Height='20'>";
                    headerRow += '<Cell ss:StyleID="BC"><Data ss:Type="String">Summary</Data></Cell>';
                    Object.keys(uniquePeriods).forEach(function(period) {
                        headerRow += '<Cell ss:StyleID="BC"><Data ss:Type="String">'+period+'</Data></Cell>';
                    });
                    headerRow += "</Row>";
                    xmlStr += headerRow;
                    allData.forEach(function(data) {
                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Beginning balance cash and bank</Data></Cell>';
                    
                        data.allBeginningBalance.forEach(function(balance) {
                            xmlStr += '<Cell><Data ss:Type="String">' + balance.beginningBalance + '</Data></Cell>';
                        });
                        xmlStr += "</Row>";

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Total outstanding Account Receivable</Data></Cell>';
                        data.allOutstanding.forEach(function(outstanding) {
                            xmlStr += '<Cell><Data ss:Type="String">' + outstanding.outstanding + '</Data></Cell>';
                        });
                        xmlStr += "</Row>";

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Total WIP</Data></Cell>';
                        data.allWIP.forEach(function(wip) {
                            xmlStr += '<Cell><Data ss:Type="String">' + wip.wip + '</Data></Cell>';
                        });
                        xmlStr += "</Row>";
                        

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Total outstanding Account Payable</Data></Cell>';
                        data.alloutstandingPayable.forEach(function(outstandingPayable) {
                            xmlStr += '<Cell><Data ss:Type="String">' + outstandingPayable.outstandingPayable + '</Data></Cell>';
                        });
                        xmlStr += "</Row>";

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Cost Of Billing</Data></Cell>';
                        data.allCOB.forEach(function(cob) {
                            xmlStr += '<Cell><Data ss:Type="String">' + cob.cob + '</Data></Cell>';
                        });
                        xmlStr += "</Row>";

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Total operational expenses per month</Data></Cell>';
                        data.alloprasionalExp.forEach(function(oprasionalExp) {
                            xmlStr += '<Cell><Data ss:Type="String">' + oprasionalExp.oprasionalExp + '</Data></Cell>';
                        });
                        xmlStr += "</Row>"

                        data.allLoan.forEach(function(loanArray) {
                            if(data.allLoan){
                                log.debug('loanArray', loanArray)
                                xmlStr += "<Row>";
                                xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Loan</Data></Cell>';
                                loanArray.forEach(function(loan) {
                                    var amountLoan = convertCurr(loan.loanAmount);
                                    xmlStr += '<Cell><Data ss:Type="String">' + amountLoan + '</Data></Cell>';
                                });
                                xmlStr += "</Row>"
                            }
                            
                        });

                        xmlStr += "<Row>";
                        xmlStr += '<Cell ss:StyleID="NB"><Data ss:Type="String">Ending Balance</Data></Cell>';
                        data.allEndingBalance.forEach(function(endingBalance) {
                            var amountEndingBalance = convertCurr(endingBalance.endingBalance)
                            xmlStr += '<Cell><Data ss:Type="String">' + amountEndingBalance + '</Data></Cell>';
                        });
                        xmlStr += "</Row>"
                        
                    });           

                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "Report Cash Flow.xls",
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
