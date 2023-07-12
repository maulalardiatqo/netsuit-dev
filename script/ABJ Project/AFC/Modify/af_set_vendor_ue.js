/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([
  "N/error",
  "N/log",
  "N/search",
  "N/record",
  "N/ui/dialog",
  "N/runtime",
], function(error, log, search, record, dialog, runtime) {
  function beforeSubmit(context) {}

  function beforeLoad(context) {
    var rec = context.newRecord;
    if (context.type == context.UserEventType.COPY) {
      for (var counter = 0; counter < 2; counter++) {
        var vsublistid = "item";
        if (counter == 1) {
          vsublistid = "expense";
        }
        var lineTotal = rec.getLineCount({
          sublistId: vsublistid,
        });
        for (var i = 0; i < lineTotal; i++) {
          rec.setSublistValue({
            sublistId: vsublistid,
            fieldId: "custcolafc_pr_rfq_no",
            line: i,
            value: "",
          });
        }
      }
    }
  }

  function beforeSubmit(context) {
    // to write off the budget amount when user change/edit the budget year/period/account
    log.debug("DEBUG", "before submit vendor RFQ");
    var rec = context.newRecord;
    var oldrec = context.oldRecord;
    var rectype = rec.type;
    try {
      if (
        context.type === context.UserEventType.CREATE ||
        context.type === context.UserEventType.EDIT
      ) {
        log.debug("oldrecord1", oldrec)

        var popVendor = rec.getValue("custrecord_rfq_populate_vendor");
        var category = rec.getValue("custrecord_abj_rfq_supp_category");
        log.debug("popVendor", popVendor)

        // var countVe = rec.getLineCount({
        //               sublistId: vsublistid
        //             });

        if (popVendor == true) {
          var resultSet = search
            .create({
              type: "vendor",
              columns: ["internalid", "category"],
              filters: [
                ["category", "is", category],
              ],
            })
            .run();
          // limit range maximum 4000
          var resultRange = resultSet.getRange({
            start: 0,
            end: 1000,
          });
          for (var i = 0; i < resultRange.length; i++) {
            var result = resultRange[i];
            var id_vendor = result.getValue("internalid");

            //   rec.selectLine({
            //     sublistId: "recmachcustrecord_abj_rfq_vdr_rfq",
            //     line: i,
            //   });

            //   rec.setCurrentSublistValue({
            //     sublistId: "recmachcustrecord_abj_rfq_vdr_rfq",
            //     fieldId: "name",
            //     value: id_vendor,
            //   });

            rec.setSublistValue({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
              fieldId: 'custrecord_abj_rfq_vdr',
              value: id_vendor,
              line: i
            });

            //   rec.commitLine(
            //     "recmachcustrecord_abj_rfq_vdr_rfq"
            //   );


          }
        }

      }
    } catch (e) {
      log.debug("error in before submit RFQ", e.name + ": " + e.message);
    }
  }

  function afterSubmit(context) {}

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
    beforeSubmit: beforeSubmit,
  };
});