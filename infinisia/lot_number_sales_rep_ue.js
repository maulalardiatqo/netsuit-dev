/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/log", "N/search", "N/runtime"], function (record, log, search, runtime) {
  function afterSubmit(context) {
    if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
      try {
        let dataRec = context.newRecord;
        let newRecordID = dataRec.id;
        log.debug("data", {
          rec: dataRec,
          id: newRecordID,
        });

        let vsublistid = "item";
        var lineTotal = dataRec.getLineCount({
          sublistId: vsublistid,
        });
        log.debug("lineTotal", lineTotal);
        var araryItem = [];
        for (var i = 0; i < lineTotal; i++) {
          var lineItemID =
            dataRec.getSublistValue({
              sublistId: vsublistid,
              fieldId: "item",
              line: i,
            }) || "";
          var lineSalesRep =
            dataRec.getSublistValue({
              sublistId: vsublistid,
              fieldId: "custcol_abj_sales_rep_line",
              line: i,
            }) || "";
            var lineCustomer =
            dataRec.getSublistValue({
              sublistId: vsublistid,
              fieldId: "custcol_abj_customer_line",
              line: i,
            }) || "";
            var lineSoNumber =
            dataRec.getSublistValue({
              sublistId: vsublistid,
              fieldId: "custcol_abj_no_so",
              line: i,
            }) || "";
          if (lineSalesRep || lineCustomer || lineSoNumber) {
            let subrecInvtrDetail = dataRec.getSublistSubrecord({
              sublistId: "item",
              fieldId: "inventorydetail",
              line: i,
            });
            var totalInvtryDetail = subrecInvtrDetail.getLineCount({
              sublistId: "inventoryassignment",
            });
            log.debug("totalInvtryDetail", totalInvtryDetail);
            for (var j = 0; j < totalInvtryDetail; j++) {
              var idLotItem = subrecInvtrDetail.getSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "receiptinventorynumber",
                line: j,
              });
              log.debug("idLotItem", {
                idLotItem: idLotItem,
                lineSalesRep: lineSalesRep,
                lineCustomer: lineCustomer,
                lineSoNumber: lineSoNumber
              });
              var inventorynumberSearchObj = search.create({
                type: "inventorynumber",
                filters: [["inventorynumber", "is", idLotItem]],
                columns: ["internalid"],
              });
              var searchResultCount = inventorynumberSearchObj.runPaged().count;
              log.debug("inventorynumberSearchObj result count", searchResultCount);
              inventorynumberSearchObj.run().each(function (result) {
                let intIDLot = result.getValue("internalid");
                log.debug("intIDLot", intIDLot);
                var sampleRec = record.load({
                  type: "inventorynumber",
                  id: intIDLot,
                });
                sampleRec.setValue({
                  fieldId: "custitemnumber1",
                  value: lineSalesRep,
                  ignoreFieldChange: true,
                });
                sampleRec.setValue({
                  fieldId: "custitemnumber_lot_customer",
                  value: lineCustomer,
                  ignoreFieldChange: true,
                });
                sampleRec.setValue({
                  fieldId: "custitemnumber_lot_so_number",
                  value: lineSoNumber,
                  ignoreFieldChange: true,
                });
                var lotSave = sampleRec.save({
                  enableSourcing: true,
                  ignoreMandatoryFields: true,
                });
                log.debug("lotSave", lotSave);
                return true;
              });
            }
          }
        }
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage(),
        });
      } catch (ex) {
        log.error(ex.name, ex);
      }
    }
  }
  return {
    afterSubmit: afterSubmit,
  };
});
