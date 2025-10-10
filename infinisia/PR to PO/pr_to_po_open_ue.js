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
        var PO_lines = []
        var vendorID, currencySet;
        if (context.request) {
          if (context.request.parameters) {
            vendorID = context.request.parameters.vendorID;
            currencySet = context.request.parameters.currencySet;
            var POlinesStr = context.request.parameters.PO_lines;
            var allIdSummary = JSON.parse(POlinesStr); 
            var itemIds = [];
            var unitNames = [];
            log.debug('allIdSummary', allIdSummary);
              var prToPO = search.load({
                  id: "customsearch1094",
              });
          
              prToPO.filters.push(
                  search.createFilter({
                      name: "internalid",
                      join: "custrecord_iss_pr_parent", 
                      operator: search.Operator.ANYOF, 
                      values: allIdSummary, 
                  })
              );
              
              var prToPOSet = prToPO.run();
              var prToPO = prToPOSet.getRange(0, 300);
              log.debug('prToPO.length', prToPO.length); 
              if(prToPO.length > 0) {
                for (let i = 0; i < prToPO.length; i++) {

                  let itemName = prToPO[i].getText({
                    name: prToPOSet.columns[0],
                  });
                  let itemID = prToPO[i].getValue({
                    name: prToPOSet.columns[0],
                  });
                  let vendorName = prToPO[i].getValue({
                    name: prToPOSet.columns[1],
                  });
                  let currentStock = prToPO[i].getValue({
                    name: prToPOSet.columns[2],
                  });
                  let incomingStock = prToPO[i].getValue({
                    name: prToPOSet.columns[3],
                  });
                  let salesRep = prToPO[i].getText({
                    name: prToPOSet.columns[4],
                  });
                  let salesRepID = prToPO[i].getValue({
                    name: prToPOSet.columns[4],
                  });
                  let customerName = prToPO[i].getText({
                    name: prToPOSet.columns[26],
                  });
                  let customerID = prToPO[i].getValue({
                    name: prToPOSet.columns[26],
                  });
                  let forecastBusdev = prToPO[i].getValue({
                    name: prToPOSet.columns[6],
                  });
                  let forecastPerhitungan = prToPO[i].getValue({
                    name: prToPOSet.columns[7],
                  });
                  let avgBusdev = prToPO[i].getValue({
                    name: prToPOSet.columns[8],
                  });
                  let note = prToPO[i].getValue({
                    name: prToPOSet.columns[9],
                  });
                  let internalIDPR = prToPO[i].getValue({
                    name: prToPOSet.columns[10],
                  });
                  let docNumber = prToPO[i].getValue({
                    name: prToPOSet.columns[17],
                  });
                  let osPO = prToPO[i].getValue({
                    name: prToPOSet.columns[11],
                  });
                  let cek2 = prToPO[i].getValue({
                    name: prToPOSet.columns[14],
                  });
                  let leadTimeKirim = prToPO[i].getValue({
                    name: prToPOSet.columns[15],
                  });
                  let units = prToPO[i].getValue({
                    name: prToPOSet.columns[16],
                  });
                  
                  let soNO = prToPO[i].getValue({
                    name: prToPOSet.columns[18],
                  });
                  let taxItemRate = prToPO[i].getValue({
                    name: prToPOSet.columns[20],
                  });
                  let tanggalKirim = prToPO[i].getValue({
                    name: prToPOSet.columns[21],
                  });
                  let packSize = prToPO[i].getValue({
                    name: prToPOSet.columns[22],
                  });
                  let packSizeText = prToPO[i].getText({
                    name: prToPOSet.columns[22],
                  });
                  let soNumber = prToPO[i].getValue({
                    name: prToPOSet.columns[18],
                  });
                  let soNumberText = prToPO[i].getText({
                    name: prToPOSet.columns[18],
                  });
                  let qtyPO = prToPO[i].getValue({
                    name: prToPOSet.columns[26],
                  })
                  let lineId = prToPO[i].getValue({
                    name : prToPOSet.columns[28]
                  })
                  let currency = prToPO[i].getValue({
                    name : prToPOSet.columns[30]
                  })
                  let idSum = prToPO[i].getValue({
                    name : prToPOSet.columns[31]
                  });
                  let poCust = prToPO[i].getValue({
                    name : prToPOSet.columns[33]
                  });
                  var ratePackSIze = 0
                  let ratePackSIzeInteger = prToPO[i].getValue({
                    name : prToPOSet.columns[36]
                  }) || 0;
                  log.debug('ratePackSIzeInteger', ratePackSIzeInteger)
                  let ratePackSizeDecimal = prToPO[i].getValue({
                    name : prToPOSet.columns[41]
                  }) || 0;
                  log.debug('ratePackSizeDecimal', ratePackSizeDecimal)
                  if(ratePackSIzeInteger > 0){
                    ratePackSIze = ratePackSIzeInteger
                  }else{
                    ratePackSIze = ratePackSizeDecimal
                  }
                  var cekTotalPackaging = prToPO[i].getValue({
                    name : prToPOSet.columns[34]
                  }) || 0;
                  var idPrSUm = prToPO[i].getValue({
                    name : prToPOSet.columns[38]
                  }) || 0;
                  log.debug('unitNames', unitNames)
                  if (itemID) itemIds.push(itemID);
                  if (packSizeText) unitNames.push(packSizeText);
                  var totalPackaging = Math.abs(parseFloat(cekTotalPackaging || 0)) - parseFloat(qtyPO || 0) 
                  var setTotalOrder = Number(totalPackaging) * Number(ratePackSIze)
                  PO_lines.push({
                    salesRepID : salesRepID,
                    customerID : customerID,
                    incomingStock : incomingStock,
                    currentStock : currentStock,
                    quantity : setTotalOrder,
                    osPO : osPO,
                    forecastBusdev : forecastBusdev,
                    forecastPerhitungan : forecastPerhitungan,
                    avgBusdev : avgBusdev,
                    units : units,
                    leadTimeKirim : leadTimeKirim,
                    itemRate : itemRate,
                    taxItem : taxItem,
                    soNO : soNO,
                    taxItemRate : taxItemRate,
                    packSize : packSize,
                    soNumber : soNumber,
                    internalIDPR : internalIDPR,
                    totalOrder : setTotalOrder,
                    totalPackaging : totalPackaging,
                    poCust : poCust,
                    lineId : lineId,
                    packSizeText : packSizeText,
                    ratePackSIze : ratePackSIze,
                    itemID : itemID,
                    tanggalKirim : tanggalKirim
                  })
                }
              }
            
          }
        }
        itemIds = [...new Set(itemIds)];
        unitNames = [...new Set(unitNames)];
        var itemData = {};
        search
          .create({
            type: "item",
            filters: [["internalid", "anyof", itemIds]],
            columns: ["internalid", "lastpurchaseprice"],
          })
          .run()
          .each((result) => {
            itemData[result.id] = {
              lastPurchasePrice: result.getValue({ name: "lastpurchaseprice" }),
            };
            return true;
          });

       
          log.debug('itemData', itemData);
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
          log.debug('PO_lines', PO_lines)
          for (var i in PO_lines) {
            var POLine = PO_lines[i];
            var poItem = POLine.itemID;
            function convertToDate(dateString) {
              var parts = dateString.split("/");
              var day = parseInt(parts[0], 10);
              var month = parseInt(parts[1], 10) - 1; 
              var year = parseInt(parts[2], 10);
              return new Date(year, month, day);
            }
            var poTanggalKirim = POLine.tanggalKirim;
            var poSalesRep = POLine.salesRepID;
            var poCustomerID = POLine.customerID;
            var incomingStock = POLine.incomingStock;
            var currentStock = POLine.currentStock;
            var quantity = POLine.quantity;
            var osPO = POLine.osPO;
            var forecastBusdev = POLine.forecastBusdev;
            var forecastPerhitungan = POLine.forecastPerhitungan;
            var avgBusdev = POLine.avgBusdev;
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
            var ratePackSIzeSet = POLine.ratePackSIze
            arrayPR.push(internalIDPR);
            if (poItem) {
              var lastPurchase = itemData[poItem]?.lastPurchasePrice || 0;
              log.debug('lastPurchase', lastPurchase)
              poData.insertLine({
                sublistId: "item",
                line: line_idx,
              });
              var ratePerPackSize = Number(lastPurchase) / Number(exchangerate) * Number(ratePackSIzeSet)
              var ratePerKG = Number(lastPurchase) / Number(exchangerate)
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
              // poData.setSublistValue({
              //   sublistId: "item",
              //   fieldId: "custcol11",
              //   line: line_idx,
              //   value: avgAccounting,
              // });
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
              if (poTanggalKirim) {
                poData.setSublistValue({
                  sublistId: "item",
                  fieldId: "custcol14",
                  line: line_idx,
                  value: poTanggalKirim,
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
                fieldId: "custcol_abj_pack_size_order",
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
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_rate_units_decimal",
                line: line_idx,
                value: ratePackSIzeSet,
              });
             
              
              let positivePackaging = Math.abs(totalPackaging);
              var amount = Number(ratePerPackSize) * Number(positivePackaging)
              // log.debug('positivePackaging', positivePackaging)
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: line_idx,
                value: positivePackaging,
              });
              
              
              // log.debug('totalOrder', totalOrder);
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_pr_total_order",
                line: line_idx,
                value: totalOrder,
              });
              // log.debug('lastPurchase', lastPurchase)
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
