/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        let rec = context.newRecord;
        let dateToday = new Date();
        let dateSelected = rec.getValue("custrecord183");
        let subsidiary = rec.getValue("custrecord184");
        let clearingAccont = rec.getValue("custrecord186");
        // create INVENTORY ADJUSTMENT WIP/FINISH GOODS
        var adjustInvtr = record.create({
          type: "inventoryadjustment",
          isDynamic: true,
        });
        adjustInvtr.setValue({
          fieldId: "subsidiary",
          value: subsidiary,
        });
        adjustInvtr.setValue({
          fieldId: "trandate",
          value: dateSelected,
        });
        adjustInvtr.setValue({
          fieldId: "account",
          value: clearingAccont,
        });
        // get input items
        let lineTotal = rec.getLineCount({
          sublistId: "recmachcustrecord188",
        });
        for (let i = 0; i < lineTotal; i++) {
          let itemCode = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord189",
            line: i,
          });
          let location = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord203",
            line: i,
          });
          let description = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord190",
            line: i,
          });
          let quantity = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord191",
            line: i,
          });
          let units = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord192",
            line: i,
          });
          let rate = rec.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord193",
            line: i,
          });
          // set items INVENTORY ADJUSTMENT WIP/FINISH GOODS
          adjustInvtr.selectNewLine({
            sublistId: "inventory",
          });
          adjustInvtr.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "item",
            value: itemCode,
          });
          adjustInvtr.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "quantity",
            value: quantity,
          });
          adjustInvtr.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "location",
            value: location,
          });
          // end set items INVENTORY ADJUSTMENT WIP/FINISH GOODS
        }
        // end get input items
        // end create INVENTORY ADJUSTMENT WIP/FINISH GOODS
      }
    } catch (e) {
      err_messages = "error in after submit " + e.name + ": " + e.message;
      log.error(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});
