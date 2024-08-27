/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/currentRecord"], function (currentRecord) {
  var exports = {};
  var currentRecordObj = currentRecord.get();

  function pageInit(context) {}

  function hitungTotalOrder(onhand, incoming, os_po, buffer){
    var total = onhand+incoming-os_po-buffer;
    return total;
  }

  function fieldChanged(context) {
    var sublistFieldName = context.fieldId;
    console.log("sublistFieldName", sublistFieldName);
    try {
      if (context.sublistId === "item" && sublistFieldName == "custcol10") {
        console.log("sublistChanged");
        var avgBusdev = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol10",
          }) || 0
        );
        var leadTime = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol8",
          }) || 0
        );

        var total = avgBusdev * leadTime;
        console.log("data", {
          avgBusdev: avgBusdev,
          leadTime: leadTime,
          total: Math.abs(total),
          type: typeof Math.abs(total),
        });
        currentRecordObj.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_pr_rumus_perhitungan",
          value: Math.abs(total),
          ignoreFieldChange: true,
        });
        console.log("after set", "ok");
      }

      if (context.sublistId === "item" && sublistFieldName == "custcol9") {
        var onhand = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_abj_onhand",
          }) || 0
        );
        var incoming = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol5", // incoming stock
          }) || 0
        );
        var os_po = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol6", // os_po
          }) || 0
        );
        var buffer = Number(
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol9", // forecast buffer
          }) || 0
        );

        log.debug('data', 'onhand : '+onhand+' | incoming : '+incoming+' | os_po : '+os_po+' | buffer : '+buffer);
        var total_order = hitungTotalOrder(onhand, incoming, os_po, buffer) || 0;
        log.debug('total_order', total_order);
        currentRecordObj.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_pr_total_order",
          value: total_order,
          ignoreFieldChange: true,
        });
        console.log("after set total order", "ok");
      }

    } catch (e) {
      log.debug("Error in sublistChanged", e.name + " : " + e.message);
    }
  }

  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  return exports;
});
