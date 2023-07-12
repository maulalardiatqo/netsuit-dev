/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/search",
  "N/currentRecord",
  "N/record",
  "N/ui/message",
  "N/ui/dialog",
], function(search, currentRecord, record, message, dialog) {
  var exports = {};

  function pageInit(scriptContext) {
    //
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    log.debug("type", rec.type);
    let type = rec.type;
    var modul;
    if (type.includes("itq")) {
      modul = "itq";
    } else if (type.includes("rfq")) {
      modul = "rfq";
    } else {
      modul = "rfp";
    }

    let unitPrice = rec.getValue("custrecord_sol_" + modul + "_price");
    console.log("unitPrice", unitPrice);
    let itemSelect = rec.getValue("custrecord_sol_" + modul + "_item");
    console.log("itemSelect", itemSelect);

    let itemRec = search.create({
      type: 'item',
      columns: ['internalid', 'expenseaccount'],
      filters: [{
        name: 'internalid',
        operator: 'is',
        values: itemSelect
      }, ]
    }).run().getRange({
      start: 0,
      end: 1
    });
    console.log("itemRec", itemRec);

    var typeExpense;
    itemRec.forEach(function(row) {
      let expenseAcc = row.getValue('expenseaccount');
      console.log("expenseAcc", expenseAcc);

      let accRec = record.load({
        type: "account",
        id: expenseAcc,
        isDynamic: true,
      });

      typeExpense = accRec.getValue('accttype');
    });

    console.log("typeExpense", typeExpense);
    if (typeExpense == "FixedAsset" && parseFloat(unitPrice) < 1000) {
      let failed_dialog = {
        title: "Error",
        message: "For Item Unit Price less than RM 1000, Please use expenses item code instead of Capex item code"
      };
      dialog.alert(failed_dialog);
      return false;
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});