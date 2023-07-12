/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode",], function(serverWidget,search,record,message,url,redirect, xml,file, encode){
    function onRequest(context){
        var contextRequest = context.request;
        if (contextRequest.method === "GET"){
            var form = serverWidget.createForm({
                title: "Landed Cost Reporting",
            });
            
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTER",
            });
            var filterOption = form.addFieldGroup({
                id: "periodoption",
                label: "PERIOD RANGE",
            });
            var goodReceipt = form.addField({
                id: 'custpage_good_receipt_no',
                type: serverWidget.FieldType.TEXT,
                label: 'Good Receipt Report No.',
                container: 'filteroption',
            });
            
            var creditName = form.addField({
                id: 'custpage_creditor_name',
                type: serverWidget.FieldType.SELECT,
                label: 'Creditor Name',
                source: 'vendor',
                container: 'filteroption',
            });
            var periodFilterStart = form.addField({
                id: 'custpage_accounting_period_from',
                type: serverWidget.FieldType.SELECT,
                label: 'START',
                container: 'periodoption',
                source: 'accountingperiod',
            });
            periodFilterStart.defaultValue = 0;
        
            var periodFilterEnd = form.addField({
                id: 'custpage_accounting_period_to',
                type: serverWidget.FieldType.SELECT,
                label: 'END',
                container: 'periodoption',
                source: 'accountingperiod',
            });
            periodFilterEnd.defaultValue = 0;
            form.addSubmitButton({
                label: "Generate Download",
            });
            context.response.writePage(form);

        }else{
            var goodReceiptNo = contextRequest.parameters.custpage_good_receipt_no
            var filtCreditorName = contextRequest.parameters.custpage_creditor_name
            var periodFrom = contextRequest.parameters.custpage_accounting_period_from;
            var periodTo = contextRequest.parameters.custpage_accounting_period_to;
            try{
                if(periodFrom && periodTo){
                    if(periodFrom){
                        var recPeriodFrom = record.load({
                            type: record.Type.ACCOUNTING_PERIOD,
                            id: periodFrom,
                        });
                        var periodNameFrom = recPeriodFrom.getText({
                            fieldId: 'periodname'
                        });
                        var periodStartDate = recPeriodFrom.getValue({
                        fieldId: 'startdate'
                        });
                    }
                    if(periodTo){
                        var recPeriodTo = record.load({
                            type: record.Type.ACCOUNTING_PERIOD,
                            id: periodTo,
                        });
                            var periodNameTo = recPeriodTo.getText({
                            fieldId: 'periodname'
                        });
                            var periodEndDate = recPeriodTo.getValue({
                            fieldId: 'enddate'
                        });
                    }
            
                    
                    var periodFromSplit = periodNameFrom.split(" ");
                    var periodToSplit = periodNameTo.split(" ");
                    var yearFrom = periodFromSplit[1];
                    var yearTo = periodToSplit[1];
                    var dateNow = new Date();
                    var yearNow = dateNow.getFullYear();
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                    ];
                    var monthNow = monthNames[dateNow.getMonth()];
            
                    function format_date_for_save_search(vDate) {
                    var vDate = new Date(vDate);
                    var hari = vDate.getDate();
                    var bulan = vDate.getMonth() + 1;
                    var tahun = vDate.getFullYear();
                    var vDate = hari + "/" + bulan + "/" + tahun;
                    return vDate;
                    }
                    
    
                    log.debug("startdate", format_date_for_save_search(periodStartDate));
                    log.debug("enddate", format_date_for_save_search(periodEndDate));
    
                    var rangePeriod = [];
                    for (var i = periodFrom; i <= periodTo; i++) {
                        rangePeriod.push(i);
                    }
                }
                
                var listData = []
                if(filtCreditorName){
                    
                    var recCreditorName = record.load({
                        type: "vendor",
                        id: filtCreditorName
                    });
                    var filterCreditorName = recCreditorName.getValue({
                        fieldId: 'legalname'
                    });
                }
                
                var dataLandedCost = search.load({
                    id: "customsearch_abj_landedcost_report"
                });
                if(periodStartDate && periodEndDate){
                    log.debug('masuk period')
                    dataLandedCost.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: format_date_for_save_search(periodStartDate),
                        })
                    );
                    dataLandedCost.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: format_date_for_save_search(periodEndDate),
                        })
                    );
                }
                
                var dataLandedCostSet = dataLandedCost.run();
                dataLandedCost = dataLandedCostSet.getRange(0, 999);
                log.debug("dataLandedCost", dataLandedCost.length);
                log.debug('dataLandedCost', dataLandedCost);
                dataLandedCost.forEach(function(row){
                    var GrNumb = row.getValue({
                        name: dataLandedCostSet.columns[0]
                    });
                    var grNumbText = row.getText({
                        name: dataLandedCostSet.columns[0]
                    })
                    var inbounNo = row.getValue({
                        name: dataLandedCostSet.columns[1]
                    });
                    var inbounNoText = row.getText({
                        name: dataLandedCostSet.columns[1]
                    });
                    var date = row.getValue({
                        name: dataLandedCostSet.columns[2]
                    });
                    var creditorName = row.getValue({
                        name: dataLandedCostSet.columns[3]
                    });
                    var item = row.getText({
                        name: dataLandedCostSet.columns[4]
                    });
                    var itemDisplayName = row.getValue({
                        name: dataLandedCostSet.columns[5]
                    });
                    var itemType = row.getText({
                        name: dataLandedCostSet.columns[6]
                    });
                    var POno = row.getValue({
                        name: dataLandedCostSet.columns[7]
                    });
                    var project = row.getValue({
                        name: dataLandedCostSet.columns[8]
                    })
                    var qty = row.getValue({
                        name: dataLandedCostSet.columns[9]
                    });
                    var uom = row.getValue({
                        name: dataLandedCostSet.columns[10]
                    });
                    var currenc = row.getText({
                        name: dataLandedCostSet.columns[11]
                    })
                    var exchangeRate = row.getValue({
                        name: dataLandedCostSet.columns[12]
                    });
                    var unitPrice = row.getValue({
                        name: dataLandedCostSet.columns[13]
                    });
                    var subTotal = row.getValue({
                        name: dataLandedCostSet.columns[14]
                    });
                    var customDuties = row.getValue({
                        name: dataLandedCostSet.columns[15]
                    });
                    var freightCharges = row.getValue({
                        name: dataLandedCostSet.columns[16]
                    });
                    var marineIsurance = row.getValue({
                        name: dataLandedCostSet.columns[17]
                    });
                    var handlingCharges = row.getValue({
                        name: dataLandedCostSet.columns[18]
                    });
                    var forwardingCharges = row.getValue({
                        name: dataLandedCostSet.columns[19]
                    });
                    var totalMyr1 = row.getValue({
                        name: dataLandedCostSet.columns[22]
                    });
                    var totalLandedCost = row.getValue({
                        name: dataLandedCostSet.columns[23]
                    });
                    var totalMYR2 = row.getValue({
                        name: dataLandedCostSet.columns[24]
                    });
                    
                    var plusMYR2 = Number(totalMyr1) + Number(totalLandedCost);
                    var costperUnit = Number(plusMYR2)/Number(qty);

                    var convText = GrNumb.toString();
                    var GrnumbString = convText.split(/[<|>]/)[2];
                    if(goodReceiptNo != "" || filtCreditorName != ""){
                        if(goodReceiptNo == GrnumbString || filterCreditorName == creditorName){
                            listData.push({
                                GrNumb: GrNumb,
                                inbounNoText: inbounNoText,
                                date: date,
                                creditorName: creditorName,
                                item: item,
                                itemDisplayName: itemDisplayName,
                                itemType: itemType,
                                POno: POno,
                                project: project,
                                qty: qty,
                                uom: uom,
                                currenc: currenc,
                                exchangeRate: exchangeRate,
                                unitPrice: unitPrice,
                                subTotal: subTotal,
                                customDuties: customDuties,
                                freightCharges: freightCharges,
                                marineIsurance: marineIsurance,
                                handlingCharges: handlingCharges,
                                forwardingCharges: forwardingCharges,
                                totalMyr1: totalMyr1,
                                totalLandedCost: totalLandedCost,
                                totalMYR2: totalMYR2,
                                costperUnit: costperUnit,
                                plusMYR2: plusMYR2,
                            });
                        }
                    }else{
                        listData.push({
                            GrNumb: GrNumb,
                            inbounNoText: inbounNoText,
                            date: date,
                            creditorName: creditorName,
                            item: item,
                            itemDisplayName: itemDisplayName,
                            itemType: itemType,
                            POno: POno,
                            project: project,
                            qty: qty,
                            uom: uom,
                            currenc: currenc,
                            exchangeRate: exchangeRate,
                            unitPrice: unitPrice,
                            subTotal: subTotal,
                            customDuties: customDuties,
                            freightCharges: freightCharges,
                            marineIsurance: marineIsurance,
                            handlingCharges: handlingCharges,
                            forwardingCharges: forwardingCharges,
                            totalMyr1: totalMyr1,
                            totalLandedCost: totalLandedCost,
                            totalMYR2: totalMYR2,
                            costperUnit: costperUnit,
                            plusMYR2: plusMYR2,
                        });
                    }
                    
                });
                if(listData.length <= 0){
                    var html = `<html>
                    <h3>No Data for this selection!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;

                    var form_result = serverWidget.createForm({
                        title: "Result of Landed Cost Report",
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
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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
                    xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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
                    "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='170' />" +
                    "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='26' ss:AutoFitWidth='0' ss:Width='170' />" +
                    "<Column ss:Index='27' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Good Receipt Report Number</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Inbound Shipment No</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Date</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Creditor Name</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Item</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Display Name</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Item Type</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">PO No</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Project</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Quantity</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">UOM</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Currency</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Exchange Rate</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Unit Price</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Subtotal</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Total (MYR)</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Total Pershipment</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Custom Duties</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Freight Charges</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Marine Insurance</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Handling Charges</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Forwading Chargers</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Total(Landed Cost)</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Total Landed Cost Pershipment</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Total (MYR)</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Grand Total (Cost + Landed Cost)</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Cost Per Unit</Data></Cell>' +
                    "</Row>";
                    // End Kolom Excel Header
                    // body data
                    var tempinbound = "";
                    var totalMYR1Temp = 0;
                    var subtotaltemp = 0;
                    var custDutiesTemp = 0;
                    var fchargTemp = 0;
                    var mInsuranceTemp = 0;
                    var hChargeTemp = 0;
                    var ForwardChargeTemp = 0;
                    var totalLandCostTemp = 0;
                    var totalMYR2Temp = 0;
                    var cetakSubTotal = false;

                    function compare( a, b ) {
                        if (a.inbounNoText === "- None -") {
                            return 1;
                        }
                        if (b.inbounNoText === "- None -") {
                            return -1;
                        }
                        if ( a.inbounNoText < b.inbounNoText ){
                            return -1;
                        }
                        if ( a.inbounNoText > b.inbounNoText ){
                            return 1;
                        }
                        return 0;
                    }
                    listData.sort( compare );
                    listData.forEach((data, index)=>{
                            if(tempinbound == data.inbounNoText){
                                subtotaltemp = subtotaltemp + Number(data.subTotal)
                                custDutiesTemp = custDutiesTemp + Number(data.customDuties)
                                fchargTemp = fchargTemp + Number(data.freightCharges)
                                mInsuranceTemp = mInsuranceTemp + Number(data.marineIsurance)
                                hChargeTemp = hChargeTemp + Number(data.handlingCharges)
                                ForwardChargeTemp = ForwardChargeTemp + Number(data.forwardingCharges)
                                totalLandCostTemp = totalLandCostTemp + Number(data.totalLandedCost) 
                                totalMYR2Temp = totalMYR2Temp + Number(data.plusMYR2)
                                totalMYR1Temp = totalMYR1Temp + Number(data.totalMyr1)
                            }else{
                                subtotaltemp = Number(data.subTotal)
                                custDutiesTemp = Number(data.customDuties)
                                fchargTemp = Number(data.freightCharges)
                                mInsuranceTemp = Number(data.marineIsurance)
                                hChargeTemp = Number(data.handlingCharges)
                                ForwardChargeTemp = Number(data.forwardingCharges)
                                totalLandCostTemp = Number(data.totalLandedCost) 
                                totalMYR2Temp = Number(data.plusMYR2) 
                                totalMYR1Temp = Number(data.totalMyr1)
                            }
                        
                        if(index<listData.length-1){
                            if(listData[index].inbounNoText != listData[index+1].inbounNoText){
                                cetakSubTotal = true;
                            }else{
                                cetakSubTotal = false;
                            }
                        }else{
                            if (data.inbounNoText !== "- None -") {
                                cetakSubTotal = true;
                            } else {
                                cetakSubTotal = false;
                            }
                        }
                        tempinbound = data.inbounNoText
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + data.GrNumb + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.inbounNoText + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.date + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.creditorName + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.item + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.itemDisplayName + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.itemType + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.POno + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.project + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.qty + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.uom + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + data.currenc + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.exchangeRate + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.unitPrice + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.subTotal + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.totalMyr1 + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.customDuties + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.freightCharges + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.marineIsurance + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.handlingCharges + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.forwardingCharges + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.totalLandedCost + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.plusMYR2 + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + data.costperUnit + '</Data></Cell>' +
                        "</Row>";

                        if(cetakSubTotal){
                            xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Sub Total Pershipment*:</Data></Cell>' +
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
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+subtotaltemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalMYR1Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalMYR1Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+custDutiesTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+fchargTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+mInsuranceTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+hChargeTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+ForwardChargeTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalLandCostTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalLandCostTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalMYR2Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalMYR2Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</Data></Cell>' +
                            '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                            "</Row>";
                        }
                    });
                    xmlStr += "</Table></Worksheet></Workbook>";
                    var strXmlEncoded = encode.convert({
                        string: xmlStr,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64,
                    });
            
                    var objXlsFile = file.create({
                        name: "Landed Cost Report.xls",
                        fileType: file.Type.EXCEL,
                        contents: strXmlEncoded,
                    });
            
                    context.response.writeFile({
                        file: objXlsFile,
                    });
                }
            }catch(e) {
                log.debug("error in get report", e.name + ": " + e.message);
            }
        }
        
    }
    return {
        onRequest: onRequest,
    };
});