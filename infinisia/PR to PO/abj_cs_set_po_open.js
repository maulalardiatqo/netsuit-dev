/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
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
    function pageInit(context) {
        try {
            const currentRecord = context.currentRecord;
            
            const cekTrigger = currentRecord.getValue("custbody_abj_trigger_client");
            if (cekTrigger) {
                var cekCustomForm = currentRecord.getValue("customform");
                log.debug('cekCustomForm', cekCustomForm)
                if(cekCustomForm != 104){
                    currentRecord.setValue({
                        fieldId: "customform",
                        value: 104,
                    });
                }else{
                    const allId = currentRecord.getValue("custbody_abj_all_id_pr_sum");
                    const currencyId = currentRecord.getValue("currency");
                    if (allId) {
                        setSublist(allId, currencyId);
                        
                    }
                }
                
                
            }
        } catch (error) {
            log.error("Error in pageInit", error);
        }
    }
    function setSublist(allId, currency){
        try{
            var poData = currentRecord.get();
        let allIdSummary = allId.split(',').map(item => item.trim());
        var PO_lines = []
        log.debug('allIdSummary Array', allIdSummary);
        var prToPO = search.load({
            id: "customsearch1021",
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
                let avgAccounting = prToPO[i].getValue({
                name: prToPOSet.columns[9],
                });
                let note = prToPO[i].getValue({
                name: prToPOSet.columns[10],
                });
                let internalIDPR = prToPO[i].getValue({
                name: prToPOSet.columns[11],
                });
                let docNumber = prToPO[i].getValue({
                name: prToPOSet.columns[18],
                });
                let osPO = prToPO[i].getValue({
                name: prToPOSet.columns[12],
                });
                let cek2 = prToPO[i].getValue({
                name: prToPOSet.columns[15],
                });
                let leadTimeKirim = prToPO[i].getValue({
                name: prToPOSet.columns[16],
                });
                let units = prToPO[i].getValue({
                name: prToPOSet.columns[17],
                });
                
                let soNO = prToPO[i].getValue({
                name: prToPOSet.columns[19],
                });
                let taxItemRate = prToPO[i].getValue({
                name: prToPOSet.columns[21],
                });
                let tanggalKirim = prToPO[i].getValue({
                name: prToPOSet.columns[22],
                });
                let packSize = prToPO[i].getValue({
                name: prToPOSet.columns[23],
                });
                let packSizeText = prToPO[i].getText({
                name: prToPOSet.columns[23],
                });
                let soNumber = prToPO[i].getValue({
                name: prToPOSet.columns[19],
                });
                let soNumberText = prToPO[i].getText({
                name: prToPOSet.columns[19],
                });
                let qtyPO = prToPO[i].getValue({
                name: prToPOSet.columns[27],
                })
                let lineId = prToPO[i].getValue({
                name : prToPOSet.columns[29]
                })
                let currency = prToPO[i].getValue({
                name : prToPOSet.columns[31]
                })
                let idSum = prToPO[i].getValue({
                name : prToPOSet.columns[32]
                });
                let poCust = prToPO[i].getValue({
                name : prToPOSet.columns[34]
                });
                let ratePackSIze = prToPO[i].getValue({
                name : prToPOSet.columns[37]
                }) || 0;
                var cekTotalPackaging = prToPO[i].getValue({
                name : prToPOSet.columns[35]
                }) || 0;
                var idPrSUm = prToPO[i].getValue({
                name : prToPOSet.columns[39]
                }) || 0;
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
                    avgAccounting : avgAccounting,
                    units : units,
                    leadTimeKirim : leadTimeKirim,
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
        var exchangerate = 0
          if(currency){
            var currencySearchObj = search.create({
              type: "currency",
              filters:
              [
                  ["internalid","anyof",currency]
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
        }
        var line_idx = 0;
        var arrayPR = [];
          log.debug('PO_lines', PO_lines)
          log.debug('PoLineLength', PO_lines.length)
          log.debug('PO_lines', PO_lines);

            PO_lines.forEach((POLine) => {
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
                var avgAccounting = POLine.avgAccounting;
                var units = POLine.units;
                var leadTimeKirim = POLine.leadTimeKirim;
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
                    var lastPurchase = 0;
            
                    // Fetch last purchase price
                    var itemSearchObj = search.create({
                        type: "item",
                        filters: [["internalid", "anyof", poItem]],
                        columns: [search.createColumn({ name: "lastpurchaseprice", label: "Last Purchase Price" })],
                    });
            
                    var searchResult = itemSearchObj.run().getRange({ start: 0, end: 1 });
            
                    if (searchResult.length > 0) {
                        var lastPurchasePrice = searchResult[0].getValue({ name: "lastpurchaseprice" });
                        if (lastPurchasePrice) lastPurchase = Number(lastPurchasePrice);
                    }
            
                    // Fetch unit conversion rate
                    var rateUnit = 1;
                    var unitstypeSearchObj = search.create({
                        type: "unitstype",
                        filters: [["unitname", "is", packSizeText]],
                        columns: [search.createColumn({ name: "conversionrate", label: "Rate" })],
                    });
            
                    var searchResultUnit = unitstypeSearchObj.run().getRange({ start: 0, end: 1 });
            
                    if (searchResultUnit.length > 0) {
                        var rUnit = searchResultUnit[0].getValue({ name: "conversionrate" });
                        if (rUnit) rateUnit = Number(rUnit);
                    }
            
                    // Calculate rates
                    log.debug('rateUnit', rateUnit);
                    var ratePerPackSize = (lastPurchase / Number(exchangerate)) * rateUnit;
                    var ratePerKG = lastPurchase / Number(exchangerate);
            
                    log.debug('ratePerPackSize', ratePerPackSize);
                    log.debug('ratePerKG', ratePerKG);
            
                    // Select new line in sublist for the current PO line
                    poData.selectNewLine({ sublistId: "item" });
                    // Set values for the current line
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: poItem });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_pr_number", value: internalIDPR });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_onhand", value: currentStock });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_msa_id_line_from_pr", value: lineId });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol5", value: incomingStock });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol9", value: forecastBusdev });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol8", value: leadTimeKirim });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_pr_rumus_perhitungan", value: forecastPerhitungan });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol10", value: avgBusdev });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol11", value: avgAccounting });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol6", value: osPO });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "customer", value: poCustomerID });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_customer_line", value: poCustomerID });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_no_so", value: soNO });
            
                    if (poTanggalKirim) {
                        log.debug('Processing poTanggalKirim', poTanggalKirim);
                        poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol14", value:poTanggalKirim });
                    }
            
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_sales_rep_line", value: poSalesRep });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_pack_size_order", value: poPackSize });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_sales_order_number", value: poSoNumber });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_po_customer", value: poCust });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "unit", value: units });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_ratepacksize", value: ratePackSIzeSet });
                    let positivePackaging = Math.abs(totalPackaging);
                    var amount = ratePerPackSize * positivePackaging;
            
                    log.debug('positivePackaging', positivePackaging);
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "quantity", value: positivePackaging });
            
                    log.debug('totalOrder', totalOrder);
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_pr_total_order", value: totalOrder });
            
                    log.debug('lastPurchase', lastPurchase);
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: ratePerPackSize });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_purchase_price_per_kg", value: ratePerKG });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "amount", value: amount });
                    poData.setCurrentSublistValue({ sublistId: "item", fieldId: "taxcode", value: 5 });
                    
                    try {
                        poData.commitLine({ sublistId: "item" });
                        log.debug('Line committed successfully');
                    } catch (e) {
                        log.error('Commit line failed', e);
                    }
                }
            })
          

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
        }catch(e){
            log.debug('error', e)
        }
        
    }
    return {
        pageInit: pageInit
    };
});
