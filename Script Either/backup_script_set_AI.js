/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format"], function (record, search, format) {
    function afterSubmit(context) {
      try {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
          var rec = context.newRecord;
          var dateToday = new Date();
          var dateSelected = rec.getValue("custrecord183");
          var subsidiary = rec.getValue("custrecord184");
          var clearingAccont = rec.getValue("custrecord186");
          var invtrAdjRM = rec.getValue("custrecord187");
          var invtrAdjWIP = rec.getValue("custrecord206");
          if (!invtrAdjRM) {
            // create INVENTORY ADJUSTMENT RM
            var lineTotalInput = rec.getLineCount({
              sublistId: "recmachcustrecord188",
            });
            if (lineTotalInput > 0) {
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
  
              for (let i = 0; i < lineTotalInput; i++) {
                let itemCode = rec.getSublistValue({
                  sublistId: "recmachcustrecord188",
                  fieldId: "custrecord189",
                  line: i,
                });
                log.debug("itemCode", itemCode);
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
                log.debug("units", units);
                let rate = rec.getSublistValue({
                  sublistId: "recmachcustrecord188",
                  fieldId: "custrecord193",
                  line: i,
                });
                // convert tominus
                quantity = -1 * quantity;
                log.debug("qty", quantity);
                // set items INVENTORY ADJUSTMENT RM
                log.debug("linee", true);
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
                  fieldId: "location",
                  value: location,
                });
                adjustInvtr.setCurrentSublistValue({
                  sublistId: "inventory",
                  fieldId: "adjustqtyby",
                  value: quantity,
                });
                adjustInvtr.setCurrentSublistValue({
                  sublistId: "inventory",
                  fieldId: "units",
                  value: units,
                });
                log.debug("linee 2", true);
                var subrecInvtrDetailAdjst = adjustInvtr.getCurrentSublistSubrecord({
                  sublistId: "inventory",
                  fieldId: "inventorydetail",
                });
                log.debug("linee 3", true);
                // get list lot number items
                var inventorydetailSearchObj = search.create({
                  type: "inventorydetail",
                  filters: [["item", "anyof", itemCode], "AND", ["location", "anyof", location], "AND", ["inventorynumber.quantityavailable", "greaterthan", "0"]],
                  columns: [
                    search.createColumn({
                      name: "inventorynumber",
                      summary: "GROUP",
                    }),
                    search.createColumn({
                      name: "status",
                      summary: "GROUP",
                    }),
                    search.createColumn({
                      name: "quantityavailable",
                      join: "inventoryNumber",
                      summary: "GROUP",
                    }),
                    
                  ],
                });
                var searchResultCount = inventorydetailSearchObj.runPaged().count;
                log.debug("inventorydetailSearchObj result count", searchResultCount);
                var status = '1'
                var snx = 0;
                var stopped = false;
                var inventoryStatusId = "1";
                inventorydetailSearchObj.run().each(function (result) {
                  if (!stopped) {
                    let inventorynumberID = result.getValue({
                      name: "inventorynumber",
                      summary: "GROUP",
                    });
                    let inventorynumberAvailable = result.getValue({
                      name: "quantityavailable",
                      join: "inventoryNumber",
                      summary: "GROUP",
                    });
                    let inventorynumberStatus = result.getValue({
                      name: "status",
                      summary: "GROUP",
                    });
                    let invUom = result.getValue({
                      name: "unit",
                      summary: "GROUP",
                    });
                    log.debug('invUom', invUom);
                    log.debug("inventorynumberid", {
                      inventorynumberID: inventorynumberID,
                      inventorynumberAvailable: inventorynumberAvailable,
                      inventorynumberStatus: inventorynumberStatus,
                    });
                    subrecInvtrDetailAdjst.selectLine({
                      sublistId: "inventoryassignment",
                      line: snx,
                    });
                    subrecInvtrDetailAdjst.setCurrentSublistValue({
                      sublistId: "inventoryassignment",
                      fieldId: "issueinventorynumber",
                      value: inventorynumberID,
                    });
                    subrecInvtrDetailAdjst.setCurrentSublistValue({
                      sublistId: "inventoryassignment",
                      fieldId: "inventorystatus",
                      value: inventorynumberStatus,
                    });
                    if (inventorynumberAvailable >= quantity) {
                      log.debug('masuk if')
                      subrecInvtrDetailAdjst.setCurrentSublistValue({
                        sublistId: "inventoryassignment",
                        fieldId: "quantity",
                        value: quantity,
                      });
                      stopped = true;
                    } else {
                      log.debug('masuk else')
                      subrecInvtrDetailAdjst.setCurrentSublistValue({
                        sublistId: "inventoryassignment",
                        fieldId: "quantity",
                        value: inventorynumberAvailable,
                      });
                      quantity -= inventorynumberAvailable;
                    }
                    subrecInvtrDetailAdjst.commitLine("inventoryassignment");
                    snx++;
                    return true;
                  }
                });
                adjustInvtr.commitLine("inventory");
              }
              var saveAdjust = adjustInvtr.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
              });
              log.debug("saveAdjust", saveAdjust);
              if (saveAdjust) {
                // rec.setValue({
                //     fieldId: "custrecord187",
                //     value: saveAdjust,
                //     ignoreFieldChange: true
                // });
                var recId = rec.id;
                log.debug("recid", recId);
                var otherId = record.submitFields({
                  type: "customrecord2269",
                  id: recId,
                  values: {
                    custrecord187: saveAdjust,
                  },
                });
                log.debug("otherId", otherId);
              }
              // var saveRec = rec.save({
              //     enableSourcing: true,
              //     ignoreMandatoryFields: true,
              // });
              // log.debug('saveRec', saveRec);
            }
          }
  
          if (!invtrAdjWIP) {
            log.debug("output", true);
            var lineTotalOutput = rec.getLineCount({
              sublistId: "recmachcustrecord194",
            });
            if (lineTotalOutput > 0) {
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
  
              for (let i = 0; i < lineTotalOutput; i++) {
                let itemCode = rec.getSublistValue({
                  sublistId: "recmachcustrecord194",
                  fieldId: "custrecord195",
                  line: i,
                });
                log.debug("itemCode", itemCode);
                let location = rec.getSublistValue({
                  sublistId: "recmachcustrecord194",
                  fieldId: "custrecord202",
                  line: i,
                });
                let description = rec.getSublistValue({
                  sublistId: "recmachcustrecord194",
                  fieldId: "custrecord190",
                  line: i,
                });
                let quantity = rec.getSublistValue({
                  sublistId: "recmachcustrecord194",
                  fieldId: "custrecord198",
                  line: i,
                });
                let units = rec.getSublistValue({
                  sublistId: "recmachcustrecord188",
                  fieldId: "custrecord199",
                  line: i,
                });
                let cost = rec.getSublistValue({
                  sublistId: "recmachcustrecord188",
                  fieldId: "custrecord200",
                  line: i,
                });
  
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
                  fieldId: "location",
                  value: location,
                });
                adjustInvtr.setCurrentSublistValue({
                  sublistId: "inventory",
                  fieldId: "adjustqtyby",
                  value: quantity,
                });
                adjustInvtr.setCurrentSublistValue({
                  sublistId: "inventory",
                  fieldId: "units",
                  value: units,
                });
                adjustInvtr.setCurrentSublistValue({
                  sublistId: "inventory",
                  fieldId: "unitcost",
                  value: cost,
                });
  
                // inv detail
  
                var subrecInvtrDetailAdjst = adjustInvtr.getCurrentSublistSubrecord({
                  sublistId: "inventory",
                  fieldId: "inventorydetail",
                });
                subrecInvtrDetailAdjst.selectNewLine({
                  sublistId: "inventoryassignment",
                });
                subrecInvtrDetailAdjst.setCurrentSublistValue({
                  sublistId: "inventoryassignment",
                  fieldId: "quantity",
                  value: quantity,
                });
                let currentDate = new Date();
                let formattedDate = format.format({
                  value: currentDate,
                  type: format.Type.DATE,
                  timezone: format.Timezone.ASIA_JAKARTA,
                });
                formattedDate = formattedDate.replace(/\//g, "");
                var numberInv = formattedDate;
                log.debug("numberInv", numberInv);
                subrecInvtrDetailAdjst.setCurrentSublistValue({
                  sublistId: "inventoryassignment",
                  fieldId: "receiptinventorynumber",
                  value: numberInv,
                });
                subrecInvtrDetailAdjst.commitLine({
                  sublistId: "inventoryassignment",
                });
                adjustInvtr.commitLine("inventory");
              }
              var saveAdjust = adjustInvtr.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
              });
              log.debug("saveAdjustOut", saveAdjust);
              if (saveAdjust) {
                var recId = rec.id;
                log.debug("recid", recId);
                var otherId = record.submitFields({
                  type: "customrecord2269",
                  id: recId,
                  values: {
                    custrecord206: saveAdjust,
                  },
                });
                log.debug("otherIdOut", otherId);
              }
            }
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
  