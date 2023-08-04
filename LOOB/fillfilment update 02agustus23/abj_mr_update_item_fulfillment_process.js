/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * created by Rangga
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format'],
  function(search, record, email, runtime, error, format) {
    function handleErrorAndSendNotification(e, stage) {
      var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id + ' failed for stage: ' + stage;
      var body = 'An error occurred with the following information:\n' +
        'Error code: ' + e.name + '\n' +
        'Error msg: ' + e.message;
      log.debug(subject, body);
      var err_message = subject + ' ' + body;
      return err_message;
    }

    function handleErrorIfAny(summary) {
      var inputSummary = summary.inputSummary;
      var mapSummary = summary.mapSummary;
      var reduceSummary = summary.reduceSummary;
      var err_message = '';
      if (inputSummary.error) {
        var e = error.create({
          name: 'INPUT_STAGE_FAILED',
          message: inputSummary.error
        });
        err_message += handleErrorAndSendNotification(e, 'getInputData');
      }

      err_message += handleErrorInStage('map', mapSummary);
      err_message += handleErrorInStage('reduce', reduceSummary);
      return err_message;
    }

    function handleErrorInStage(stage, summary) {
      var errorMsg = [];
      summary.errors.iterator().each(function(key, value) {
        var msg = 'Failure to update fullfillment for IF Id : ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
        errorMsg.push(msg);
        return true;
      });
      var err_message = '';
      if (errorMsg.length > 0) {
        var e = error.create({
          name: 'RECORD_TRANSFORM_FAILED',
          message: JSON.stringify(errorMsg)
        });
        err_message += handleErrorAndSendNotification(e, stage);
      }
      return err_message;
    }

    function getAllResults(s) {
      var results = s.run();
      var searchResults = [];
      var searchid = 0;
      do {
        var resultslice = results.getRange({
          start: searchid,
          end: searchid + 1000
        });
        resultslice.forEach(function(slice) {
          searchResults.push(slice);
          searchid++;
        });
      } while (resultslice.length >= 1000);
      return searchResults;
    }

    function getInputData() {
      var searchId = runtime.getCurrentScript().getParameter("custscriptupd_item_fulfillment_search_id");
      var fulfillToProcess = [];

      // new process

      var itemfulfillmnt_toprocess = search.load({
        id: searchId //'customsearchloob_item_fullfill_process'
      });
      var myResults = getAllResults(itemfulfillmnt_toprocess);
      let counter = 0;
      myResults.forEach(function(result) {
        counter++;
        if (counter <= 10000) {
          var internal_id = result.getValue("internalid");
          var so_id = result.getValue("custrecord_abj_if_so");
          var so_line_id = result.getValue("custrecord_abj_if_lineid");
          var so_item_id = result.getValue("custrecord_abj_if_item");
          var quantity = result.getValue("custrecord_abj_if_qty");
          var line_memo = result.getValue("custrecord_abj_if_line_memo");
          var if_int_id = result.getValue("custrecord_abj_if_it_id");
          var locationid = result.getValue("custrecord_sol_tfp_loc_list");
          var date_upload = result.getValue("custrecord_abj_if_date");
          var department_id = result.getValue("custrecord_abj_tfp_if_dept");
          var class_id = result.getValue("custrecord_abj_tfp_if_class");
          var unfulfill = result.getValue("custrecord_abj_fulfill");
          var so_internal_id = result.getValue("custrecord_abj_so_id");
          var so_status = result.getValue("custrecord_so_status");
          fulfillToProcess.push({
            id: internal_id,
            so_id: so_id,
            so_line_id: so_line_id,
            so_item_id: so_item_id,
            quantity: quantity,
            line_memo: line_memo,
            if_int_id: if_int_id,
            locationid: locationid,
            date_upload: date_upload,
            department_id: department_id,
            class_id: class_id,
            fulfillment_tick: unfulfill,
            so_internalid: so_internal_id,
            so_status: so_status,
          });
        }
      });

      // var startRange = 0;
      // var endRange = 1000;
      //
      // for (var i = 0; i < 10; i++) {
      //
      //   if (i == 0) {
      //     var startFrom = 0;
      //   } else {
      //     var startFrom = i + '001';
      //   }
      //   var startFromInt = parseInt(startFrom);
      //   log.debug("aa", {
      //     startRange: startFromInt,
      //     endRange: endRange
      //   });
      //
      //   var itemfulfillmnt_toprocess = search.load({
      //     id: searchId //'customsearchloob_item_fullfill_process'
      //   });
      //   var itemfulfillmnt_toprocess_set = itemfulfillmnt_toprocess.run();
      //   itemfulfillmnt_toprocess = itemfulfillmnt_toprocess_set.getRange(startFromInt, endRange);
      //
      //   //startRange += 1000;
      //   endRange += 1000;
      //
      //   if (itemfulfillmnt_toprocess.length > 0) {
      //     for (var j = 0; j < itemfulfillmnt_toprocess.length; j++) {
      //       var py = itemfulfillmnt_toprocess[j];
      //       var internal_id = py.getValue(itemfulfillmnt_toprocess_set.columns[0]);
      //       var so_id = py.getValue(itemfulfillmnt_toprocess_set.columns[1]);
      //       var so_line_id = py.getValue(itemfulfillmnt_toprocess_set.columns[3]);
      //       var so_item_id = py.getValue(itemfulfillmnt_toprocess_set.columns[4]);
      //       var quantity = py.getValue(itemfulfillmnt_toprocess_set.columns[5]);
      //       var line_memo = py.getValue(itemfulfillmnt_toprocess_set.columns[6]);
      //       var if_int_id = py.getValue(itemfulfillmnt_toprocess_set.columns[11]);
      //       var locationid = py.getValue(itemfulfillmnt_toprocess_set.columns[12]);
      //       var date_upload = py.getValue(itemfulfillmnt_toprocess_set.columns[13]);
      //       var department_id = py.getValue(itemfulfillmnt_toprocess_set.columns[15]);
      //       var class_id = py.getValue(itemfulfillmnt_toprocess_set.columns[17]);
      //       var unfulfill = py.getValue(itemfulfillmnt_toprocess_set.columns[18]);
      //       var so_internalid = py.getValue(itemfulfillmnt_toprocess_set.columns[19]);
      //       fulfillToProcess.push({
      //         id: internal_id,
      //         so_id: so_id,
      //         so_line_id: so_line_id,
      //         so_item_id: so_item_id,
      //         quantity: quantity,
      //         line_memo: line_memo,
      //         if_int_id: if_int_id,
      //         locationid: locationid,
      //         date_upload: date_upload,
      //         department_id: department_id,
      //         class_id: class_id,
      //         fulfillment_tick: unfulfill,
      //         so_internalid: so_internalid
      //       });
      //     }
      //   }
      // }
      log.debug("fulfillToProcess", fulfillToProcess);
      return fulfillToProcess;
    }

    function itm_fulfillmnt_process_Data(id, IfID, so_line_id, quantity, line_memo, location, dateToUpload, departement_id, class_id, fulfillment_tick, so_internalid, so_item_id, so_status) {
      this.id = id;
      this.IfID = IfID;
      this.so_line_id = so_line_id;
      this.quantity = quantity;
      this.line_memo = line_memo;
      this.location = location;
      this.dateToUpload = dateToUpload;
      this.departement_id = departement_id;
      this.class_id = class_id;
      this.fulfillment_tick = fulfillment_tick;
      this.so_internalid = so_internalid;
      this.so_item_id = so_item_id;
      this.so_status = so_status;
    }

    function map(context) {
      var searchResult = JSON.parse(context.value);
      // log.debug("searchResult", searchResult);
      var IfID = searchResult.if_int_id;
      var itm_fulfillmnt_process = new itm_fulfillmnt_process_Data(
        searchResult.id,
        IfID,
        searchResult.so_line_id,
        searchResult.quantity,
        searchResult.line_memo,
        searchResult.locationid,
        searchResult.date_upload,
        searchResult.department_id,
        searchResult.class_id,
        searchResult.fulfillment_tick,
        searchResult.so_internalid,
        searchResult.so_item_id,
        searchResult.so_status
      );

      context.write({
        key: IfID,
        value: itm_fulfillmnt_process
      });
    }

    function reduce(context) {
      var IfID = context.key;
      var SalesOrderNo = IfID;
      var itemfulfillmnt_toprocess = context.values;
      var itm_fulfillmnt_process_id = 0;
      log.debug('itemfulfillmnt_toprocess', itemfulfillmnt_toprocess);

      function UpdateProcessedFalse(Status, SalesOrderNo, itm_fulfillmnt_skipped_ids, errMessage) {
        var ItmFulfillmntProcessToUpdate = search.create({
          type: 'customrecord_abj_if_bulk',
          columns: ['internalid', 'custrecord_abj_if_it_id'],
          filters: [{
            name: 'custrecord_abj_if_it_id',
            operator: 'is',
            values: SalesOrderNo
          }, ]
        });
        
        // log.debug('fulfillment_id', fulfillment_id)
        if (itm_fulfillmnt_skipped_ids.length > 0) {
          ItmFulfillmntProcessToUpdate.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: itm_fulfillmnt_skipped_ids
          }));
        }
        var ItmFulfillmntProcessToUpdateset = ItmFulfillmntProcessToUpdate.run();
        ItmFulfillmntProcessToUpdate = ItmFulfillmntProcessToUpdateset.getRange(0, 1000);
        ItmFulfillmntProcessToUpdate.forEach(function(itemfulfillmnt) {
          var ItmFulfillmntProcessId = itemfulfillmnt.getValue({
            name: 'internalid'
          });
          var recItmFulfillmntProcess = record.load({
            type: 'customrecord_abj_if_bulk',
            id: ItmFulfillmntProcessId,
            isDynamic: false
          });
          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_status',
            value: Status,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_error',
            value: errMessage,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      function UpdateProcessStatus(Status, itm_fulfillmnt_process_ids, fulfillment_id, err_message = '') {
        var ItmFulfillmntProcessToUpdate = search.create({
          type: 'customrecord_abj_if_bulk',
          columns: ['internalid'],
          filters: [{
            name: 'internalid',
            operator: 'anyof',
            values: itm_fulfillmnt_process_ids
          }, ]
        });


        var ItmFulfillmntProcessToUpdateset = ItmFulfillmntProcessToUpdate.run();
        ItmFulfillmntProcessToUpdate = ItmFulfillmntProcessToUpdateset.getRange(0, 1000);

        ItmFulfillmntProcessToUpdate.forEach(function(itemfulfillmnt) {
          var ItmFulfillmntProcessId = itemfulfillmnt.getValue({
            name: 'internalid'
          });
          var recItmFulfillmntProcess = record.load({
            type: 'customrecord_abj_if_bulk',
            id: ItmFulfillmntProcessId,
            isDynamic: false
          });
          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_status',
            value: Status,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_update',
            value: false,
            ignoreFieldChange: true
          });
          if (Status == 'Success') {
            recItmFulfillmntProcess.setValue({
              fieldId: 'custrecord_abj_if',
              value: fulfillment_id,
              ignoreFieldChange: true
            });
          }

          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_error',
            value: Status == 'Success' ? '' : err_message,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      try {
        // log.debug('itemfulfillmnt_toprocess',itemfulfillmnt_toprocess);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        log.debug('ifId', IfID)
        var fulfillment_rec = record.load({
          type: 'itemfulfillment',
          // id: '120454',
          id: IfID,
          isDynamic: true
        });

        // log.debug('fulfillment process','fulfill');
        var fulfillmntCount = 0;
        var fulfillfalse = 0;
        var billedso = 0;
        var itm_fulfillmnt_billed_ids = [];
        var itm_fulfillmnt_process_ids = [];
        var itm_fulfillmnt_skipped_ids = [];
        itemfulfillmnt_toprocess.forEach(function(itemfulfillmnt) {
          var itemfulfillmnts = JSON.parse(itemfulfillmnt);
          // log.debug('itemfulfillmnts', itemfulfillmnts);
          var so_line_id = itemfulfillmnts.so_line_id;
          var so_internal_id = itemfulfillmnts.so_internalid;
          log.debug('so_internalid', so_internal_id)
          var so_item_id = itemfulfillmnts.so_item_id;
          var so_status = itemfulfillmnts.so_status;
          log.debug('so_status', so_status)
          log.debug('sp_line_id', so_line_id);
          var if_line_to_update = fulfillment_rec.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'custcol_abj_agility_linenum',
            value: so_line_id
            // value:1
          });
          // log.debug('if_line_to_update', if_line_to_update);

          if (if_line_to_update > -1) {
            
              var itm_fulfillmnt_process_id = itemfulfillmnts.id;
            log.debug('itm_fulfillmnt_process_id', itm_fulfillmnt_process_id);
              if (so_status == 'fullyBilled') {
                
                billedso++;
                itm_fulfillmnt_billed_ids.push(itm_fulfillmnt_process_id);
              } else {
                log.debug('masuk else')
                itm_fulfillmnt_process_ids.push(itm_fulfillmnt_process_id);

                log.debug("if_line_to_update", if_line_to_update);
                var dateupload = itemfulfillmnts.dateToUpload;
                log.debug('dateToUpload', dateupload);
                var dateFormat = format.parse({
                  value: dateupload,
                  type: format.Type.DATE
                });
                var postingPeriod = months[dateFormat.getMonth()] + ' ' + dateFormat.getFullYear();
                var postingPeriodData = search.create({
                  type: "accountingperiod",
                  filters: [
                    ["periodname", "is", postingPeriod]
                  ],
                  columns: [
                    search.createColumn({
                      name: "periodname",
                      sort: search.Sort.ASC
                    }),
                    "internalid"
                  ]
                });
                log.debug("postingPeriodData", postingPeriodData);
                var searchResultCount = postingPeriodData.runPaged().count;
                // log.debug("periodData result count", searchResultCount);
                var postingPeriodID;
                postingPeriodData.run().each(function(result) {
                  postingPeriodID = result.getValue({
                    name: 'internalid'
                  });
                  return true;
                });
                log.debug('postingPeriodId', postingPeriodID)
                fulfillment_rec.setValue({
                  fieldId: 'trandate',
                  value: dateFormat,
                  ignoreFieldChange: true
                });
                fulfillment_rec.setValue({
                  fieldId: 'postingperiod',
                  value: postingPeriodID,
                  ignoreFieldChange: true
                });
                fulfillment_rec.selectLine({
                  sublistId: 'item',
                  line: if_line_to_update
                });
                var fulfillmenItemReceive = itemfulfillmnts.fulfillment_tick;
                // log.debug('tickUntick', fulfillmenItemReceive);
                if (fulfillmenItemReceive == 'T') {
                  log.debug("do unreceive", true);
                  fulfillment_rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: false
                  });
                } else {
                  // var qtySO = search.load({
                  //   id: 'customsearch_po_item_qty_2',
                  // });
                  //
                  // qtySO.filters.push(search.createFilter({
                  //   name: 'internalid',
                  //   operator: search.Operator.IS,
                  //   values: so_internal_id
                  // }));
                  // qtySO.filters.push(search.createFilter({
                  //   name: 'item',
                  //   operator: search.Operator.IS,
                  //   values: so_item_id
                  // }));
                  // var qtySOset = qtySO.run();
                  // qtySO = qtySOset.getRange({
                  //   start: 0,
                  //   end: 1
                  // });
                  // log.debug('qtySO', qtySO);
                  log.debug('so_internal_id', so_internal_id);
                  log.debug('so_item_id', so_item_id);
                  log.debug('so_line_id', so_line_id);
                  var qtySO = search.create({
                    type: "salesorder",
                    filters: [
                      ["mainline", "is", "F"],
                      "AND",
                      ["type", "anyof", "SalesOrd"],
                      "AND",
                      ["intercotransaction", "noneof", "@NONE@"],
                      "AND",
                      ["internalid", "anyof", so_internal_id],
                      "AND",
                      ["item", "anyof", so_item_id],
                      "AND",
                      ["custcol_abj_agility_linenum", "is", so_line_id]
                    ],
                    columns: [
                      "tranid",
                      "item",
                      "quantity",
                      "custcol_abj_agility_linenum",
                      "intercotransaction",
                      "quantityshiprecv",
                      "quantitypacked"
                    ]
                  });
                  var qtySOCount = qtySO.runPaged().count;
                  log.debug('qtySOCount', qtySOCount.length)
                  if (qtySOCount.length > 0) {
                    log.debug('in')
                    var qtySavedSearch = 0;
                    qtySO.run().each(function(result) {
                      qtySavedSearch = result.getValue("quantity");
                      return true;
                    });
                    // log.debug('qtySOin');
                    // var py = qtySO[0];
                    // var qtySavedSearch = py.getValue(qtySOset.columns[2]);
                    // log.debug('qtySavedSearch', qtySavedSearch);
                    // log.debug("do receive", true);
                    var quantity = itemfulfillmnts.quantity;
                    // log.debug('Quantity', quantity);
                    if (quantity > qtySavedSearch) {
                      // fulfillment_rec.setCurrentSublistValue({
                      //   sublistId: 'item',
                      //   fieldId: 'itemreceive',
                      //   value: false
                      // });
                      let index = itm_fulfillmnt_process_ids.indexOf(itm_fulfillmnt_process_id);
                      if (index > -1) {
                        itm_fulfillmnt_process_ids.splice(index, 1);
                      }
                      itm_fulfillmnt_skipped_ids.push(itm_fulfillmnt_process_id);
                      fulfillfalse++;
                    } else {
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: quantity
                      });
                      // fulfillment_rec.setCurrentSublistValue({
                      //   sublistId: 'item',
                      //   fieldId: 'itemreceive',
                      //   value: true
                      // });
                      var line_memo = itemfulfillmnts.line_memo;
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_agi_memo',
                        value: line_memo
                      });
                      var locationid = itemfulfillmnts.location;
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: locationid
                      });
                      var departmentid = itemfulfillmnts.departement_id;
                      // log.debug('departmentid', departmentid);
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'department',
                        value: departmentid
                      })
                      var classintid = itemfulfillmnts.class_id;
                      // log.debug('classintid', classintid);
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'class',
                        value: classintid
                      });
                    }
                  } else {
                    // log.debug("do receive", true);
                    var quantity = itemfulfillmnts.quantity;
                    // log.debug('Quantity', quantity);
                    var qtySum = fulfillment_rec.getCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'quantityremaining',
                    });
                    if (quantity > qtySum) {
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: qtySum
                      });
                    } else {
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: quantity
                      });
                    }
                    // fulfillment_rec.setCurrentSublistValue({
                    //   sublistId: 'item',
                    //   fieldId: 'itemreceive',
                    //   value: true
                    // });
                    var line_memo = itemfulfillmnts.line_memo;
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_abj_agi_memo',
                      value: line_memo
                    });
                    var locationid = itemfulfillmnts.location;
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'location',
                      value: locationid
                    });
                    var departmentid = itemfulfillmnts.departement_id;
                    // log.debug('departmentid', departmentid);
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'department',
                      value: departmentid
                    })
                    var classintid = itemfulfillmnts.class_id;
                    // log.debug('classintid', classintid);
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'class',
                      value: classintid
                    });
                  }
                }

                fulfillment_rec.commitLine('item');

                log.debug('fulfillment process loop',
                  'fulfillment process id :' + itm_fulfillmnt_process_id + ' ' +
                  'so_line_id :' + so_line_id + ' ' +
                  'quantity :' + quantity + ' ' +
                  'line_memo :' + line_memo + ' '
                );
                fulfillmntCount++;
              }
            
            }
            
        });
        log.debug('fulfillmntCount', fulfillmntCount);
        if (fulfillmntCount) {
          log.debug('masuk fulfillCount');
          var fulfillment_id = fulfillment_rec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          if (fulfillment_id) {
            UpdateProcessStatus('Success', itm_fulfillmnt_process_ids, fulfillment_id);
          }
        }
        log.debug('billedso', billedso);
        if(billedso){
          log.debug('masuk billedso',itm_fulfillmnt_billed_ids,);
          UpdateProcessedFalse('Error', SalesOrderNo, itm_fulfillmnt_billed_ids,'SO status is Billed');
        }
        log.debug('fulfillfalse', fulfillfalse)
        if (fulfillfalse) {
          UpdateProcessedFalse('Error', SalesOrderNo, itm_fulfillmnt_skipped_ids, 'Quantity is more than the receive quantity');
        }
        log.debug('ifID', IfID)
        context.write({
          key: IfID,
          value: itm_fulfillmnt_process_ids
        });
      } catch (e) {
        var err_msg = 'Failure to update fullfillment for IF Id: ' + IfID + ' ' + e.name + ': ' + e.message + '\n';
        UpdateProcessStatus('Failed', itm_fulfillmnt_process_ids, 0, err_msg);
      }
    }

    function summarize(summary) {
      handleErrorIfAny(summary);
      log.debug('Usage Consumed', summary.usage);
    }

    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };
  });