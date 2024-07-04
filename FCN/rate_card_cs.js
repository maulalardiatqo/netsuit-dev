/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/currentRecord", "N/search"], function (currentRecord, search) {
  var exports = {};
  var currentRecordObj = currentRecord.get();

  function pageInit(context) {}

  function fieldChanged(context) {
    var sublistFieldName = context.fieldId;
    console.log("sublistFieldName", sublistFieldName);
    var rateHourType = currentRecordObj.getValue("custrecord_abj_rate_hour_type");
    try {
      if (sublistFieldName == "custrecord_abj_rate_hour_type") {
        var lineTotal = currentRecordObj.getLineCount({
          sublistId: "recmachcustrecord_abj_ratecard_id",
        });
        console.log("lineTotal", lineTotal);
        for (var i = 0; i < lineTotal; i++) {
          currentRecordObj.selectLine({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            line: i,
          });
          var position = currentRecordObj.getCurrentSublistValue({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            fieldId: "custrecord_abj_ratecard_hours_position",
          });
          console.log("data", {
            position: position,
            rateHourType: rateHourType,
          });
          var customrecord_abj_ratecard_hoursinputSearchObj = search.create({
            type: "customrecord_abj_man_hour_rate",
            filters: [["custrecord_abj_manhour_position", "anyof", position], "AND", ["custrecord__abj_manhour_tier", "anyof", rateHourType]],
            columns: ["custrecord_abj_manhour_position", "custrecord_abj_manhour_rate", "custrecord__abj_manhour_tier"],
          });
          var ratePerHour = 0;
          customrecord_abj_ratecard_hoursinputSearchObj.run().each(function (result) {
            ratePerHour = result.getValue("custrecord_abj_manhour_rate");
          });
          console.log("ratePerHour", ratePerHour);
          currentRecordObj.setCurrentSublistValue({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            fieldId: "custrecord_abj_ratecard_hours_rate",
            value: ratePerHour,
          });
          currentRecordObj.commitLine({
            sublistId: "recmachcustrecord_abj_ratecard_id",
          });
        }
      } else if (sublistFieldName == "custrecord_abj_rate_card_item_name") {
        var itemID = currentRecordObj.getValue("custrecord_abj_rate_card_item_name");
        var serviceitemSearchObj = search.create({
          type: "serviceitem",
          filters: [["type", "anyof", "Service"], "AND", ["internalid", "anyof", itemID]],
          columns: ["itemid", "salesdescription"],
        });
        var searchResultCount = serviceitemSearchObj.runPaged().count;
        log.debug("serviceitemSearchObj result count", searchResultCount);
        var description = "";
        serviceitemSearchObj.run().each(function (result) {
          description = result.getValue("salesdescription");
        });
        currentRecordObj.setValue({
          fieldId: "custrecord_abj_rate_card_desc",
          value: description,
          ignoreFieldChange: true,
        });
      } else if (rateHourType && context.sublistId === "recmachcustrecord_abj_ratecard_id" && sublistFieldName == "custrecord_abj_ratecard_hours_position") {
        let position =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            fieldId: "custrecord_abj_ratecard_hours_position",
          }) || "0";

        var customrecord_abj_ratecard_hoursinputSearchObj = search.create({
          type: "customrecord_abj_man_hour_rate",
          filters: [["custrecord_abj_manhour_position", "anyof", position], "AND", ["custrecord__abj_manhour_tier", "anyof", rateHourType]],
          columns: ["custrecord_abj_manhour_position", "custrecord_abj_manhour_rate", "custrecord__abj_manhour_tier"],
        });
        var ratePerHour = 0;
        customrecord_abj_ratecard_hoursinputSearchObj.run().each(function (result) {
          ratePerHour = result.getValue("custrecord_abj_manhour_rate");
        });
        currentRecordObj.setCurrentSublistValue({
          sublistId: "recmachcustrecord_abj_ratecard_id",
          fieldId: "custrecord_abj_ratecard_hours_rate",
          value: ratePerHour,
          ignoreFieldChange: true,
        });
        console.log("after set", "ok");
      } else if (context.sublistId === "recmachcustrecord_abj_ratecard_id" && sublistFieldName == "custrecord_abj_ratecard_hours") {
        let ratePerHour =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            fieldId: "custrecord_abj_ratecard_hours_rate",
          }) || 0;
        let hours =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "recmachcustrecord_abj_ratecard_id",
            fieldId: "custrecord_abj_ratecard_hours",
          }) || 0;
        let totalHours = parseFloat(ratePerHour) * parseFloat(hours);
        currentRecordObj.setCurrentSublistValue({
          sublistId: "recmachcustrecord_abj_ratecard_id",
          fieldId: "custrecord_abj_ratecard_hours_total",
          value: totalHours,
          ignoreFieldChange: true,
        });
      }
    } catch (e) {
      log.debug("Error in sublistChanged", e.name + " : " + e.message);
    }
  }

  function sublistChanged(context) {
    var vrecord = context.currentRecord;
    var lineTotal = vrecord.getLineCount({
      sublistId: context.sublistId,
    });
    var totalAmount = 0;
    for (var i = 0; i < lineTotal; i++) {
      var amountTrans =
        vrecord.getSublistValue({
          sublistId: context.sublistId,
          fieldId: "custrecord_abj_ratecard_hours_total",
          line: i,
        }) || 0;
      totalAmount += parseFloat(amountTrans);
    }
    vrecord.setValue({
      fieldId: "custrecord_abj_rate_card_total_amount",
      value: totalAmount.toFixed(2),
      ignoreFieldChange: true,
    });
  }

  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  exports.sublistChanged = sublistChanged;
  return exports;
});
