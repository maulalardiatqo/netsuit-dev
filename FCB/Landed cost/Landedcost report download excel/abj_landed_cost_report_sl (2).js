/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
  function onRequest(context) {
    var contextRequest = context.request;
    if (contextRequest.method === "GET") {
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
        type: serverWidget.FieldType.DATE,
        label: 'START',
        container: 'periodoption',
      });
      

      var periodFilterEnd = form.addField({
        id: 'custpage_accounting_period_to',
        type: serverWidget.FieldType.DATE,
        label: 'END',
        container: 'periodoption',
      });

      form.addSubmitButton({
        label: "Generate Download",
      });
      context.response.writePage(form);

    } else {
      var goodReceiptNo = contextRequest.parameters.custpage_good_receipt_no
      var filtCreditorName = contextRequest.parameters.custpage_creditor_name
      var periodFrom = contextRequest.parameters.custpage_accounting_period_from;
      var periodTo = contextRequest.parameters.custpage_accounting_period_to;
      try {
       

        var listData = []
        if (filtCreditorName) {

          var recCreditorName = record.load({
            type: "vendor",
            id: filtCreditorName
          });
          var filterCreditorName = recCreditorName.getValue({
            fieldId: 'legalname'
          });
        }
        var info = config.load({
          type: config.Type.COMPANY_INFORMATION
        });
        var baseCurrency = search.lookupFields({
          type: search.Type.CURRENCY,
          id: info.getValue("basecurrency"),
          columns: ["name"]
        }).name;

        var dataLandedCost = search.load({
          id: "customsearch_abj_landedcost_report"
        });
        if (periodFrom && periodTo) {
          dataLandedCost.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORAFTER,
              values: periodFrom,
            })
          );
          dataLandedCost.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORBEFORE,
              values: periodTo,
            })
          );
        }
        
        var dataLandedCostSet = dataLandedCost.run();
        dataLandedCost = dataLandedCostSet.getRange(0, 999);
        dataLandedCost.forEach(function(row) {
          var GrNumb = row.getValue({
            name: dataLandedCostSet.columns[0]
          });
          var grNumbText = row.getText({
            name: dataLandedCostSet.columns[0]
          });
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
          var materialSurcharge = row.getValue({
            name: dataLandedCostSet.columns[28]
          });
          log.debug('materialSurcharge', materialSurcharge)
          var packingMaterials = row.getValue({
            name: dataLandedCostSet.columns[29]
          });
          log.debug('packingMaterials', packingMaterials)
          var plusMYR2 = Number(totalMyr1) + Number(totalLandedCost);
          var costperUnit = Number(plusMYR2) / Number(qty);

          var convText = GrNumb.toString();
          var GrnumbString = convText.split(/[<|>]/)[2];
          var parts = GrNumb.split('"');
          var recid = parts[1].substring(parts[1].indexOf('=') + 1);
          if (goodReceiptNo != "" || filtCreditorName != "") {
            if (goodReceiptNo == GrnumbString || filterCreditorName == creditorName) {
              listData.push({
                recid: recid,
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
                baseCurrency: baseCurrency,
                materialSurcharge : materialSurcharge,
                packingMaterials: packingMaterials,
              });
            }
          } else {
            listData.push({
              recid: recid,
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
              baseCurrency: baseCurrency,
              materialSurcharge : materialSurcharge,
              packingMaterials: packingMaterials,
            });
          }

        });
        
        if (listData.length <= 0) {
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
        } else {
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
            "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='100' />" +
            "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='100' />" +
            "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='130' />" +
            "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='100' />" +
            "<Column ss:Index='26' ss:AutoFitWidth='0' ss:Width='170' />" +
            // "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='100' />" +
            "<Column ss:Index='27' ss:AutoFitWidth='0' ss:Width='170' />" +
            "<Column ss:Index='28' ss:AutoFitWidth='0' ss:Width='100' />" +
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
            '<Cell ss:StyleID="BC"><Data ss:Type="String">Material Surcharge</Data></Cell>' +
            '<Cell ss:StyleID="BC"><Data ss:Type="String">Packing Materials</Data></Cell>' +
            '<Cell ss:StyleID="BC"><Data ss:Type="String">Total(Landed Cost)</Data></Cell>' +
            '<Cell ss:StyleID="BC"><Data ss:Type="String">Total Landed Cost Pershipment</Data></Cell>' +
            // '<Cell ss:StyleID="BC"><Data ss:Type="String">Total (MYR)</Data></Cell>' +
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
          var materialSurchargeTemp = 0;
          var packingMaterialsTemp = 0;
          var totalLandCostTemp = 0;
          var totalMYR2Temp = 0;
          var cetakSubTotal = false;
          var subtotalFreightCharges = 0;
          var subtotalMYR = 0;
          var subtotalMarineInsurances = 0;

          function compare(a, b) {
            if (a.inbounNoText === "- None -") {
              return 1;
            }
            if (b.inbounNoText === "- None -") {
              return -1;
            }
            if (a.inbounNoText < b.inbounNoText) {
              return -1;
            }
            if (a.inbounNoText > b.inbounNoText) {
              return 1;
            }
            return 0;
          }
          listData.sort(compare);
          var resulttoCount = {};

          listData.forEach(function(data) {
            var inboundText = data.inbounNoText;
            var freight_charges = Number(data.freightCharges);
            var totalMYRtoCOunt = Number(data.totalMyr1);
            var marineIsurance = Number(data.marineIsurance);

            if (resulttoCount.hasOwnProperty(inboundText)) {
              resulttoCount[inboundText].subtotalFreightChargesToCount += freight_charges;
              resulttoCount[inboundText].subtotalMYRtoCount += totalMYRtoCOunt;
              resulttoCount[inboundText].subtotalMarineInsurances += marineIsurance
            } else {
              resulttoCount[inboundText] = {
                inboundText: inboundText,
                subtotalFreightChargesToCount: freight_charges,
                subtotalMYRtoCount: totalMYRtoCOunt,
                subtotalMarineInsurances : subtotalMarineInsurances
              };
            }
          });
          var resultArray = Object.values(resulttoCount);
          log.debug('resultArray', resultArray);

          listData.forEach((data, index) => {
            var recid = data.recid;
            var itemReceiptFields = search.lookupFields({
              type: 'itemreceipt',
              id: recid,
              columns: ['currency', 'trandate', 'tranid']
            });

            var trandate = itemReceiptFields.trandate;
            if (trandate) {
              var parsedDate = format.parse({
                value: trandate,
                type: format.Type.DATE
              });
            } else {
              new Date(today.getFullYear(), today.getMonth(), today.getDate());
            }

            var tranid = itemReceiptFields.tranid;

            function sysDate() {
              var date = parsedDate;
              var tdate = date.getUTCDate();
              var month = date.getUTCMonth() + 1; 
              var year = date.getUTCFullYear();

              return month + '/' + tdate + '/' + year;
            }
            var inBoundNoText = data.inbounNoText
            var myrToCounts = data.totalMyr1;
            var myrToCount = Number(myrToCounts);
            var freight_chargestCount = 0;
            var totalFreightCharges = 0; 
            var totalMYRtoCount = 0;
            var subtotalMarineInsurancesCount = 0
            resultArray.forEach(function(result) {
              if (result.inboundText === data.inbounNoText) {
                totalFreightCharges = result.subtotalFreightChargesToCount;
                totalMYRtoCount = result.subtotalMYRtoCount;
                subtotalMarineInsurancesCount = result.subtotalMarineInsurances;
              }
            });
            log.debug('count', {
              inBoundNoText : inBoundNoText,
              totalFreightCharges : totalFreightCharges,
              totalMYRtoCount : totalMYRtoCount,
              myrToCount : myrToCount,
              subtotalMarineInsurancesCount : subtotalMarineInsurancesCount
            })
            freight_chargestCount = Number(totalFreightCharges) * (Number(myrToCount) / Number(totalMYRtoCount));
            marine_insurances = Number(subtotalMarineInsurancesCount) * (Number(myrToCount) / Number(totalMYRtoCount));
           
            var exchange = data.exchangeRate
            var currencyGR = data.currenc;
            var custDuties = data.customDuties
            var dataFreightCharges = data.freightCharges
            var dataMarine = data.marineIsurance
            var dataHandlingCharges = data.handlingCharges
            var dataForwardingCharges = data.forwardingCharges
            var dataMaterialSurcharge = data.materialSurcharge
            var dataPackingMaterials = data.packingMaterials
            var dataMYR1 = data.totalMyr1
            var quantity = data.qty
            var baseCurrency = data.baseCurrency
            log.debug('details', {inBoundNoText : inBoundNoText, dataMYR1: dataMYR1, custDuties : custDuties, dataFreightCharges : dataFreightCharges});

            var inbound = data.inbounNoText;
            if (currencyGR != baseCurrency) {
              var exchangeCustduties = custDuties * exchange;
              var exchangeFreight = dataFreightCharges * exchange;
              var exchangeMarine = dataMarine * exchange;
              var exchangeHandling = dataHandlingCharges * exchange;
              var exchangeForward = dataForwardingCharges * exchange;
              var exchangeMaterialSurcharge = dataMaterialSurcharge * exchange;
              var exchangePackingMaterials = dataPackingMaterials * exchange;
            } else {
              var exchangeCustduties = custDuties / exchange;
              var exchangeFreight = dataFreightCharges / exchange;
              var exchangeMarine = dataMarine / exchange;
              var exchangeHandling = dataHandlingCharges / exchange;
              var exchangeForward = dataForwardingCharges / exchange;
              var exchangeMaterialSurcharge = dataMaterialSurcharge / exchange;
              var exchangePackingMaterials = dataPackingMaterials / exchange;
            }
            var exchangeTotalLc = exchangeCustduties + exchangeFreight + exchangeMarine + exchangeHandling + exchangeForward + exchangeMaterialSurcharge + exchangePackingMaterials;
            exchangeTotalLc = Number(exchangeTotalLc);
            var LandedCostTotal = Number(dataMYR1) + exchangeTotalLc
            var costperunt = LandedCostTotal / quantity
            // log.debug('costperunit', costperunt);
            if (tempinbound == data.inbounNoText) {
              subtotaltemp = subtotaltemp + Number(data.subTotal)
              custDutiesTemp = custDutiesTemp + Number(exchangeCustduties)
              fchargTemp = fchargTemp + Number(exchangeFreight)
              mInsuranceTemp = mInsuranceTemp + Number(exchangeMarine)
              hChargeTemp = hChargeTemp + Number(exchangeHandling)
              ForwardChargeTemp += Number(exchangeForward)
              materialSurchargeTemp += Number(exchangeMaterialSurcharge)
              packingMaterialsTemp += Number(exchangePackingMaterials)
              totalLandCostTemp = totalLandCostTemp + Number(exchangeTotalLc)
              totalMYR2Temp = totalMYR2Temp + Number(LandedCostTotal);
              totalMYR1Temp = totalMYR1Temp + Number(data.totalMyr1)
            } else {
              subtotaltemp = Number(data.subTotal)
              custDutiesTemp = Number(exchangeCustduties)
              fchargTemp = Number(exchangeFreight)
              mInsuranceTemp = Number(exchangeMarine)
              hChargeTemp = Number(exchangeHandling)
              ForwardChargeTemp = Number(exchangeForward)
              materialSurchargeTemp = Number(exchangeMaterialSurcharge)
              packingMaterialsTemp = Number(exchangePackingMaterials)
              totalLandCostTemp = Number(exchangeTotalLc)
              totalMYR2Temp = Number(LandedCostTotal);
              totalMYR1Temp = Number(data.totalMyr1)
            }

            if (index < listData.length - 1) {
              if (listData[index].inbounNoText != listData[index + 1].inbounNoText) {
                cetakSubTotal = true;
              } else {
                cetakSubTotal = false;
              }
            } else {
              if (data.inbounNoText !== "- None -") {
                cetakSubTotal = true;
              } else {
                cetakSubTotal = false;
              }
            }
            var tranNo = tranid.includes('GR') ? tranid : data.GrNumb;
            if (tranNo == 'GR230007_1') {
              log.debug({
                fchargTemp: fchargTemp,
                totalMYR: data.totalMyr1,
                totalMYR1Temp: totalMYR1Temp
              });
            }
            tempinbound = data.inbounNoText
            if (tranNo == 'GR230007_1') {
              log.debug({
                fchargTemp: fchargTemp,
                totalMYR: data.totalMyr1,
                totalMYR1Temp: totalMYR1Temp
              });
            }

            // var exchangeFreight = (parseFloat(fchargTemp) * (parseFloat(data.totalMyr1) / parseFloat(totalMYR1Temp))) || 0;
            // log.debug('totalMYR2Temp', totalMYR2Temp);
            xmlStr +=
              "<Row>" +
              '<Cell ss:StyleID="NB"><Data ss:Type="String">' + tranNo + '</Data></Cell>' +
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
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeCustduties + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeFreight + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeMarine + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeHandling + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeForward + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeMaterialSurcharge + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangePackingMaterials + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + exchangeTotalLc + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
              // '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + LandedCostTotal + '</Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
              '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + costperunt + '</Data></Cell>' +
              "</Row>";

            if (cetakSubTotal) {
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
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + subtotaltemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalMYR1Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalMYR1Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + custDutiesTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + fchargTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + mInsuranceTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + hChargeTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + ForwardChargeTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + materialSurchargeTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + packingMaterialsTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalLandCostTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalLandCostTemp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                // '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalMYR2Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
                '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalMYR2Temp.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</Data></Cell>' +
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
      } catch (e) {
        log.debug("error in get report", e.name + ": " + e.message);
      }
    }

  }
  return {
    onRequest: onRequest,
  };
});