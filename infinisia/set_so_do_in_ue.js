/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        var rec = context.newRecord;
        var recID = context.newRecord.id;
        let salesOrderID = rec.getValue("createdfrom");
        let createdFromType = rec.getValue("ordertype");
        log.debug("data", {
          recID: recID,
          salesOrderID: salesOrderID,
          createdFromType: createdFromType,
        });
        if (createdFromType == "SalesOrd") {
          var intIDInv = "";
          var invoiceSearchObj = search.create({
            type: "invoice",
            filters: [["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["createdfrom", "anyof", salesOrderID]],
            columns: ["trandate", "internalid"],
          });
          var searchResultCount = invoiceSearchObj.runPaged().count;
          log.debug("invoiceSearchObj result count", searchResultCount);
          invoiceSearchObj.run().each(function (result) {
            intIDInv = result.getValue("internalid");
            return true;
          });
          var dataRec = record.load({
            type: "invoice",
            id: intIDInv,
          });
          dataRec.setValue({
            fieldId: "custbody3",
            value: recID,
            ignoreFieldChange: true,
          });
          dataRec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true,
          });
        }
      }
    } catch (e) {
      err_messages = "error in after submit " + e.name + ": " + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});
