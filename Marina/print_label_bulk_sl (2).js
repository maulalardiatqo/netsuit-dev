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
      title: "Print Item Labels",
    });
    var filterOption = form.addFieldGroup({
      id: "filteroption",
      label: "FILTERS",
    });
    var selectOption = form.addFieldGroup({
      id: "selectoption",
      label: "SELECT OPTION",
    });
    var itemName = form.addField({
      id: "custpage_item_name",
      label: "ITEM NAME",
      type: serverWidget.FieldType.SELECT,
      container: "filteroption",
      source: "item",
    });
    itemName.isMandatory = true
    // form.addButton({
    //   id: "selectAll",
    //   label: "Select All",
    //   functionName: "selectAll",
    // });
    // form.addButton({
    //   id: "unselectAll",
    //   label: "Unselect All",
    //   functionName: "printLabel",
    // });

    form.addSubmitButton({
      label: "Search",
    });

    form.addResetButton({
      label: "Clear",
    });
    form.clientScriptModulePath = "SuiteScripts/print_bulk_barcode_cs.js";

    if (contextRequest.method == "GET") {
      // var currentRecord = createSublist("custpage_sublist_item", form);
      // var itemSearchObj = search.create({
      //   type: "item",
      //   filters: [],
      //   columns: [
      //     "internalid",
      //     "displayname",
      //     search.createColumn({
      //       name: "itemid",
      //       sort: search.Sort.ASC,
      //     }),
      //     "upccode",
      //   ],
      // });
      // var searchResultCount = itemSearchObj.runPaged().count;
      // log.debug("itemSearchObj result count", searchResultCount);
      // var resultSet = getAllResults(itemSearchObj);
      // var i = 0;
      // resultSet.forEach(function (row) {
      //   currentRecord.setSublistValue({
      //     sublistId: "custpage_sublist_item",
      //     id: "custpage_sublist_item_internalid",
      //     value: row.getValue("internalid") || " ",
      //     line: i,
      //   });
      //   currentRecord.setSublistValue({
      //     sublistId: "custpage_sublist_item",
      //     id: "custpage_sublist_item_name",
      //     value:
      //       row.getValue({
      //         name: "itemid",
      //         sort: search.Sort.ASC,
      //       }) || " ",
      //     line: i,
      //   });
      //   currentRecord.setSublistValue({
      //     sublistId: "custpage_sublist_item",
      //     id: "custpage_sublist_upccode",
      //     value: row.getValue("upccode") || " ",
      //     line: i,
      //   });
      //   currentRecord.setSublistValue({
      //     sublistId: "custpage_sublist_item",
      //     id: "custpage_sublist_item_no_of_labels",
      //     value: 1,
      //     line: i,
      //   });
      //   i++;
      //   return true;
      // });

      context.response.writePage(form);

      var scriptObj = runtime.getCurrentScript();
      log.debug({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage(),
      });
    } else {
      var itemSearchObj = search.create({
        type: "item",
        filters: [["internalid", "is", context.request.parameters.custpage_item_name]],
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
      var currentRecord = createSublist("custpage_sublist_item", form);
      resultSet.forEach(function (row) {
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_internalid",
          value: row.getValue("internalid") || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_name",
          value:
            row.getValue({
              name: "itemid",
              sort: search.Sort.ASC,
            }) || " ",
          line: i,
        });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_upccode",
          value: row.getValue("upccode") || " ",
          line: i,
        });
        // currentRecord.setSublistValue({
        //   sublistId: "custpage_sublist_item",
        //   id: "custpage_sublist_lotnumber",
        //   value: row.getValue("serialnumber") || " ",
        //   line: i,
        // });
        currentRecord.setSublistValue({
          sublistId: "custpage_sublist_item",
          id: "custpage_sublist_item_no_of_labels",
          value: 1,
          line: i,
        });
        i++;
        return true;
      });
      var selectAll = form.addField({
        id: "custpage_item_select_all",
        label: "Select All",
        type: serverWidget.FieldType.CHECKBOX,
        container: "selectoption",
      }).updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });;
      form.addButton({
        id: "printPDF",
        label: "Print Label",
        functionName: "printLabel",
      });
      form.addButton({
        id: "printRakPDF",
        label: "Print Label Rak",
        functionName: "printRakPDF",
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
      id: "custpage_sublist_item_internalid",
      label: "INTERNAL ID",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_item_name",
      label: "ITEM NAME",
      type: serverWidget.FieldType.TEXT,
    });

    sublist_in.addField({
      id: "custpage_sublist_upccode",
      label: "UPC CODE",
      type: serverWidget.FieldType.TEXT,
    });
    // sublist_in.addField({
    //   id: "custpage_sublist_lotnumber",
    //   label: "Lot Number",
    //   type: serverWidget.FieldType.TEXT,
    // });
    sublist_in
      .addField({
        id: "custpage_sublist_item_no_of_labels",
        label: "NO. OF LABELS",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    return sublist_in;
  }

  return {
    onRequest: onRequest,
  };
});
