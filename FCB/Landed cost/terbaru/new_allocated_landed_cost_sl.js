/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/ui/message",
  "N/url",
  "N/redirect",
  "N/currency",
  'N/config',
  'N/runtime'
], function(serverWidget, search, record, message, url, redirect, currency, config, runtime) {
  function onRequest(context) {
    var contextRequest = context.request;
    var ibId = contextRequest.parameters.ibid;

    function checkArrayValues(array) {
      return array.every(function(element) {
        return element === array[0];
      });
    }

    function getAllResults(s) {
      var results = s.run();
      var searchResults = [];
      var searchid = 0;
      do {
        var resultslice = results.getRange({
          start: searchid,
          end: searchid + 1000
        });
        resultslice.forEach(function(slice) {
          searchResults.push(slice);
          searchid++;
        });
      } while (resultslice.length >= 1000);
      return searchResults;
    }

    if (contextRequest.method === "GET") {
      log.debug("test")
      rec_inbound = record.load({
        type: "inboundshipment",
        id: ibId,
      });
      let shipmentNumber = rec_inbound.getValue("shipmentnumber");
      let dateCreated = rec_inbound.getValue("shipmentcreateddate");
      let externalDocNum = rec_inbound.getValue("externaldocumentnumber");
      let shipmentbasecurrency = rec_inbound.getValue("shipmentbasecurrency");

      var form = serverWidget.createForm({
        title: "Allocate Landed Cost",
      });

      var idInbound = form
        .addField({
          id: "custpage_id_inbound",
          label: "ID Inbound",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      idInbound.defaultValue = ibId;

      var cust_shipmentnumber = form
        .addField({
          id: "custpage_shipmentnumber",
          label: "Shipment Number",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

      cust_shipmentnumber.defaultValue = shipmentNumber;

      var cust_shipmentcreateddate = form
        .addField({
          id: "custpage_shipmentcreateddate",
          label: "Date Created",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

      cust_shipmentcreateddate.defaultValue = dateCreated;

      var cust_externaldocumentnumber = form
        .addField({
          id: "custpage_externaldocumentnumber",
          label: "External Document Number	",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

      cust_externaldocumentnumber.defaultValue = externalDocNum;

      // Sublist Coloumn
      var sublist = form.addSublist({
        id: "sublist",
        type: serverWidget.SublistType.INLINEEDITOR,
        label: "List",
      });

      var gr_costCategory = sublist
        .addField({
          id: "sublist_gr_cost_category",
          label: "COST CATEGORY",
          type: serverWidget.FieldType.SELECT,
          source: "costcategory",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      var gr_amount = sublist
        .addField({
          id: "sublist_gr_amount",
          label: "AMOUNT",
          type: serverWidget.FieldType.CURRENCY,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      var gr_costCurrency = sublist
        .addField({
          id: "sublist_gr_cost_currency",
          label: "CURRENCY",
          type: serverWidget.FieldType.SELECT,
          source: "currency",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      //gr_costCurrency.defaultValue = shipmentbasecurrency;

      var gr_exchangeRate = sublist
        .addField({
          id: "sublist_gr_exchange",
          label: "EXCHANGE RATE",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      gr_exchangeRate.defaultValue = "1";

      var gr_allocationMethodField = sublist
        .addField({
          id: "sublist_gr_cost_allocation_method",
          label: "COST ALLOCATION METHOD",
          type: serverWidget.FieldType.SELECT,
          source: "customlist_lc_cost_alloc_method",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      var LcCostAllocs = search.create({
        type: 'customrecordabj_ib_cost_allocation',
        columns: ['custrecord_ca_ib_cost_category',
          'custrecord_ca_ib_cost_amount',
          'custrecord_ca_ib_cost_currency',
          'custrecord_ca_ib_cost_exchange_rate',
          'custrecord_ca_ib_cost_alloc_method',
          'custrecord_exchangerate1'
        ],
        filters: [{
          name: 'custrecord_abj_ca_ib_number',
          operator: 'is',
          values: ibId
        }, ]
      }).run().getRange({
        start: 0,
        end: 4
      });
      // log.debug("LcCostAllocs", LcCostAllocs);
      var vrecord = context.currentRecord;
      var idx = 0;
      LcCostAllocs.forEach(function(LcCostAlloc) {
        var cost_Category = LcCostAlloc.getValue({
          name: 'custrecord_ca_ib_cost_category'
        })
        sublist.setSublistValue({
          id: 'sublist_gr_cost_category',
          line: idx,
          value: cost_Category
        });
        // log.debug("cost_Category", cost_Category);

        var cost_Amount = LcCostAlloc.getValue({
          name: 'custrecord_ca_ib_cost_amount'
        })
        sublist.setSublistValue({
          id: 'sublist_gr_amount',
          line: idx,
          value: cost_Amount
        });
        // log.debug("cost_Amount", cost_Amount);

        var cost_Currency = LcCostAlloc.getValue({
          name: 'custrecord_ca_ib_cost_currency'
        })
        sublist.setSublistValue({
          id: 'sublist_gr_cost_currency',
          line: idx,
          value: cost_Currency || shipmentbasecurrency
        });
        // log.debug("cost_Currency", cost_Currency);

        var cost_Exchange = LcCostAlloc.getValue({
          name: 'custrecord_exchangerate1'
        })
        sublist.setSublistValue({
          id: 'sublist_gr_exchange',
          line: idx,
          value: cost_Exchange || 1
        });
        // log.debug("cost_Exchange", cost_Exchange);

        var cost_allocMethod = LcCostAlloc.getValue({
          name: 'custrecord_ca_ib_cost_alloc_method'
        })
        sublist.setSublistValue({
          id: 'sublist_gr_cost_allocation_method',
          line: idx,
          value: cost_allocMethod
        });
        // log.debug("cost_allocMethod", cost_allocMethod);
        idx++;
      });

      gr_costCategory.isMandatory = true;
      gr_costCurrency.isMandatory = true;
      gr_exchangeRate.isMandatory = true;
      gr_amount.isMandatory = true;
      gr_allocationMethodField.isMandatory = true;

      var submitButton = form.addSubmitButton({
        label: "Allocate",
      });
      submitButton.id = 'submitButton';

      var datatranss = search.load({
        id: "customsearchabj_ib_rec_trans",
      });

      datatranss.filters.push(
        search.createFilter({
          name: "internalid",
          operator: search.Operator.IS,
          values: ibId,
        })
      );
      var datatransset = datatranss.run();
      datatranss = datatransset.getRange(0, 100);

      var allExchangeRate = [];
      datatranss.forEach(function(datatrans) {
        var grId = datatrans.getValue({
          name: datatransset.columns[2]
        });
        var irRec = record.load({
          type: record.Type.ITEM_RECEIPT,
          id: grId,
        });
        var exchangeRateIr = irRec.getValue("exchangerate");
        allExchangeRate.push(exchangeRateIr);
      });
      // log.debug("allExchangeRate", allExchangeRate);
      if (LcCostAllocs.length > 0 && !checkArrayValues(allExchangeRate)) {
        submitButton.isDisabled = true;
      }

      form.addButton({
        id: "close_btn",
        label: "Close",
        functionName: "goBack",
      });

      form.addButton({
        id: "reallocate_btn",
        label: "Recalculate Exchange Rate",
        functionName: "doRecalculate(" + ibId + ")",
      });

      form.addButton({
        id: "custpage_redirec_button",
        label: "Cost Allocate",
        functionName: "redirectToCostAllocate",
      });
      
      form.clientScriptModulePath = "SuiteScripts/is_allocate_landed_cost_cs.js";

      context.response.writePage(form);
    } else {
      var info = config.load({
        type: config.Type.COMPANY_INFORMATION
      });

      var baseCurrencySearch = search.create({
        type: search.Type.CURRENCY,
        filters: [
          ["internalid", search.Operator.IS, info.getValue("basecurrency")]
        ],
        columns: [
          "name"
        ]
      });

      var searchResultBcr = baseCurrencySearch.run().getRange({
        start: 0,
        end: 1
      });
      var baseCurrency = searchResultBcr[0].getValue({
        name: "name"
      });

      // var recCurrency = record.load({
      //   type: record.Type.CURRENCY,
      //   id: info.getValue("basecurrency")
      // });
      // var baseCurrency = recCurrency.getText({
      //   fieldId: 'name'
      // });
      // log.debug("baseCurrency", baseCurrency);
      var ibIDform = contextRequest.parameters.custpage_id_inbound;
      var datatranss = search.load({
        id: "customsearchabj_ib_rec_trans",
      });

      datatranss.filters.push(
        search.createFilter({
          name: "internalid",
          operator: search.Operator.IS,
          values: ibIDform,
        })
      );
      var datatransset = datatranss.run();
      datatranss = datatransset.getRange(0, 1000);

      //looping only to sum all quantity
      var totalQty = 0;
      var totalWeight = 0;
      var totalPrice = 0;
      var counter_total = 1;
      var itemKey = [];
      datatranss.forEach(function(datatrans) {
        var grId = datatrans.getValue({
          name: datatransset.columns[2]
        });
        ir_data_to_update = record.load({
          type: record.Type.ITEM_RECEIPT,
          id: grId,
        });
        var lineTotal = ir_data_to_update.getLineCount({
          sublistId: "item"
        });
        // log.debug("lineTotal", lineTotal);
        // looping for sum quantity
        for (var a = 0; a < lineTotal; a++) {
          var qty_a = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: a,
          });

          var price_a = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_grr_amount",
            line: a,
          });
          if (price_a <= 0) {
            var rate_a = ir_data_to_update.getSublistValue({
              sublistId: "item",
              fieldId: "rate",
              line: a,
            });
            price_a = rate_a * qty_a;
          }

          var item_key = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "itemkey",
            line: a,
          });
          itemKey.push({
            grId: grId,
            item_key: item_key
          });
          // var inventoryitemSearchObj = search.create({
          //   type: "inventoryitem",
          //   filters: [
          //     ["type", "anyof", "InvtPart"],
          //     "AND",
          //     ["internalid", "anyof", item_key]
          //   ],
          //   columns: [
          //     search.createColumn({
          //       name: "itemid",
          //       sort: search.Sort.ASC
          //     }),
          //     "displayname",
          //     "type",
          //     "weight"
          //   ]
          // });
          // var searchResultInvtrItem = inventoryitemSearchObj.run().getRange({
          //   start: 0,
          //   end: 1
          // });
          // var itemWeight = searchResultInvtrItem[0].getValue({
          //   name: "weight"
          // });

          var fieldLookUpItem = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: item_key,
            columns: ['type', 'weight']
          });
          var itemWeight = fieldLookUpItem.weight;
          // log.debug("itemWeight", itemWeight);

          // var myResults = getAllResults(inventoryitemSearchObj);
          // var searchResultCount = inventoryitemSearchObj.runPaged().count;
          // log.debug("inventoryitemSearchObj result count", searchResultCount);
          // var itemWeight;
          // myResults.forEach(function(result) {
          //   itemWeight = result.getValue("weight");
          // });
          // log.debug("itemWeight", {
          //   item_key: item_key,
          //   itemWeight: itemWeight
          // });
          //   log.debug("ITEM KEYY", item_key);
          // rec_itemkey = record.load({
          //   type: record.Type.INVENTORY_ITEM,
          //   id: item_key,
          // });
          let weight = itemWeight == "" ? 1 : itemWeight;
          var qty_weight = qty_a * weight;

          totalQty += qty_a;
          totalWeight += qty_weight;
          totalPrice += price_a;
        }
        counter_total++;
      });
      log.debug("counter counter_total", counter_total);
      log.debug("total QTY ALL", totalQty);
      log.debug("ITEM KEYY TOTAL WEIGHT", totalWeight);
      log.debug("total PRICE ALL", totalPrice);
      log.debug("itemKey", itemKey);

      // looping for data process
      var success_gr_create_count = 0;
      var failed_gr_create_count = 0;
      var err_messages = "";
      var scc_messages = "";
      datatranss.forEach(function(datatrans) {
        var grId = datatrans.getValue({
          name: datatransset.columns[2]
        });
        var grDocNo = datatrans.getValue({
          name: datatransset.columns[3]
        });
        ir_data_to_update = record.load({
          type: "itemreceipt",
          id: grId,
        });
        var currencyGr = ir_data_to_update.getText("currency");
        // log.debug("currencyGr", currencyGr);
        var dateGr = ir_data_to_update.getValue("trandate");
        // log.debug("dateGr", dateGr);
        // log.debug("GRID", grId);
        var filteredArrayItem = itemKey.filter(function(obj) {
          return obj.grId === grId;
        });
        var itemKeys = filteredArrayItem.map(function(obj) {
          return obj.item_key;
        });
        var itemKeyGrID = [];
        var inventoryitemSearchObj = search.create({
          type: "inventoryitem",
          filters: [
            ["type", "anyof", "InvtPart"],
            "AND",
            ["internalid", "anyof", itemKeys]
          ],
          columns: [
            search.createColumn({
              name: "itemid",
              sort: search.Sort.ASC
            }),
            "internalid",
            "displayname",
            "type",
            "weight",
            search.createColumn({
              name: "custrecord_item_ca_cost_category",
              join: "CUSTRECORD_CA_ID_ITEM"
            }),
            search.createColumn({
              name: "custrecord_item_ca_percentage",
              join: "CUSTRECORD_CA_ID_ITEM"
            }),
            search.createColumn({
              name: "custrecord_grr_number_iw",
              join: "CUSTRECORD_CA_ID_ITEM"
            })
          ]
        });
        var myResults = getAllResults(inventoryitemSearchObj);
        myResults.forEach(function(result) {
          var CostAmount = result.getValue({
            name: "custrecord_item_ca_percentage",
            join: "CUSTRECORD_CA_ID_ITEM"
          });
          var CostCategory = result.getValue({
            name: "custrecord_item_ca_cost_category",
            join: "CUSTRECORD_CA_ID_ITEM"
          });
          var CostGR = result.getValue({
            name: "custrecord_grr_number_iw",
            join: "CUSTRECORD_CA_ID_ITEM"
          });
          var ItemID = result.getValue("internalid");
          var ItemWeight = result.getValue("weight");
          itemKeyGrID.push({
            ItemID: ItemID,
            itemWeight: ItemWeight,
            Category: CostCategory,
            Amount: CostAmount,
            GrID: CostGR,
          });
        });
        log.debug("itemKeyGrID", itemKeyGrID);

        var lineTotal = ir_data_to_update.getLineCount({
          sublistId: "item"
        });
        var iteminGR = [];
        for (var i = 0; i < lineTotal; i++) {
          var qty = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });

          var price = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_grr_amount",
            line: i,
          });

          if (price <= 0) {
            var rate = ir_data_to_update.getSublistValue({
              sublistId: "item",
              fieldId: "rate",
              line: i,
            });
            price = rate * qty;
          }

          // get weight
          var item_key = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "itemkey",
            line: i,
          });
          //   log.debug("ITEM KEYY", item_key);
          // rec_itemkey = record.load({
          //   type: record.Type.INVENTORY_ITEM,
          //   id: item_key,
          // });
          // let weight =
          //   rec_itemkey.getValue("weight") == "" ?
          //   1 :
          //   rec_itemkey.getValue("weight");
          // var inventoryitemSearchObj = search.create({
          //   type: "inventoryitem",
          //   filters: [
          //     ["type", "anyof", "InvtPart"],
          //     "AND",
          //     ["internalid", "anyof", "7043"]
          //   ],
          //   columns: [
          //     search.createColumn({
          //       name: "itemid",
          //       sort: search.Sort.ASC
          //     }),
          //     "displayname",
          //     "type",
          //     "weight",
          //     search.createColumn({
          //       name: "custrecord_item_ca_cost_category",
          //       join: "CUSTRECORD_CA_ID_ITEM"
          //     }),
          //     search.createColumn({
          //       name: "custrecord_item_ca_percentage",
          //       join: "CUSTRECORD_CA_ID_ITEM"
          //     })
          //   ]
          // });
          // var myResults = getAllResults(inventoryitemSearchObj);
          // var searchResultCount = inventoryitemSearchObj.runPaged().count;
          // log.debug("inventoryitemSearchObj result count", searchResultCount);
          var itemWeight;
          var qty_weight;
          var cost_category_by_item = [];
          for (var idx_x in itemKeyGrID) {
            let item_id = itemKeyGrID[idx_x];
            let item_id_to_check = item_id.ItemID;
            let gr_id_to_check = item_id.GrID;
            // log.debug("cost_category_to_check", cost_category_to_check);
            // log.debug("item_cost_category", item_cost_category);

            if (item_id_to_check == item_key && gr_id_to_check == grId) {
              if (!iteminGR.includes(item_key)) {
                if (idx_x == 0) {
                  itemWeight = item_id.itemWeight;
                  let weight = itemWeight == "" ? 1 : itemWeight;
                  qty_weight = qty * weight;
                }
                let costCategory = item_id.Category;
                let costAmount = item_id.Amount;
                // let landedCostAmount = Number(price * percentage / 100);
                cost_category_by_item.push({
                  grID: grId,
                  Category: costCategory,
                  landedcost: costAmount,
                });
              }
              iteminGR.push(item_key);
            }
          }
          log.debug("cost_category_by_item", cost_category_by_item);

          // var itemWeight;
          // var qty_weight;
          // var cost_category_by_item = [];
          // var counter = 0;
          // myResults.forEach(function(result) {
          //   if (counter == 0) {
          //     itemWeight = result.getValue("weight");
          //     let weight = itemWeight == "" ? 1 : itemWeight;
          //     qty_weight = qty * weight;
          //   }
          //   var CostPercentage = result.getValue("custrecord_item_ca_percentage");
          //   var CostCategory = result.getValue("custrecord_item_ca_cost_category");
          //   if (CostPercentage && CostCategory) {
          //     var landedCostAmount = Number(price * CostPercentage / 100);
          //     cost_category_by_item.push({
          //       Category: CostCategory,
          //       Percentage: CostPercentage,
          //       landedcost: landedCostAmount,
          //     });
          //   }
          //   counter++;
          // });
          // rec_itemkey = record.load({
          //   type: record.Type.INVENTORY_ITEM,
          //   id: item_key,
          // });

          // let weight = rec_itemkey.getValue("weight") == "" ? 1 : rec_itemkey.getValue("weight");

          // end get weight

          // get cost category

          // var lineTotalCostCategoryItem = rec_itemkey.getLineCount({
          //   sublistId: "recmachcustrecord_ca_id_item",
          // });
          // var cost_category_by_item = [];
          // for (
          //   var idx_item = 0; idx_item < lineTotalCostCategoryItem; idx_item++
          // ) {
          //   var CostPercentage = rec_itemkey.getSublistValue({
          //     sublistId: "recmachcustrecord_ca_id_item",
          //     fieldId: "custrecord_item_ca_percentage",
          //     line: idx_item,
          //   });
          //
          //   var CostCategory = rec_itemkey.getSublistValue({
          //     sublistId: "recmachcustrecord_ca_id_item",
          //     fieldId: "custrecord_item_ca_cost_category",
          //     line: idx_item,
          //   });
          //
          //   var landedCostAmount = Number(price * CostPercentage / 100);
          //
          //   cost_category_by_item.push({
          //     Category: CostCategory,
          //     Percentage: CostPercentage,
          //     landedcost: landedCostAmount,
          //   });
          // }

          // end get cost category

          var subrec = ir_data_to_update.getSublistSubrecord({
            sublistId: "item",
            fieldId: "landedcost",
            line: i,
          });

          var totalLandedNow = subrec.getLineCount({
            sublistId: "landedcostdata",
          });
          //   log.debug("line total landed", totalLandedNow);

          for (var n = totalLandedNow; n >= 0; n--) {
            // log.debug("running line delete ", n + " of " + totalLandedNow);
            subrec.removeLine({
              sublistId: "landedcostdata",
              line: n,
              ignoreRecalc: true,
            });
            // log.debug("removed", "Line " + i + " has been removed.");
          }

          var count = contextRequest.getLineCount({
            group: "sublist",
          });

          for (var j = 0; j < count; j++) {
            var item_cost_category = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_cost_category",
              line: j,
            });

            var item_amount_val = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_amount",
              line: j,
            });

            var exchange_rate = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_exchange",
              line: j,
            });

            // var exchange_rate_text = contextRequest.getSublistText({
            //   group: "sublist",
            //   name: "sublist_gr_exchange",
            //   line: j,
            // });

            var currency_input = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_cost_currency",
              line: j,
            });

            // var currencyRec = record.load({
            //   type: "currency",
            //   id: currency_input,
            //   isDynamic: true,
            // });
            // var currencyText = currencyRec.getText("name");

            var fieldLookUpCr = search.lookupFields({
              type: search.Type.CURRENCY,
              id: currency_input,
              columns: ['name']
            });
            var currencyText = fieldLookUpCr.name;
            // log.debug("currencyText", currencyText);

            // var currencySearch = search.create({
            //   type: search.Type.CURRENCY,
            //   filters: [
            //     ["internalid", search.Operator.IS, currency_input]
            //   ],
            //   columns: [
            //     "name"
            //   ]
            // });
            //
            // var searchResultCr = currencySearch.run().getRange({
            //   start: 0,
            //   end: 1
            // });
            //
            // var currencyText = searchResultCr[0].getValue({
            //   name: "name"
            // });

            // currExchageRate = Number(currency.exchangeRate({
            //   source: currency_input,
            //   target: currencyGr,
            //   date: dateGr,
            // }));
            // log.debug("currency", {
            //   dateGr: dateGr,
            //   currencyGr: currencyGr,
            //   currency_input: currency_input,
            //   currExchageRate: currExchageRate
            // });

            // log.debug("currency", {
            //   currencyText: currencyText,
            //   currencyGr: currencyGr,
            //   item_amount_val: item_amount_val
            // });
            if (currencyText == currencyGr) {
              var item_amount = parseFloat(item_amount_val) / parseFloat(exchange_rate);
            } else {
              var item_amount = parseFloat(item_amount_val) * parseFloat(exchange_rate);
            }

            var item_alloc_method = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_cost_allocation_method",
              line: j,
            });

            if (item_alloc_method === "1") {
              var item_amount_landed_cost = Number(
                (item_amount / totalQty) * qty
              );
            }

            if (item_alloc_method === "3") {
              var item_amount_landed_cost = Number(
                (item_amount / totalWeight) * qty_weight
              );
            }

            if (item_alloc_method === "2") {
              var item_amount_landed_cost = Number(
                (item_amount / totalPrice) * price
              );
            }

            if (item_alloc_method === "4") {
              // log.debug("array cost category", cost_category_by_item);
              var item_amount_landed_cost = 0;
              for (var idx_c in cost_category_by_item) {
                var cost_category = cost_category_by_item[idx_c];
                var cost_category_to_check = cost_category.Category;
                var cost_amount_allocated = cost_category.landedcost;
                // log.debug("cost_category_to_check", cost_category_to_check);
                // log.debug("item_cost_category", item_cost_category);
                if (cost_category_to_check == item_cost_category) {
                  // item_amount_landed_cost = cost_category.landedcost;
                  if (currencyText == currencyGr) {
                    var item_amount_landed_cost = parseFloat(cost_amount_allocated) / parseFloat(exchange_rate);
                  } else {
                    var item_amount_landed_cost = parseFloat(cost_amount_allocated) * parseFloat(exchange_rate);
                  }
                  log.debug("item_amount_landed_cost", item_amount_landed_cost);
                }
              }
            }
            // log.debug("tes_1", "tes_1");

            // log.debug("item_cost_category", {
            //   item_cost_category: item_cost_category,
            //   item_amount_landed_cost: item_amount_landed_cost
            // });
            if (item_amount_landed_cost) {
              var idx_subrec = subrec.getLineCount({
                sublistId: "landedcostdata",
              }) || 0;
              subrec.insertLine({
                sublistId: "landedcostdata",
                line: idx_subrec,
              });
              // log.debug("tes_2", "tes_2");
              subrec.setSublistValue({
                sublistId: "landedcostdata",
                fieldId: "costcategory",
                line: idx_subrec,
                value: item_cost_category,
              });
              // log.debug("tes_3", "tes_3");

              subrec.setSublistValue({
                sublistId: "landedcostdata",
                fieldId: "amount",
                line: idx_subrec,
                value: item_amount_landed_cost,
              });
              // log.debug("tes_4", "tes_4");
            }
          }
        }

        try {
          ir_data_to_update.setValue({
            fieldId: 'custbody_abj_gr_ib_number',
            value: ibIDform,
            ignoreFieldChange: true
          });
          var recId = ir_data_to_update.save();

          log.debug({
            title: "Record created successfully",
            details: "Id: " + recId,
          });

          success_gr_create_count += 1;
          var scc_msg =
            "Sucessfully Allocate Landed Cost" +
            " for GR DOC NO " +
            grDocNo +
            "<br/>";
          scc_messages += "&nbsp;" + scc_msg;
        } catch (e) {
          log.error({
            title: e.name,
            details: e.message,
          });
          var err_msg =
            "Failed to Allocate Landed Cost" +
            " for GR DOC NO " +
            grDocNo +
            " Error Name : " +
            e.name +
            " Message : " +
            e.message +
            "<br/>";
          failed_gr_create_count += 1;
          err_messages += "&nbsp;" + err_msg;
        }
      });

      //save alloc data to custom records
      var LcCostAllocs = search.create({
        type: 'customrecordabj_ib_cost_allocation',
        columns: ['internalid', 'custrecord_ca_ib_cost_category'],
        filters: [{
          name: 'custrecord_abj_ca_ib_number',
          operator: 'is',
          values: ibIDform
        }, ]
      }).run().getRange({
        start: 0,
        end: 4
      });

      var count = contextRequest.getLineCount({
        group: "sublist",
      });

      for (var j = 0; j < count; j++) {

        var item_cost_category = contextRequest.getSublistValue({
          group: "sublist",
          name: "sublist_gr_cost_category",
          line: j,
        });
        var rec_exists = false;
        var rec_internalid;
        for (i in LcCostAllocs) {
          var LcCostAlloc = LcCostAllocs[i];
          var costCategory_tocheck = LcCostAlloc.getValue({
            name: 'custrecord_ca_ib_cost_category'
          });
          if (costCategory_tocheck === item_cost_category) {
            rec_exists = true;
            rec_internalid = LcCostAlloc.getValue({
              name: 'internalid'
            });
            break;
          }
        }
        var recCostAlloc;
        if (rec_exists)
          recCostAlloc = record.load({
            type: "customrecordabj_ib_cost_allocation",
            id: rec_internalid,
            isDynamic: true
          })
        else
          recCostAlloc = record.create({
            type: "customrecordabj_ib_cost_allocation",
            isDynamic: true
          })

        recCostAlloc.setValue({
          fieldId: 'custrecord_abj_ca_ib_number',
          value: ibIDform,
          ignoreFieldChange: true
        });

        recCostAlloc.setValue({
          fieldId: 'custrecord_ca_ib_cost_category',
          value: item_cost_category,
          ignoreFieldChange: true
        });

        var exchange_rate = contextRequest.getSublistValue({
          group: "sublist",
          name: "sublist_gr_exchange",
          line: j,
        });
        var exchange_rate_2 = parseFloat(exchange_rate);
        recCostAlloc.setValue({
          fieldId: 'custrecord_ca_ib_cost_exchange_rate',
          value: exchange_rate_2.toFixed(13),
          ignoreFieldChange: true
        });
        recCostAlloc.setValue({
          fieldId: 'custrecord_exchangerate1',
          value: exchange_rate,
          ignoreFieldChange: true
        });

        var item_amount = contextRequest.getSublistValue({
          group: "sublist",
          name: "sublist_gr_amount",
          line: j,
        });

        recCostAlloc.setValue({
          fieldId: 'custrecord_ca_ib_cost_amount',
          value: item_amount,
          ignoreFieldChange: true
        });

        var currency_val = contextRequest.getSublistValue({
          group: "sublist",
          name: "sublist_gr_cost_currency",
          line: j,
        });
        recCostAlloc.setValue({
          fieldId: 'custrecord_ca_ib_cost_currency',
          value: currency_val,
          ignoreFieldChange: true
        });

        var item_alloc_method = contextRequest.getSublistValue({
          group: "sublist",
          name: "sublist_gr_cost_allocation_method",
          line: j,
        });

        recCostAlloc.setValue({
          fieldId: 'custrecord_ca_ib_cost_alloc_method',
          value: item_alloc_method,
          ignoreFieldChange: true
        });

        rec_internalid = recCostAlloc.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
      }

      var html = "<html><body>";
      if (success_gr_create_count > 0) {
        html += "<h3>" + scc_messages + "</h3>";
      }

      if (failed_gr_create_count > 0) {
        html += "<h3>" + err_messages + "</h3>";
      }

      html +=
        '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-2)" value="OK" />';
      html += "</body></html>";

      var form = serverWidget.createForm({
        title: "Result of Allocate Landed Cost",
      });

      if (success_gr_create_count > 0) {
        form.addPageInitMessage({
          type: message.Type.CONFIRMATION,
          title: "Success!",
          message: html,
        });
      }

      if (failed_gr_create_count > 0) {
        form.addPageInitMessage({
          type: message.Type.ERROR,
          title: "Failed!",
          message: html,
        });
      }

      context.response.writePage(form);

      var scriptObj = runtime.getCurrentScript();
      log.debug({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage()
      });
    }
  }

  // var scriptObj = runtime.getCurrentScript();
  // log.debug({
  //   title: "Remaining usage units: ",
  //   details: scriptObj.getRemainingUsage()
  // });

  return {
    onRequest: onRequest,
  };
});