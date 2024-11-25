/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/search", "N/currentRecord", "N/query", "N/record", "N/format", "N/ui/dialog", "N/runtime", "N/ui/message", "N/url", "N/log"], function (search, currentRecord, query, record, format, dialog, runtime, message, url, log) {
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
      log.debug("count", count);
      if (vendorID) {
        for (var j = 0; j < count; j++) {
          var selected = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_select",
            line: j,
          });
          if (selected) {
            var idPrSUm = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_idprsum",
              line: j,
            });
;

            var currency = records.getSublistValue({
              sublistId: "custpage_sublist_item",
              fieldId: "custpage_sublist_currency",
              line: j,
            });
           
            if(currency){
              currencySet = currency
            }
            
            dataLine.push(idPrSUm);
          }
        }
        log.debug("data", {
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
      log.debug("error", error.message);
    }
  }

  exports.prToPO = prToPO;
  exports.pageInit = pageInit;

  return exports;
});
