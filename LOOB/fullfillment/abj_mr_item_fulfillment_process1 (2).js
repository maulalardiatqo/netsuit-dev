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
        var msg = 'Failure to create fullfillment for sales order : ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
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
      var searchId = runtime.getCurrentScript().getParameter("custscriptitem_fulfillmnt_proc_search_id");
      var StartRange = runtime.getCurrentScript().getParameter('custscript_start_range_fulfill');
      var EndRange = runtime.getCurrentScript().getParameter('custscript_end_range_fulfill');
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
          var locationid = result.getValue("custrecord_sol_tfp_loc_list");
          var date_upload = result.getValue("custrecord_abj_if_date");
          var so_internal_id = result.getValue("custrecord_abj_so_id");
          var so_status = result.getValue("custrecord_so_status");
          fulfillToProcess.push({
            id: internal_id,
            so_id: so_id,
            so_line_id: so_line_id,
            so_item_id: so_item_id,
            quantity: quantity,
            line_memo: line_memo,
            locationid: locationid,
            date_upload: date_upload,
            so_internal_id: so_internal_id,
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
      //       var locationid = py.getValue(itemfulfillmnt_toprocess_set.columns[12]);
      //       var date_upload = py.getValue(itemfulfillmnt_toprocess_set.columns[13]);
      //       var so_internal_id = py.getValue(itemfulfillmnt_toprocess_set.columns[14]);
      //       var so_status = py.getValue(itemfulfillmnt_toprocess_set.columns[15]);
      //       fulfillToProcess.push({
      //         id: internal_id,
      //         so_id: so_id,
      //         so_line_id: so_line_id,
      //         so_item_id: so_item_id,
      //         quantity: quantity,
      //         line_memo: line_memo,
      //         locationid: locationid,
      //         date_upload: date_upload,
      //         so_internal_id: so_internal_id,
      //         so_status: so_status,
      //       });
      //     }
      //   }
      // }
      log.debug("fulfillToProcess", fulfillToProcess.length);
      return fulfillToProcess;
    }

    function itm_fulfillmnt_process_Data(id, so_id, locationid, so_item_id, so_line_id, quantity, line_memo, date_upload, so_internal_id, so_status) {
      this.id = id;
      this.so_id = so_id;
      this.locationid = locationid;
      this.so_item_id = so_item_id;
      this.so_line_id = so_line_id;
      this.quantity = quantity;
      this.line_memo = line_memo;
      this.date_upload = date_upload;
      this.so_internal_id = so_internal_id;
      this.so_status = so_status;
    }

    function map(context) {
      var searchResult = JSON.parse(context.value);
      // log.debug("searchResult", searchResult);
      var SalesOrderNo = searchResult.so_id;
      var itm_fulfillmnt_process = new itm_fulfillmnt_process_Data(
        searchResult.id,
        SalesOrderNo,
        searchResult.locationid,
        searchResult.so_item_id,
        searchResult.so_line_id,
        searchResult.quantity,
        searchResult.line_memo,
        searchResult.date_upload,
        searchResult.so_internal_id,
        searchResult.so_status
      );
      context.write({
        key: SalesOrderNo,
        value: itm_fulfillmnt_process
      });
    }

    function reduce(context) {
      var SalesOrderNo = context.key;
      // log.debug("SalesOrderNo", SalesOrderNo);
      var itemfulfillmnt_toprocess = context.values;
      var itm_fulfillmnt_process_id = 0;

      function UpdateProcessedFalse(Status, SalesOrderNo, itm_fulfillmnt_skipped_ids, errMessages) {
        var ItmFulfillmntProcessToUpdate = search.create({
          type: 'customrecord_abj_if_bulk',
          columns: ['internalid', 'custrecord_abj_if_so'],
          filters: [{
            name: 'custrecord_abj_if_so',
            operator: 'is',
            values: SalesOrderNo
          }, ]
        });
        // log.debug('fulfillment_id', fulfillment_id)
        if (itm_fulfillmnt_skipped_ids.length > 0) {
          log.debug('jumlahItemFulfillFalse', itm_fulfillmnt_skipped_ids.length);
          // log.debug('itm_fulfillmnt_skipped_ids', itm_fulfillmnt_skipped_ids);
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
            fieldId: 'custrecord_abj_if_create',
            value: false,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.setValue({
            fieldId: 'custrecord_abj_if_error',
            value: errMessages,
            ignoreFieldChange: true
          });
          recItmFulfillmntProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      function UpdateProcessStatus(Status, SalesOrderNo, itm_fulfillmnt_process_ids, fulfillment_id, err_message = '') {
        var ItmFulfillmntProcessToUpdate = search.create({
          type: 'customrecord_abj_if_bulk',
          columns: ['internalid', 'custrecord_abj_if_so'],
          filters: [{
            name: 'custrecord_abj_if_so',
            operator: 'is',
            values: SalesOrderNo
          }, ]
        });
        // log.debug('fulfillment_id', fulfillment_id)
        if (itm_fulfillmnt_process_ids.length > 0) {
          log.debug('jumlahItemFulfillUpdated', itm_fulfillmnt_process_ids.length);
          // log.debug('itm_fulfillmnt_process_ids', itm_fulfillmnt_process_ids);
          ItmFulfillmntProcessToUpdate.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: itm_fulfillmnt_process_ids
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
            fieldId: 'custrecord_abj_if_create',
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

      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var fullFilltrue = [];
      var fullFilltrueData = [];
      var soExecute = [];
      try {
        log.debug('itemfulfillmnt_toprocess', itemfulfillmnt_toprocess);
        // log.debug('itemfulfillmnt_toprocess length', itemfulfillmnt_toprocess.length);
        var find_so = search.create({
          type: 'salesorder',
          columns: ['internalid'],
          filters: [{
              name: 'tranid',
              operator: 'is',
              values: SalesOrderNo
            },
            {
              name: 'mainline',
              operator: 'is',
              values: true
            },
          ]
        }).run().getRange(0, 1000);
        var itm_fulfillmnt_process_ids = [];
        var itm_fulfillmnt_skipped_ids = [];
        var itm_fulfillmnt_billed_ids = [];
        var itm_fulfillmnt_agilitynull_ids = [];
        // log.debug("find_so", find_so);
        if (find_so.length > 0) {
          var so_internalid = find_so[0].getValue({
            name: 'internalid'
          });
          // log.debug('so_internalid', so_internalid);
          var fulfillment_rec = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: so_internalid,
            toType: record.Type.ITEM_FULFILLMENT,
            isDynamic: true,
          });

          var loop_head = 0;
          var fulfillcount = 0;
          var fulfillfalse = 0;
          var billedso = 0;
          var agilitynull = 0;
          var lineTotal = fulfillment_rec.getLineCount({
            sublistId: 'item'
          });
          var arrayProcess = [];
          itemfulfillmnt_toprocess.forEach(function(itemfulfillmnt) {
            var itemfulfillmnts = JSON.parse(itemfulfillmnt);
            var soID = itemfulfillmnts.so_id;
            var dateUpload = itemfulfillmnts.date_upload;
            var so_line_id = itemfulfillmnts.so_line_id;
            var locationid = itemfulfillmnts.locationid;
            var so_item_id = itemfulfillmnts.so_item_id;
            var itm_fulfillmnt_process_id = itemfulfillmnts.id;
            var quantity = itemfulfillmnts.quantity;
            var line_memo = itemfulfillmnts.line_memo;
            var so_internal_id = itemfulfillmnts.so_internal_id;
            var so_status = itemfulfillmnts.so_status;
            if (so_status == 'fullyBilled') {
              billedso++;
              itm_fulfillmnt_billed_ids.push(itm_fulfillmnt_process_id);
            } else {
              arrayProcess.push({
                so_id: soID,
                locationid: locationid,
                so_line_id: so_line_id,
                quantity: quantity,
                line_memo: line_memo,
                so_item_id: so_item_id,
                itm_fulfillmnt_process_id: itm_fulfillmnt_process_id,
                so_internal_id: so_internal_id,
                so_status: so_status,
              })
              if (!soExecute.includes(soID)) {
                loop_head++;
                fulfillment_rec.setValue({
                  fieldId: 'shipstatus',
                  value: 'C',
                  ignoreFieldChange: true
                });
                fulfillment_rec.setValue({
                  fieldId: 'shipstatus',
                  value: 'C',
                  ignoreFieldChange: true
                });
                var dateFormat = format.parse({
                  value: dateUpload,
                  type: format.Type.DATE
                });
                var postingPeriod = months[dateFormat.getMonth()] + ' ' + dateFormat.getFullYear();
                // log.debug("postingPeriod", postingPeriod);
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
                // log.debug("postingPeriodData", postingPeriodData);
                var searchResultCount = postingPeriodData.runPaged().count;
                // log.debug("periodData result count", searchResultCount);
                var postingPeriodID;
                postingPeriodData.run().each(function(result) {
                  postingPeriodID = result.getValue({
                    name: 'internalid'
                  });
                  return true;
                });
                // var postingPeriodID = postingPeriodData[0].getValue("internalid");
                // log.debug("postingPeriodID", postingPeriodID);

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
                soExecute.push(soID);
              }
              itm_fulfillmnt_process_ids.push(itm_fulfillmnt_process_id);
              fullFilltrueData.push(so_line_id);
            }
          });

          // log.debug("loop_head", loop_head);
          // log.debug("fullFilltrue", fullFilltrue);
          // log.debug("arrayProcess", arrayProcess);
          for (var i = 0; i < lineTotal; i++) {
            fulfillment_rec.selectLine({
              sublistId: 'item',
              line: i
            });
            var order_line = fulfillment_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'orderline',
            });
            var so_agility_lineid = fulfillment_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_abj_agility_linenum',
            });
            var if_item_id = fulfillment_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'item',
            });
            var qtySum = fulfillment_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'quantityremaining'
            })
            if (so_agility_lineid) {
              var filterData = arrayProcess.filter(function(row) {
                return row.so_line_id == so_agility_lineid && row.so_id == SalesOrderNo;
              });
              // log.debug("filterData", filterData);
              filterData.forEach(function(itemfulfillmnt) {
                // var itemfulfillmnts = JSON.parse(itemfulfillmnt);
                var locationid = itemfulfillmnt.locationid;
                var quantity = itemfulfillmnt.quantity;
                var line_memo = itemfulfillmnt.line_memo;
                var so_line_id = itemfulfillmnt.so_line_id;
                var so_item_id = itemfulfillmnt.so_item_id;
                var itm_fulfillmnt_process_id = itemfulfillmnt.itm_fulfillmnt_process_id;
                var so_internal_id = itemfulfillmnt.so_internal_id;
                fullFilltrue.push(so_line_id);
                // log.debug("item", {
                //   locationid: locationid,
                //   quantity: quantity,
                //   line_memo: line_memo
                // });
                if (fullFilltrue.includes(so_agility_lineid)) {
                  // log.debug('so_item_id', {
                  //   so_internal_id: so_internal_id,
                  //   so_item_id: so_item_id,
                  //   so_line_id: so_line_id
                  // });
                  // log.debug('fulfillment process', 'fulfill');
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
                  // log.debug("qtySO result count", qtySOCount);
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
                  // qtySO.filters.push(search.createFilter({
                  //   name: 'custcol_abj_agility_linenum',
                  //   operator: search.Operator.IS,
                  //   values: so_line_id
                  // }));
                  // var qtySOset = qtySO.run();
                  // qtySO = qtySOset.getRange({
                  //   start: 0,
                  //   end: 1
                  // });
                  // log.debug('qtySO', qtySO);
                  if (qtySOCount > 0) {
                    // log.debug('qtySOin');
                    var qtySavedSearch = 0;
                    qtySO.run().each(function(result) {
                      qtySavedSearch = result.getValue("quantity");
                      return true;
                    });
                    // var py = qtySO[0];
                    // var qtySavedSearch = py.getValue(qtySOset.columns[2]);
                    // log.debug('qtySavedSearch', qtySavedSearch);
                    if (quantity > qtySavedSearch) {
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: false
                      });
                      let index = itm_fulfillmnt_process_ids.indexOf(itm_fulfillmnt_process_id);
                      if (index > -1) {
                        itm_fulfillmnt_process_ids.splice(index, 1);
                      }
                      fulfillfalse++
                      itm_fulfillmnt_skipped_ids.push(itm_fulfillmnt_process_id);
                    } else {
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
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: locationid
                      });
                      fulfillment_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_agi_memo',
                        value: line_memo
                      });
                      fulfillcount++;
                    }
                  } else {
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
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'location',
                      value: locationid
                    });
                    fulfillment_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_abj_agi_memo',
                      value: line_memo
                    });
                    fulfillcount++;
                  }

                }
              });
            } else {
              log.debug('fulfillment process', 'not fulfill');
              let index = itm_fulfillmnt_process_ids.indexOf(itm_fulfillmnt_process_id);
              if (index > -1) {
                itm_fulfillmnt_process_ids.splice(index, 1);
              }
              agilitynull++;
              itm_fulfillmnt_agilitynull_ids.push(itm_fulfillmnt_process_id);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: false
              });
            }
            fulfillment_rec.commitLine('item');
          }

          // log.debug('fulfillcount', fulfillcount);
          // log.debug('fulsillfalse', fulfillfalse)
          if (fulfillcount) {
            var fulfillment_id = fulfillment_rec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });

            if (fulfillment_id) {
              UpdateProcessStatus('Success', SalesOrderNo, itm_fulfillmnt_process_ids, fulfillment_id);
            }
          }
          if (fulfillfalse) {
            UpdateProcessedFalse('Error', SalesOrderNo, itm_fulfillmnt_skipped_ids, 'Quantity is more than the receive quantity');
          }
          if (billedso) {
            UpdateProcessedFalse('Error', SalesOrderNo, itm_fulfillmnt_billed_ids, 'SO status is Billed');
          }
          if (agilitynull) {
            UpdateProcessedFalse('Error', SalesOrderNo, itm_fulfillmnt_agilitynull_ids, 'Line Agility is not defined');
          }
        }

        context.write({
          key: SalesOrderNo,
          value: itm_fulfillmnt_process_ids
        });
      } catch (e) {
        var err_msg = 'Failure to create fullfillment for sales order: ' + SalesOrderNo + ' ' + e.name + ': ' + e.message + '\n';
        UpdateProcessStatus('Failed', SalesOrderNo, itm_fulfillmnt_process_ids, 0, err_msg);
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