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
        var itemsToConvert = [];
        var count = records.getLineCount({ sublistId: "custpage_sublist_item" });
        var vendorID = records.getValue("custpage_vendor");
        var currencySet = "";

        if (vendorID) {
            for (var j = 0; j < count; j++) {
                var selected = records.getSublistValue({
                    sublistId: "custpage_sublist_item",
                    fieldId: "custpage_sublist_item_select",
                    line: j
                });

                if (selected) {
                    var itemID = records.getSublistValue({ sublistId: "custpage_sublist_item", fieldId: "custpage_sublist_itemid", line: j }); // Pastikan field ID benar
                    var qtySisa = records.getSublistValue({ sublistId: "custpage_sublist_item", fieldId: "custpage_sublist_quantity", line: j }); 
                    var lineIdPR = records.getSublistValue({ sublistId: "custpage_sublist_item", fieldId: "custpage_sublist_idprsum", line: j });
                    var currency = records.getSublistValue({ sublistId: "custpage_sublist_item", fieldId: "custpage_sublist_currency", line: j });

                    if (currency) currencySet = currency;

                    // Membangun objek untuk parameter native 'itemdata'
                    itemsToConvert.push({
                        'item': itemID,
                        'quantity': qtySisa,
                        'custcol_msa_id_line_from_pr': lineIdPR // ID referensi baris
                    });
                }
            }

            if (itemsToConvert.length > 0) {
                // Gunakan resolveRecord dengan parameter native
                var createURL = url.resolveRecord({
                    recordType: "purchaseorder",
                    isEditMode: true,
                    params: { 
                        'cf': 104, 
                        'entity': vendorID, 
                        'currency': currencySet,
                        'itemdata': JSON.stringify(itemsToConvert) // INI KUNCINYA
                    }
                });
                window.open(createURL, "_blank");
            }
        } else {
            alert("Please select vendor!");
        }
    } catch (error) {
        console.error("error", error.message);
    }
}

  exports.prToPO = prToPO;
  exports.pageInit = pageInit;

  return exports;
});
