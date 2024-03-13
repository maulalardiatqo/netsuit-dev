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

                    // Sheet Name
                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name
                    // Kolom Excel Header
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='50' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='200' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='200' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
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
                    "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Name Of Product</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Name of Principal</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">INVOICE</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">PIUD / PIB</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">TGL SPPB</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">BL</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Landed Cost / KG</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Keterangan</Data></Cell>' +
                    "</Row>";


                    xmlStr += "<Row>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">NO</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">TGL</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">NO</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">TGL</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">NO</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">TGL</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">PO</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">QTY</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Unit Price</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Price/USD</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Rate PIB</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Price/IDR</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Freight Charge</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Import Cost</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Import Duty / BM</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Landed Cost</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String"></Data></Cell>' +
                    "</Row>";

                var nomor = 1
                var totalQty = 0
                var totalPriceUsd = 0
                var totalPriceIdr = 0
                var totalFreightCharge = 0
                var totalImportCost = 0
                var totalImportDuty = 0
                var totalLandedCost = 0
                var totalLandedCostperKg = 0

                allData.forEach(data=>{
                    var itemId = data.itemId
                    log.debug('itemId', itemId)
                    var vendor = data.vendor
                    var billNumbe = data.billNumbe
                    var date = data.date
                    var inbShipment = data.inbShipment || '-'
                    var irDate = data.irDate
                    if(irDate){
                        irDate = format.format({
                            value: irDate,
                            type: format.Type.DATE
                        });
                    }
                    log.debug('irDate', irDate)
                    var poNumb = data.poNumb
                    var qty = data.qty
                    totalQty += Number(qty)
                    var rateItem = data.rateItem
                    if(rateItem){
                        rateItem = format.format({
                            value: rateItem,
                            type: format.Type.CURRENCY
                        });
                    }
                    
                    var amount = data.amount
                    totalPriceUsd += Number(amount)
                    if(amount){
                        amount = format.format({
                            value: amount,
                            type: format.Type.CURRENCY
                        });
                    }
                    var excRate = data.excRate
                    if(excRate){
                        excRate = format.format({
                            value: excRate,
                            type: format.Type.CURRENCY
                        });
                    }
                    var priceIdr = data.priceIdr
                    totalPriceIdr += Number(priceIdr)
                    if(priceIdr){
                        priceIdr = format.format({
                            value: priceIdr,
                            type: format.Type.CURRENCY
                        });
                    }
                    var biayaAngkut = data.biayaAngkut
                    totalFreightCharge += Number(biayaAngkut)
                    if(biayaAngkut){
                        biayaAngkut = format.format({
                            value: biayaAngkut,
                            type: format.Type.CURRENCY
                        });
                    }
                    var biayaMasuk = data.biayaMasuk
                    totalImportCost += Number(biayaMasuk)
                    if(biayaMasuk){
                        biayaMasuk = format.format({
                            value: biayaMasuk,
                            type: format.Type.CURRENCY
                        });
                    }
                    var biayaPengurusan = data.biayaPengurusan
                    totalImportDuty += Number(biayaPengurusan)
                    if(biayaPengurusan){
                        biayaPengurusan = format.format({
                            value: biayaPengurusan,
                            type: format.Type.CURRENCY
                        });
                    }
                    var landedCost = data.landedCost
                    totalLandedCost += Number(landedCost)
                    var landedCostBef = landedCost
                    if(landedCost){
                        landedCost = format.format({
                            value: landedCost,
                            type: format.Type.CURRENCY
                        });
                    }
                    log.debug('landedcostperkg', {landedCost: landedCost, qty: qty})
                    var landedCostperKG = Number(landedCostBef) / Number(qty)
                    totalLandedCostperKg += Number(landedCostperKG)
                    if(landedCostperKG){
                        landedCostperKG = format.format({
                            value: landedCostperKG,
                            type: format.Type.CURRENCY
                        });
                    }
                    xmlStr +=
                    "<Row>" +
                    '<Cell ss:StyleID="NB"><Data ss:Type="String">' + nomor + '</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + itemId + '</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+vendor+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+billNumbe+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+date+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+inbShipment+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">-</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+irDate+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+ inbShipment +'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">-</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+poNumb+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+qty+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+rateItem+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+amount+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+excRate+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+priceIdr+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+biayaAngkut+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+biayaMasuk+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+biayaPengurusan+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+landedCost+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+landedCostperKG+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">FINAL : SUDAH CLEARANCE</Data></Cell>' +
                    "</Row>";

                    nomor++
                });
                if(totalPriceUsd){
                    totalPriceUsd = format.format({
                        value: totalPriceUsd,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalPriceIdr){
                    totalPriceIdr = format.format({
                        value: totalPriceIdr,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalFreightCharge){
                    totalFreightCharge = format.format({
                        value: totalFreightCharge,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalImportCost){
                    totalImportCost = format.format({
                        value: totalImportCost,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalImportDuty){
                    totalImportDuty = format.format({
                        value: totalImportDuty,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalLandedCost){
                    totalLandedCost = format.format({
                        value: totalLandedCost,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalLandedCostperKg){
                    totalLandedCostperKg = format.format({
                        value: totalLandedCostperKg,
                        type: format.Type.CURRENCY
                    });
                }
                xmlStr +=
                    "<Row>" +
                    '<Cell ss:StyleID="NB"><Data ss:Type="String">Total</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalQty+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalPriceUsd+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalPriceIdr+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalFreightCharge+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalImportCost+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalImportDuty+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalLandedCost+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+totalLandedCostperKg+'</Data></Cell>' +
                    '<Cell ss:StyleID="NBN"><Data ss:Type="String">FINAL : SUDAH CLEARANCE</Data></Cell>' +
                    "</Row>";
                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "Report COGS.xls",
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
