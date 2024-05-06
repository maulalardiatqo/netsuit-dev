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
          log.debug("internalID", internalID);
          var itemName = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_name",
            line: j,
          });
          var lotNumber = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_lotnumber",
            line: j,
          });
          var countLabel = records.getSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_no_of_labels",
            line: j,
          });
          var itemPrice = 0;
          // get item price
          var customrecord_msa_group_price_qtySearchObj = search.create({
            type: "customrecord_msa_group_price_qty",
            filters: [["custrecord_msa_priceqty_item_id", "anyof", internalID], "AND", ["custrecord_msa_gpq_price_barcode", "is", "T"]],
            columns: ["custrecord_msa_gpq_volume", "custrecord_msa_gpq_harga", "custrecord_msa_gpq_profit_percent"],
          });
          customrecord_msa_group_price_qtySearchObj.run().each(function (result) {
            itemPrice = result.getValue("custrecord_msa_gpq_harga");
          });
          // end get item price
          dataBarcode.push({
            internalID: internalID,
            itemName: itemName,
            countLabel: countLabel,
            itemPrice: itemPrice,
            lotNumber : lotNumber
          });
        }
      }
      console.log("dataBarcode", dataBarcode);
      var dataBarcodeString = JSON.stringify(dataBarcode);
      var createURL = url.resolveScript({
        scriptId: "customscript822",
        deploymentId: "customdeploy1",
        params: { custscript_list_item_to_print: dataBarcodeString },
        returnExternalUrl: false,
      });
      window.open(createURL, "_blank");
    } catch (error) {
      console.log("error", error.message);
    }
  }

  function fieldChanged(context) {
    var vrecord = currentRecord.get();
    if (context.fieldId == "custpage_item_name") {
      try {
        console.log("item changed", vrecord.getValue("custpage_item_name"));
        var countsublist = vrecord.getLineCount({
          sublistId: "custpage_sublist_item",
        });
        console.log("countsublist", countsublist);
        for (var i = countsublist - 1; i >= 0; i--) {
          vrecord.removeLine({
            sublistId: "custpage_sublist_item",
            line: i,
            ignoreRecalc: true,
          });
        }
        console.log("search", true);
        var itemSearchObj = search.create({
          type: "item",
          filters: [["name", "contains", vrecord.getValue("custpage_item_name")]],
          columns: [
            "internalid",
            "displayname",
            search.createColumn({
              name: "itemid",
              sort: search.Sort.ASC,
            }),
            "upccode",
          ],
        });
        var resultSet = getAllResults(itemSearchObj);
        var i = 0;
        console.log("end search", resultSet);
        /*
        resultSet.forEach(function (row) {
          vrecord.selectNewLine({ sublistId: "custpage_sublist_item" });
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_internalid",
            value: row.getValue("internalid") || " ",
            ignoreFieldChange: true,
          });
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_name",
            value:
              row.getValue({
                name: "itemid",
                sort: search.Sort.ASC,
              }) || " ",
            ignoreFieldChange: true,
          });
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_upccode",
            value: row.getValue("upccode") || " ",
            ignoreFieldChange: true,
          });
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_item",
            fieldId: "custpage_sublist_item_no_of_labels",
            value: 1,
            ignoreFieldChange: true,
          });
          vrecord.commitLine({
            sublistId: "custpage_sublist_item",
            ignoreRecalc: true,
          });
          i++;
          return true;
        });
        */
      } catch (error) {
        console.log("error", error);
      }
    }
  }

  exports.printLabel = printLabel;
  exports.fieldChanged = fieldChanged;
  exports.pageInit = pageInit;

  return exports;
});
