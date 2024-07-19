/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
  function afterSubmit(context) {
    try {
      let rec = record.load({
        type: context.newRecord.type,
        id: context.newRecord.id,
        isDynamic: true,
      });
      let vendorID = rec.getValue("entity");
      log.debug('vendorId', vendorID);
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        log.debug('masuk sini')
        var lineTotal = rec.getLineCount({
          sublistId: "item",
        });
        for (var i = 0; i < lineTotal; i++) {
          let itemID = rec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var vendorSearchObj = search.create({
            type: "vendor",
            filters: [["internalid", "anyof", vendorID]],
            columns: ["entityid", "altname", "custentity_abj_ppn_type"],
          });
          var ppnType = "";
          var ppnTypeText = "";
          var searchResultCount = vendorSearchObj.runPaged().count;
          log.debug("vendorSearchObj result count", searchResultCount);
          vendorSearchObj.run().each(function (result) {
            ppnType = result.getValue("custentity_abj_ppn_type");
            ppnTypeText = result.getText("custentity_abj_ppn_type");
            return true;
          });
          rec.selectLine({
            sublistId: "item",
            line: i,
          });
          rec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "taxcode",
            value: ppnType,
          });
          if (ppnType != "5" && ppnType != "6") {
            let rate =
              rec.getSublistValue({
                sublistId: "item",
                fieldId: "rate",
                line: i,
              }) || 0;
            let quantity = rec.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
            });
            var rateOfPpn = search.lookupFields({
              type: "salestaxitem",
              id: ppnType,
              columns: ["custrecord_abj_rate_ppn_include"],
            });
            var percentRate = Number(rateOfPpn.custrecord_abj_rate_ppn_include);
            log.debug("percentRate", percentRate);
            if (percentRate) {
              var persentasePajak = percentRate / 100;
              var totalBelanja = parseFloat(rate);
              var DPP = parseFloat(totalBelanja / (1 + persentasePajak)).toFixed(2);
              var PPN = parseFloat(DPP * persentasePajak).toFixed(2);
              var amount = parseFloat(DPP) * parseFloat(quantity);
              var grossAmount = parseFloat(amount) + parseFloat(PPN);
              log.debug("DPP", {
                DPP: DPP,
                PPN: PPN,
                amount: amount,
                grossAmount: grossAmount,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: DPP,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: amount,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "tax1amt",
                value: PPN,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "grossamt",
                value: grossAmount,
              });
            }
          }
          rec.commitLine("item");
        }
        rec.save({
          enableSourcing: true,
          ignoreMandatoryFields: true,
        });
      }
    } catch (e) {
      err_messages = "error in before submit " + e.name + ": " + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});
