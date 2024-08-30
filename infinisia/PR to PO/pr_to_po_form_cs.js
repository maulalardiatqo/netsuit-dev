/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/search", "N/currentRecord", "N/query", "N/record", "N/format", "N/ui/dialog", "N/runtime", "N/ui/message", "N/url"], function (search, currentRecord, query, record, format, dialog, runtime, message, url) {
  var exports = {};
  var recordCurrent = currentRecord.get();

  function getAllResults(s) {
    var results = s.run();
    var searchResults = [];
    var searchid = 0;
    do {
      var resultslice = results.getRange({
        start: searchid,
        end: searchid + 1000,
      });
      resultslice.forEach(function (slice) {
        searchResults.push(slice);
        searchid++;
      });
    } while (resultslice.length >= 1000);
    return searchResults;
  }

  function pdfPrintURL() {}

  function pageInit(scriptContext) {}

  function prToPO(context) {
    var records = currentRecord.get();
    try {
      var dataLine = [];
      var count = records.getLineCount({
        sublistId: "custpage_sublist_item",
      });
      var vendorID = records.getValue("custpage_vendor");
      var employyeId = records.getValue("employee")
      var currencySet = ""
      console.log("count", count);
      if (vendorID) {
        for (var j = 0; j < count; j++) {
          var selected = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_select",
            line: j,
          });
          if (selected) {
            var itemID = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_item_internalid",
              line: j,
            });
            var currentStock = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_current_stock",
              line: j,
            });
            var incomingStock = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_incoming_stock",
              line: j,
            });
            var osPO = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_os_po",
              line: j,
            });
            var tanggalKirim = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_tanggal_kirim",
              line: j,
            });
            var quantity = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_total_order",
              line: j,
            });
            var quantityPO = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_qty_po",
              line: j,
            });
            var salesRepID = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_salesrep_internalid",
              line: j,
            });
            var customerID = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_customer_internalid",
              line: j,
            });
            var forecastBusdev = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_forecast_busdev",
              line: j,
            });
            var forecastPerhitungan = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_forecast_perhitungan",
              line: j,
            });
            var avgBusdev = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_avg_busdev",
              line: j,
            });
            var avgAccounting = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_avg_accounting",
              line: j,
            });
            var units = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_units",
              line: j,
            });
            var leadTimeKirim = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_lead_time_kirim",
              line: j,
            });
            var itemRate = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_rate",
              line: j,
            });
            var taxItem = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_taxitem",
              line: j,
            });
            var soNO = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_so_no",
              line: j,
            });
            var taxItemRate = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_taxrate",
              line: j,
            });
            var packSize = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_packsize",
              line: j,
            });
            var soNumber = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_sonumber",
              line: j,
            });
            var internalIDPR = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_internalid",
              line: j,
            });
            var lineId = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_line_id",
              line: j,
            });
            var currency = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_currency",
              line: j,
            });
            var totalOrder = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_total_order",
              line: j,
            });
            var totalPackaging = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_total_packaging",
              line: j,
            });
            var lastPurchise = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_last_purchase",
              line: j,
            });
            console.log('totalPackaging', totalPackaging)
            if(currency){
              currencySet = currency
            }
            
            dataLine.push({
              itemID: itemID,
              currentStock: currentStock,
              incomingStock: incomingStock,
              customerID: customerID,
              tanggalKirim: tanggalKirim,
              quantity: quantity,
              salesRepID: salesRepID,
              osPO: osPO,
              forecastBusdev: forecastBusdev,
              forecastPerhitungan: forecastPerhitungan,
              avgBusdev: avgBusdev,
              avgAccounting: avgAccounting,
              units: units,
              leadTimeKirim: leadTimeKirim,
              itemRate: itemRate,
              taxItem: taxItem,
              soNO: soNO,
              taxItemRate: taxItemRate,
              packSize: packSize,
              soNumber: soNumber,
              internalIDPR: internalIDPR,
              employyeId : employyeId,
              quantityPO : quantityPO,
              lineId : lineId,
              currency : currency,
              totalOrder : totalOrder,
              totalPackaging : totalPackaging,
              lastPurchise : lastPurchise
            });
          }
        }
        console.log("data", {
          dataLine: dataLine,
          vendor: vendorID,
        });
        var dataLineString = JSON.stringify(dataLine);
        var createURL = url.resolveRecord({
          recordType: "purchaseorder",
          isEditMode: true,
          params: { vendorID: vendorID, PO_lines: dataLineString, currencySet : currencySet },
        });
        window.open(createURL, "_blank");
      } else {
        alert("Please select vendor!");
      }
    } catch (error) {
      console.log("error", error.message);
    }
  }

  exports.prToPO = prToPO;
  exports.pageInit = pageInit;

  return exports;
});
