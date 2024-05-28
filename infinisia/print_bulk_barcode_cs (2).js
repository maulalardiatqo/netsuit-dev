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

  function printLabel(context) {
    var records = currentRecord.get();
    try {
      var dataBarcode = [];
      var count = records.getLineCount({
        sublistId: "custpage_sublist_item",
      });
      console.log("count", count);

      for (var j = 0; j < count; j++) {
        var selected = records.getSublistValue({
          sublistId: "custpage_sublist_item",
          fieldId: "custpage_sublist_item_select",
          line: j,
        });
        if (selected) {
          var internalID = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_internalid",
            line: j,
          });
          var lotNumber = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_lot_number",
            line: j,
          });
          var countLabel = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_no_of_labels",
            line: j,
          });
          var itemName = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_name",
            line: j,
          });
          var itemCode = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_code",
            line: j,
          });
          var location = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_location",
            line: j,
          });
          var itemInternalID = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_internalid_of_item",
            line: j,
          });
          var binNumber = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_bin_number",
            line: j,
          });
          dataBarcode.push({
            itemCode: itemCode,
            itemName: itemName,
            lotNumber: lotNumber,
            location: location,
            binNumber: binNumber,
            itemInternalID: itemInternalID,
            countLabel: countLabel,
          });
        }
      }
      log.debug("dataBarcode", dataBarcode);
      var dataBarcodeString = JSON.stringify(dataBarcode);
      var createURL = url.resolveScript({
        scriptId: "customscript821",
        deploymentId: "customdeploy1",
        params: { custscript_list_item_to_print: dataBarcodeString },
        returnExternalUrl: false,
      });
      window.open(createURL, "_blank");
    } catch (error) {
      console.log("error", error.message);
    }
  }

  exports.printLabel = printLabel;
  exports.pageInit = pageInit;

  return exports;
});
