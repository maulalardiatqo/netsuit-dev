/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
  
  function beforeLoad(context) {
    function remove_duplicates_in_list(arr) {
      var uniques = [];
      var itemsFound = {};
      for (var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if (itemsFound[stringified]) {
          continue;
        }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
      }
      return uniques;
    }
    try {
      if (context.type == context.UserEventType.CREATE) {
        var poData = context.newRecord;
        var PO_lines, vendorID, currencySet;
        if (context.request) {
          if (context.request.parameters) {
            vendorID = context.request.parameters.vendorID;
            currencySet = context.request.parameters.currencySet;
            var POlinesStr = context.request.parameters.PO_lines;
            PO_lines = JSON.parse(POlinesStr);
          }
        }
        if (vendorID) {
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
          var exchangerate = 0
          if(currencySet){
            var currencySearchObj = search.create({
              type: "currency",
              filters:
              [
                  ["internalid","anyof",currencySet]
              ],
              columns:
              [
                  search.createColumn({name: "name", label: "Name"}),
                  search.createColumn({name: "exchangerate", label: "Exchange Rate"})
              ]
            });
            var searchResultCurr = currencySearchObj.run().getRange({start: 0, end: 1});
            if (searchResultCurr.length > 0) {
              var exc = searchResultCurr[0].getValue({name: "exchangerate"});
              if(exc){
                exchangerate = exc
              }
            } 
            poData.setValue({
              fieldId: "currency",
              value: currencySet,
            });
          }
          log.debug('exchangerate', exchangerate)
          var currentEmployee = runtime.getCurrentUser();
          poData.setValue({
            fieldId: "employee",
            value: currentEmployee.id,
          });
          poData.setValue({
            fieldId: "custbody_convert_from_pr",
            value: true,
          });

          var today = new Date();
          poData.setValue({
            fieldId: "trandate",
            value: today,
          });
          poData.setValue({
            fieldId: "entity",
            value: vendorID,
          });
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
          var line_idx = 0;
          var arrayPR = [];
          for (var i in PO_lines) {
            var POLine = PO_lines[i];
            var poItem = POLine.itemID;
            var poTanggalKirim = POLine.tanggalKirim;
            var dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (typeof poTanggalKirim === 'string' && dateRegex.test(poTanggalKirim)) {
                poTanggalKirim = convertToDate(poTanggalKirim);
            }
            
            
            function convertToDate(dateString) {
                var parts = dateString.split("/");
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1; 
                var year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
            var poSalesRep = POLine.salesRepID;
            var poCustomerID = POLine.customerID;
            var incomingStock = POLine.incomingStock;
            var currentStock = POLine.currentStock;
            var quantity = POLine.quantity;
            var osPO = POLine.osPO;
            var forecastBusdev = POLine.forecastBusdev;
            var forecastPerhitungan = POLine.forecastPerhitungan;
            var avgBusdev = POLine.avgBusdev;
            var avgAccounting = POLine.avgAccounting;
            var units = POLine.units;
            var leadTimeKirim = POLine.leadTimeKirim;
            var itemRate = POLine.itemRate;
            var taxItem = POLine.taxItem;
            var soNO = POLine.soNO;
            var taxItemRate = POLine.taxItemRate;
            var poPackSize = POLine.packSize;
            var poSoNumber = POLine.soNumber;
            var internalIDPR = POLine.internalIDPR;
            var totalOrder = POLine.totalOrder;
            var totalPackaging = POLine.totalPackaging
            var poCust = POLine.poCust
            var lineId = POLine.lineId
            var packSizeText = POLine.packSizeText
            arrayPR.push(internalIDPR);
            if (poItem) {
              var lastPurchase = 0
              poData.insertLine({
                sublistId: "item",
                line: line_idx,
              });
              var itemSearchObj = search.create({
                type: "item",
                filters: [
                    ["internalid", "anyof", poItem]
                ],
                columns: [
                    search.createColumn({name: "lastpurchaseprice", label: "Last Purchase Price"})
                ]
              });
              
              var searchResult = itemSearchObj.run().getRange({start: 0, end: 1});
              
              if (searchResult.length > 0) {
                  var lastPurchasePrice = searchResult[0].getValue({name: "lastpurchaseprice"});
                  if(lastPurchasePrice){
                    lastPurchase = lastPurchasePrice
                  }
              } 
              var rateUnit = 1
              var unitstypeSearchObj = search.create({
                type: "unitstype",
                filters:
                [
                    ["unitname","is",packSizeText]
                ],
                columns:
                [
                    search.createColumn({name: "conversionrate", label: "Rate"})
                ]
              });
              var searchResultUnit = unitstypeSearchObj.run().getRange({start: 0, end: 1});
              
              if (searchResultUnit.length > 0) {
                  var rUnit = searchResultUnit[0].getValue({name: "conversionrate"});
                  if(rUnit){
                    rateUnit = rUnit
                  }
              } 
              log.debug('rateUnit', rateUnit)
              var ratePerPackSize = Number(lastPurchase) / Number(exchangerate) * Number(rateUnit)
              log.debug('ratePerPackSize', ratePerPackSize)
              var ratePerKG = Number(lastPurchase) / Number(exchangerate)
              log.debug('ratePerKG', ratePerKG)
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: line_idx,
                value: poItem,
              });
               poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_pr_number",
                line: line_idx,
                value: internalIDPR,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_onhand",
                line: line_idx,
                value: currentStock,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_msa_id_line_from_pr",
                line: line_idx,
                value: lineId,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol5",
                line: line_idx,
                value: incomingStock,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol9",
                line: line_idx,
                value: forecastBusdev,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol8",
                line: line_idx,
                value: leadTimeKirim,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_pr_rumus_perhitungan",
                line: line_idx,
                value: forecastPerhitungan,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol10",
                line: line_idx,
                value: avgBusdev,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol11",
                line: line_idx,
                value: avgAccounting,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol6",
                line: line_idx,
                value: osPO,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "customer",
                line: line_idx,
                value: poCustomerID,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_customer_line",
                line: line_idx,
                value: poCustomerID,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_no_so",
                line: line_idx,
                value: soNO,
              });
              if (poTanggalKirim != " ") {
                poData.setSublistValue({
                  sublistId: "item",
                  fieldId: "custcol14",
                  line: line_idx,
                  value: new Date(poTanggalKirim),
                });
              }
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_sales_rep_line",
                line: line_idx,
                value: poSalesRep,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "units",
                line: line_idx,
                value: poPackSize,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_sales_order_number",
                line: line_idx,
                value: poSoNumber,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_po_customer",
                line: line_idx,
                value: poCust,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "unit",
                line: line_idx,
                value: units,
              });
             
              
              let positivePackaging = Math.abs(totalPackaging);
              var amount = Number(ratePerPackSize) * Number(positivePackaging)
              log.debug('positivePackaging', positivePackaging)
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: line_idx,
                value: positivePackaging,
              });
              
              
              log.debug('totalOrder', totalOrder);
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_pr_total_order",
                line: line_idx,
                value: totalOrder,
              });
              log.debug('lastPurchase', lastPurchase)
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                line: line_idx,
                value: ratePerPackSize,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_purchase_price_per_kg",
                line: line_idx,
                value: ratePerKG,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: line_idx,
                value: amount,
              });
              line_idx++;
            }
          }

          arrayPR = remove_duplicates_in_list(arrayPR);
          poData.setValue({
            fieldId: "custbody_convert_from_prid",
            value: arrayPR,
          });
          var dataTerakhir = arrayPR[arrayPR.length - 1];
            poData.setValue({
              fieldId: "custbody_abj_pr_number",
              value: dataTerakhir,
          });
       
          
        }
      }
    } catch (e) {
      log.debug("Error in before load", e.name + " : " + e.message);
    }
  }

  function beforeSubmit(context) {
    if (context.type == context.UserEventType.CREATE) {
      var dataRec = context.newRecord;
      var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
      if (isConvertPR) {
        dataRec.setValue({
          fieldId: "customform",
          value: 104,
          ignoreFieldChange: true,
        });
      }
    }
   
  }


  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
  };
});
