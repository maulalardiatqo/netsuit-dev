/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/search",
  "N/currentRecord",
  "N/query",
  "N/record",
  "N/format",
  "N/ui/dialog",
  "N/runtime",
  "N/ui/message",
], function(search, currentRecord, query, record, format, dialog, runtime, message) {
  var exports = {};

  function getPOAmount(purchaseOrder, internalid) {
    var purchaseOrderData = search.load({
      id: 'customsearch_abj_vendor_prepayment_po',
    });
    purchaseOrderData.filters.push(
      search.createFilter({
        name: "internalid",
        operator: search.Operator.IS,
        values: purchaseOrder,
      })
    );
    if (internalid) {
      purchaseOrderData.filters.push(
        search.createFilter({
          name: "internalid",
          join: "applyingtransaction",
          operator: search.Operator.NONEOF,
          values: internalid,
        })
      );
    }
    var poDataset = purchaseOrderData.run();
    purchaseOrderData = poDataset.getRange(0, 1);

    log.debug("purchaseOrderData", purchaseOrderData);

    var vendorPrepaymentAmount;
    var poAmount;
    purchaseOrderData.forEach(function(prOrder) {

      vendorPrepaymentAmount = prOrder.getValue({
        name: poDataset.columns[2],
      }) || 0;
      console.log("vendorPrepaymentAmount", vendorPrepaymentAmount);

      poAmount = prOrder.getValue({
        name: poDataset.columns[3],
      }) || 0;
      console.log("poAmount", poAmount);
    });

    return {
      vendorPrepaymentAmount: vendorPrepaymentAmount,
      poAmount: poAmount
    };
  }

  function pageInit(context) {
    var rec = context.currentRecord;
    var purchaseOrder = rec.getValue('purchaseorder');
    var internalid = rec.getValue('internalid');
    log.debug("purchaseOrder Page init", purchaseOrder);
    if (purchaseOrder) {
      let dataPO = getPOAmount(purchaseOrder, internalid);
      log.debug("dataPOInit", dataPO);
      let amount = parseFloat(dataPO.vendorPrepaymentAmount) + parseFloat(dataPO.poAmount);
      if (amount < 0) {
        rec.setValue({
          fieldId: "payment",
          value: 1,
        });
      } else {
        rec.setValue({
          fieldId: "payment",
          value: amount || 1,
        });
      }
    }
  }

  function saveRecord(context) {
    var rec = context.currentRecord;
    var paymentAmount = rec.getValue('payment');
    var purchaseOrder = rec.getValue('purchaseorder');
    var internalid = rec.id;
    log.debug("internalid", internalid);
    // console.log("purchaseOrder", purchaseOrder);
    log.debug("purchaseOrder", purchaseOrder);

    if (purchaseOrder) {
      var dataPO = getPOAmount(purchaseOrder, internalid);
      console.log("dataPO", dataPO);
      var amount = parseFloat(dataPO.vendorPrepaymentAmount) + parseFloat(dataPO.poAmount);
      console.log("amount", amount);
      if (Number(paymentAmount) > Number(amount)) {
        let failed_dialog = {
          title: 'Error',
          message: `The Amount of payment cannot be greater than the Amount of PO. Payment Amount : ${paymentAmount} PO Amount : ${amount}`
        };
        dialog.alert(failed_dialog);
        return false;
      }
    }
    return true;
  }


  exports.saveRecord = saveRecord;
  exports.pageInit = pageInit;
  return exports;
});