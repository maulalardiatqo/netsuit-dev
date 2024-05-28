/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
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

  function onRequest(context) {
    var contextRequest = context.request;
    var form = serverWidget.createForm({
      title: "Print Lot Labels",
    });
    var filterOption = form.addFieldGroup({
      id: "filteroption",
      label: "FILTERS",
    });
    var locationField = form.addField({
      id: "custpage_location",
      label: "Location",
      type: serverWidget.FieldType.MULTISELECT,
      source: "location",
      container: "filteroption",
    });
    var itemField = form.addField({
      id: "custpage_item_name",
      label: "Item Name",
      type: serverWidget.FieldType.MULTISELECT,
      source: "item",
      container: "filteroption",
    });
    var binField = form.addField({
      id: "custpage_item_binnumber",
      label: "Bin Number",
      type: serverWidget.FieldType.MULTISELECT,
      source: "bin",
      container: "filteroption",
    });
    form.addButton({
      id: "printPDF",
      label: "Print Label",
      functionName: "printLabel",
    });

    form.addSubmitButton({
      label: "Search",
    });

    form.addResetButton({
      label: "Clear",
    });
    form.clientScriptModulePath = "SuiteScripts/print_bulk_barcode_cs.js";

    if (contextRequest.method == "GET") {
      var currentRecord = createSublist("custpage_sublist_item", form);
      var itemSearchObj = search.create({
        type: "inventorybalance",
        filters: [["location", "noneof", "9"]],
        columns: [
          "item",
          "binnumber",
          "inventorynumber",
          "status",
          "location",
          "onhand",
          "available",
          search.createColumn({
            name: "expirationdate",
            join: "inventoryNumber",
          }),
          search.createColumn({
            name: "displayname",
            join: "item",
          }),
          search.createColumn({
            name: "internalid",
            join: "item",
          }),
        ],
      });
      var searchResultCount = itemSearchObj.runPaged().count;
      log.debug("inventorydetailSearchObj result count", searchResultCount);
      var resultSet = getAllResults(itemSearchObj);
      var i = 0;
      resultSet.forEach(function (row) {
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_name",
          value: row.getText("item") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_bin_number",
          value: row.getText("binnumber") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_lot_number",
          value: row.getText("inventorynumber") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_status",
          value: row.getValue("status") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_location",
          value: row.getText("location") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_onhand",
          value: row.getText("onhand") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_onhand",
          value: row.getValue("onhand") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_available",
          value: row.getValue("available") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_expire_date",
          value:
            row.getValue({
              name: "expirationdate",
              join: "inventoryNumber",
            }) || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_no_of_labels",
          value: 1,
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_code",
          value:
            row.getValue({
              name: "displayname",
              join: "item",
            }) || "-",
          line: i,
        });

        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_internalid_of_item",
          value:
            row.getValue({
              name: "internalid",
              join: "item",
            }) || "-",
          line: i,
        });
        i++;
        return true;
      });

      context.response.writePage(form);

      var scriptObj = runtime.getCurrentScript();
      log.debug({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage(),
      });
    } else {
      let strItem = String(context.request.parameters.custpage_item_name);
      let arrItem = strItem.split(String.fromCharCode(5)).map(Number);
      let strLocation = String(context.request.parameters.custpage_location);
      let arrLocation = strLocation.split(String.fromCharCode(5)).map(Number);
      let strBin = String(context.request.parameters.custpage_item_binnumber);
      let arrBin = strBin.split(String.fromCharCode(5)).map(Number);
      log.debug("filter", {
        strItem: strItem,
        arrItem: arrItem,
        strLocation: strLocation,
        arrLocation: arrLocation,
        strBin: strBin,
        arrBin: arrBin,
      });

      var filterArray = [["location", "noneof", "9"]];
      if (strItem) {
        itemField.defaultValue = arrItem;
        filterArray.push("AND");
        filterArray.push(["item", "anyof", arrItem]);
      }
      if (strLocation) {
        locationField.defaultValue = arrLocation;
        filterArray.push("AND");
        filterArray.push(["location", "anyof", arrLocation]);
      }
      if (strBin) {
        binField.defaultValue = arrBin;
        filterArray.push("AND");
        filterArray.push(["binnumber", "anyof", arrBin]);
      }

      var itemSearchObj = search.create({
        type: "inventorybalance",
        filters: filterArray,
        columns: [
          "item",
          "binnumber",
          "inventorynumber",
          "status",
          "location",
          "onhand",
          "available",
          search.createColumn({
            name: "expirationdate",
            join: "inventoryNumber",
          }),
          search.createColumn({
            name: "displayname",
            join: "item",
          }),
          search.createColumn({
            name: "internalid",
            join: "item",
          }),
        ],
      });
      var resultSet = getAllResults(itemSearchObj);
      log.debug("resultSet", resultSet);
      var i = 0;
      var currentRecord = createSublist("custpage_sublist_item", form);
      resultSet.forEach(function (row) {
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_name",
          value: row.getText("item") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_bin_number",
          value: row.getText("binnumber") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_lot_number",
          value: row.getText("inventorynumber") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_status",
          value: row.getValue("status") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_location",
          value: row.getText("location") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_onhand",
          value: row.getText("onhand") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_onhand",
          value: row.getValue("onhand") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_available",
          value: row.getValue("available") || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_expire_date",
          value:
            row.getValue({
              name: "expirationdate",
              join: "inventoryNumber",
            }) || "-",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_no_of_labels",
          value: 1,
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_code",
          value:
            row.getValue({
              name: "displayname",
              join: "item",
            }) || "-",
          line: i,
        });

        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_internalid_of_item",
          value:
            row.getValue({
              name: "internalid",
              join: "item",
            }) || "-",
          line: i,
        });
        i++;
        return true;
      });
      context.response.writePage(form);
    }
  }

  function createSublist(sublistname, form) {
    var sublist_in = form.addSublist({
      id: sublistname,
      type: serverWidget.SublistType.LIST,
      label: "Items",
      tab: "matchedtab",
    });
    sublist_in.addMarkAllButtons();

    sublist_in
      .addField({
        id: "custpage_sublist_item_select",
        label: "Select",
        type: serverWidget.FieldType.CHECKBOX,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_in.addField({
      id: "custpage_sublist_item_name",
      label: "ITEM",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_bin_number",
      label: "BIN NUMBER",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_lot_number",
      label: "INVENTORY NUMBER",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_status",
      label: "STATUS",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_location",
      label: "LOCATION",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_onhand",
      label: "ON HAND",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_available",
      label: "AVAILABLE",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_expire_date",
      label: "EXPIRE DATE",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in
      .addField({
        id: "custpage_sublist_item_no_of_labels",
        label: "NO. OF LABELS",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_item_code",
        label: "ITEM CODE",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_item_internalid_of_item",
        label: "ITEM INTERNAL ID",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    return sublist_in;
  }

  return {
    onRequest: onRequest,
  };
});
