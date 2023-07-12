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

  function validateLine(context) {
    let rec = context.currentRecord;
    let unitPrice = rec.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "estimatedamount",
    });
    let itemSelect = rec.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "item",
    });

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
  exports.validateLine = validateLine;

  return exports;
});