/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
  function beforeLoad(context) {
    function remove_duplicates_in_list(arr) {
      var uniques = [];
      var itemsFound = {};
      for (var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if (itemsFound[stringified]) {
          continue;
        }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
      }
      return uniques;
    }
    try {
      if (context.type == context.UserEventType.CREATE) {
        log.debug("Debug", "Before Load");
        var poData = context.newRecord;
        var PO_lines, vendorID;
        if (context.request) {
          if (context.request.parameters) {
            vendorID = context.request.parameters.vendorID;
            log.debug("vendorID", vendorID);
            var POlinesStr = context.request.parameters.PO_lines;
            PO_lines = JSON.parse(POlinesStr);
            log.debug("PO_lines", PO_lines);
          }
        }
        if (vendorID) {
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });

          var currentEmployee = runtime.getCurrentUser();
          log.debug("currentEmployee", currentEmployee.id);
          poData.setValue({
            fieldId: "employee",
            value: currentEmployee.id,
          });
          poData.setValue({
            fieldId: "custbody_convert_from_pr",
            value: true,
          });

          var today = new Date();
          poData.setValue({
            fieldId: "trandate",
            value: today,
          });
          poData.setValue({
            fieldId: "entity",
            value: vendorID,
          });
          var line_idx = 0;
          var arrayPR = [];
          for (var i in PO_lines) {
            var POLine = PO_lines[i];
            var poItem = POLine.itemID;
            var poTanggalKirim = POLine.tanggalKirim;
            log.debug('poTanggalKirim', poTanggalKirim)
            var dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (typeof poTanggalKirim === 'string' && dateRegex.test(poTanggalKirim)) {
                poTanggalKirim = convertToDate(poTanggalKirim);
            }
            
            log.debug('poTanggalKirim', poTanggalKirim);
            
            function convertToDate(dateString) {
                var parts = dateString.split("/");
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1; // months are zero based
                var year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
            
            
            log.debug('poTanggalKirim after', poTanggalKirim)
            var poSalesRep = POLine.salesRepID;
            var poCustomerID = POLine.customerID;
            var incomingStock = POLine.incomingStock;
            var currentStock = POLine.currentStock;
            var quantity = POLine.quantity;
            var osPO = POLine.osPO;
            var forecastBusdev = POLine.forecastBusdev;
            var forecastPerhitungan = POLine.forecastPerhitungan;
            var avgBusdev = POLine.avgBusdev;
            var avgAccounting = POLine.avgAccounting;
            var units = POLine.units;
            var leadTimeKirim = POLine.leadTimeKirim;
            var itemRate = POLine.itemRate;
            var taxItem = POLine.taxItem;
            var soNO = POLine.soNO;
            var taxItemRate = POLine.taxItemRate;
            var poPackSize = POLine.packSize;
            var poSoNumber = POLine.soNumber;
            var internalIDPR = POLine.internalIDPR;
            arrayPR.push(internalIDPR);
            log.debug("poItem", poItem);
            log.debug('currentStock', currentStock)
            if (poItem) {
              poData.insertLine({
                sublistId: "item",
                line: line_idx,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: line_idx,
                value: poItem,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_onhand",
                line: line_idx,
                value: currentStock,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol5",
                line: line_idx,
                value: incomingStock,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol9",
                line: line_idx,
                value: forecastBusdev,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol8",
                line: line_idx,
                value: leadTimeKirim,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_pr_rumus_perhitungan",
                line: line_idx,
                value: forecastPerhitungan,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol10",
                line: line_idx,
                value: avgBusdev,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol11",
                line: line_idx,
                value: avgAccounting,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol6",
                line: line_idx,
                value: osPO,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "customer",
                line: line_idx,
                value: poCustomerID,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_no_so",
                line: line_idx,
                value: soNO,
              });
              if (poTanggalKirim != " ") {
                poData.setSublistValue({
                  sublistId: "item",
                  fieldId: "custcol14",
                  line: line_idx,
                  value: new Date(poTanggalKirim),
                });
              }
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_sales_rep_line",
                line: line_idx,
                value: poSalesRep,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol12",
                line: line_idx,
                value: poPackSize,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_abj_sales_order_number",
                line: line_idx,
                value: poSoNumber,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "unit",
                line: line_idx,
                value: units,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                line: line_idx,
                value: itemRate,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: line_idx,
                value: quantity,
              });
              poData.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: line_idx,
                value: parseFloat(quantity || 0) * parseFloat(itemRate || 0),
              });
              line_idx++;
            }
          }

          arrayPR = remove_duplicates_in_list(arrayPR);
          poData.setValue({
            fieldId: "custbody_convert_from_prid",
            value: arrayPR,
          });
          log.debug('arrayPR', arrayPR)
          var dataTerakhir = arrayPR[arrayPR.length - 1];
          log.debug('dataTerakhir', dataTerakhir)
           poData.setValue({
            fieldId: "custbody_abj_pr_number",
            value: dataTerakhir,
          });
       
          
        }
      }
    } catch (e) {
      log.debug("Error in before load", e.name + " : " + e.message);
    }
  }

  function beforeSubmit(context) {
    if (context.type == context.UserEventType.CREATE) {
      var dataRec = context.newRecord;
      var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
      log.debug("isConvertPR", isConvertPR);
      if (isConvertPR) {
        dataRec.setValue({
          fieldId: "customform",
          value: 104,
          ignoreFieldChange: true,
        });
      }
    }
  }

  function afterSubmit(context) {
    if (context.type == context.UserEventType.CREATE) {
      var dataRec = context.newRecord;
      var dataRecID = context.newRecord.id;
      var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
      var fromPRID = dataRec.getValue("custbody_convert_from_prid");
      log.debug("fromPRID", fromPRID);
      if (isConvertPR && fromPRID) {
        fromPRID.forEach(function (internalid) {
          log.debug("internalid", internalid);
          var prData = record.load({
            type: "purchaseorder",
            id: internalid,
            isDynamic: false,
          });
          prData.setValue({
            fieldId: "custbody_po_converted",
            value: dataRecID,
            ignoreFieldChange: true,
          });
          prData.save({
            enableSourcing: true,
            ignoreMandatoryFields: true,
          });
        });
      }
    }
  }

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
