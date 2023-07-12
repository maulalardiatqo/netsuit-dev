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
    }
  }

  return {
    onRequest: onRequest,
  };
});
