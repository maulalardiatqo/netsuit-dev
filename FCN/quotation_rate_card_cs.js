/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/currentRecord", "N/search", "N/url"], function (currentRecord, search, url) {
  var exports = {};
  var currentRecordObj = currentRecord.get();

  function pageInit(context) {}

  function fieldChanged(context) {
    var sublistFieldName = context.fieldId;
    console.log("sublistFieldName", sublistFieldName);
    var tierType = currentRecordObj.getValue("custbody_abj_quotation_tier");
    try {
      console.log('tierType', tierType);
      if (tierType && context.sublistId === "item" && sublistFieldName == "custcol_abj_complexity_level_line") {
        console.log('masuk kondisi')
        let itemID =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
          }) || "0";

        let complexcityLevelID =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_abj_complexity_level_line",
          }) || "0";

        var customrecord_abj_ratecard_hoursinputSearchObj = search.create({
          type: "customrecord_abj_ratecard_hoursinput",
          filters: [["custrecord_abj_ratecard_id.custrecord_abj_rate_card_item_name", "anyof", itemID], "AND", ["custrecord_abj_ratecard_id.custrecord_abj_ratecard_complexity_level", "anyof", complexcityLevelID], "AND", ["custrecord_abj_ratecard_id.custrecord_abj_rate_hour_type", "anyof", tierType]],
          columns: ["custrecord_abj_ratecard_hours_position", "custrecord_abj_ratecard_hours_rate", "custrecord_abj_ratecard_hours", "custrecord_abj_ratecard_hours_total"],
        });
        console.log('customrecord_abj_ratecard_hoursinputSearchObj', customrecord_abj_ratecard_hoursinputSearchObj)
        var rateTotal = 0;
        customrecord_abj_ratecard_hoursinputSearchObj.run().each(function (result) {
          rateTotal += parseFloat(result.getValue("custrecord_abj_ratecard_hours_total") || 0);
          return true;
        });
        console.log("rateTotal", rateTotal);
        currentRecordObj.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: rateTotal,
          ignoreFieldChange: true,
        });
        let qty =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
          }) || "0";
        currentRecordObj.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: rateTotal * parseFloat(qty),
          ignoreFieldChange: true,
        });
        console.log("after set", "ok");
      } else if (context.sublistId === "item" && sublistFieldName == "quantity") {
        let complexcityLevelID =
          currentRecordObj.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_abj_complexity_level_line",
          }) || "0";
        if (complexcityLevelID) {
          let qty =
            currentRecordObj.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
            }) || 0;
          let rate =
            currentRecordObj.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "rate",
            }) || 0;
          currentRecordObj.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: parseFloat(rate) * parseFloat(qty),
            ignoreFieldChange: true,
          });
        }
      }
    } catch (e) {
      log.debug("Error in sublistChanged", e.name + " : " + e.message);
    }
  }

  function printPDF() {
    var id = currentRecordObj.id;
    var createPDFURL = url.resolveScript({
      scriptId: "customscript1141",
      deploymentId: "customdeploy1",
      returnExternalUrl: false,
    });
    console.log("id", id);
    console.log("urlpdf", createPDFURL);
    createPDFURL += "&id=" + id;
    if (createPDFURL) {
      newWindow = window.open(createPDFURL);
    }
  }
  function sendMail() {
    console.log("test in function");
    var records = currentRecord.get(); 
    var id = records.id;
    var createPDFURL = url.resolveScript({
        scriptId: 'customscript_abj_sl_send_email_quotation',
        deploymentId: 'customdeploy_abj_sl_send_email_quotation',
        returnExternalUrl: false
    });
    console.log("id", id);
    console.log("urlpdf", createPDFURL);
    createPDFURL += '&id=' + id;
    if (createPDFURL) {
        window.location.href = createPDFURL;
    }
  }

  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  exports.printPDF = printPDF;
  exports.sendMail = sendMail;
  return exports;
});
