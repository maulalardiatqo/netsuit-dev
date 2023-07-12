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
], function (serverWidget, search, record, message, url, redirect) {
  function onRequest(context) {
    var contextRequest = context.request;
    var ibId = contextRequest.parameters.ibid;

    if (contextRequest.method === "GET") {
      rec_inbound = record.load({
        type: "inboundshipment",
        id: ibId,
      });
      let shipmentNumber = rec_inbound.getValue("shipmentnumber");
      let dateCreated = rec_inbound.getValue("shipmentcreateddate");
      let externalDocNum = rec_inbound.getValue("externaldocumentnumber");

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
          label: "Shipment Number	",
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

      var gr_allocationMethodField = sublist
        .addField({
          id: "sublist_gr_cost_allocation_method",
          label: "COST ALLOCATION METHOD",
          type: serverWidget.FieldType.SELECT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      gr_allocationMethodField.addSelectOption({
        value: "quantity",
        text: "Quantity",
      });

      gr_allocationMethodField.addSelectOption({
        value: "weight",
        text: "Weight",
      });

      gr_allocationMethodField.addSelectOption({
        value: "price",
        text: "Price",
      });

      gr_allocationMethodField.addSelectOption({
        value: "item_wise",
        text: "Item Wise",
      });

      gr_costCategory.isMandatory = true;
      gr_amount.isMandatory = true;
      gr_allocationMethodField.isMandatory = true;

      form.addSubmitButton({
        label: "Allocate",
      });

      form.addButton({
        id: "close_btn",
        label: "Close",
        functionName: "window.history.go(-1)",
      });

      context.response.writePage(form);
    } else {
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
      datatranss = datatransset.getRange(0, 100);

      //looping only to sum all quantity
      var totalQty = 0;
      datatranss.forEach(function (datatrans) {
        var grId = datatrans.getValue({ name: datatransset.columns[2] });
        ir_data_to_update = record.load({
          type: record.Type.ITEM_RECEIPT,
          id: grId,
        });
        var lineTotal = ir_data_to_update.getLineCount({ sublistId: "item" });
        // looping for sum quantity
        for (var a = 0; a < lineTotal; a++) {
          var qty_a = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: a,
          });
          totalQty += qty_a;
        }
      });
      // log.debug("total QTY ALL", totalQty);

      // looping for data process
      var success_gr_create_count = 0;
      var failed_gr_create_count = 0;
      var err_messages = "";
      var scc_messages = "";
      datatranss.forEach(function (datatrans) {
        var grId = datatrans.getValue({ name: datatransset.columns[2] });
        var grDocNo = datatrans.getValue({ name: datatransset.columns[3] });
        ir_data_to_update = record.load({
          type: "itemreceipt",
          id: grId,
        });
        // log.debug("GRID", grId);
        var lineTotal = ir_data_to_update.getLineCount({ sublistId: "item" });
        for (var i = 0; i < lineTotal; i++) {
          var qty = ir_data_to_update.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });

          var subrec = ir_data_to_update.getSublistSubrecord({
            sublistId: "item",
            fieldId: "landedcost",
            line: i,
          });

          var totalLandedNow = subrec.getLineCount({
            sublistId: "landedcostdata",
          });
          log.debug("line total landed", totalLandedNow);

          for (var n = totalLandedNow; n >= 0; n--) {
            log.debug("running line delete ", n + " of " + totalLandedNow);
            subrec.removeLine({
              sublistId: "landedcostdata",
              line: n,
              ignoreRecalc: true,
            });
            log.debug("removed", "Line " + i + " has been removed.");
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

            var item_amount = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_amount",
              line: j,
            });

            var item_alloc_method = contextRequest.getSublistValue({
              group: "sublist",
              name: "sublist_gr_cost_allocation_method",
              line: j,
            });

            if (item_alloc_method === "quantity") {
              var item_amount_landed_cost = Number(
                (item_amount / totalQty) * qty
              ).toFixed(3);

              // log.debug("item_amount", item_amount);
              // log.debug("totalQty", totalQty);
              // log.debug("qty", qty);
              // log.debug("item_amount_landed_cost", item_amount_landed_cost);

              subrec.insertLine({
                sublistId: "landedcostdata",
                line: j,
              });

              subrec.setSublistValue({
                sublistId: "landedcostdata",
                fieldId: "costcategory",
                line: j,
                value: item_cost_category,
              });

              subrec.setSublistValue({
                sublistId: "landedcostdata",
                fieldId: "amount",
                line: j,
                value: item_amount_landed_cost,
              });
            }
          }
        }

        try {
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
      // context.response.write(html);
      // redirect.redirect({ url: inbound_url });
      // log.debug("Success Message", scc_messages);
      // log.debug("Error Message", err_messages);
      // log.debug("Count Success", success_gr_create_count);
      // log.debug("Count Failed", failed_gr_create_count);
    }
  }

  return {
    onRequest: onRequest,
  };
});
