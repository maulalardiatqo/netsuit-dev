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
        var msg = 'Failure to create receipt for purchase order : ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
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

    function getInputData() {
      var searchId = runtime.getCurrentScript().getParameter("custscript_item_receipt_create_search_id");
      var StartRange = runtime.getCurrentScript().getParameter("custscript_start_range");
      var EndRange = runtime.getCurrentScript().getParameter("custscript_end_range");
      var itemreceipt_toprocess = search.load({
        id: searchId
      });
      // itemreceipt_toprocess.filters.push(search.createFilter({
      //   name: 'custrecord_abj_ir_status',
      //   operator: search.Operator.IS,
      //   values: ""
      // }, ));
      var itemreceipt_toprocess_set = itemreceipt_toprocess.run();
      itemreceipt_toprocess = itemreceipt_toprocess_set.getRange(StartRange, EndRange);
      return itemreceipt_toprocess;

    }

    function itm_receipt_process_Data(id, po_id, locationid, po_item_id, po_internal_id, itemEksid, po_line_id, quantity, line_memo, date_upload) {
      /*var FindLocation = search.create({
              type: 'location',
              columns: ['internalid'],
              filters: [{name: 'externalid', operator: 'is',values: locationid},
                   ]
        }).run().getRange(0, 1);
      var location_internalid=0;
      if (FindLocation.length>0) {
        location_internalid = FindLocation[0].getValue({name: 'internalid'});
      }
      log.debug('location_internalid',location_internalid);*/

      this.id = id;
      this.po_id = po_id;
      this.locationid = locationid; //location_internalid;
      this.po_item_id = po_item_id;
      this.po_internal_id = po_internal_id;
      this.itemEksid = itemEksid;
      this.po_line_id = po_line_id;
      this.quantity = quantity;
      this.line_memo = line_memo;
      this.date_upload = date_upload;
    }

    function map(context) {
      var searchResult = JSON.parse(context.value);
      //var itm_receipt_process_Id = searchResult.id;
      var PurchaseOrderNo = searchResult.values.custrecord_abj_ir_so;
      log.debug('PurchaseOrderNo', PurchaseOrderNo);
      var itm_receipt_process = new itm_receipt_process_Data(
        searchResult.id,
        PurchaseOrderNo,
        searchResult.values.custrecord_sol_rcpt_loc_list[0].value,
        searchResult.values.custrecord_abj_ir_item[0].value,
        searchResult.values.custrecord_po_internal_id[0].value,
        searchResult.values.custrecord_abj_ir_item[0].value,
        searchResult.values.custrecord_abj_ir_lineid,
        searchResult.values.custrecord_abj_ir_qty,
        searchResult.values.custrecord_abj_ir_line_memo,
        searchResult.values.custrecord_abj_date
      );
      context.write({
        key: PurchaseOrderNo,
        value: itm_receipt_process
      });
    }

    function reduce(context) {
      var PurchaseOrderNo = context.key;
      var itemreceipt_toprocess = context.values;
      var itm_receipt_process_id = 0;

      function UpdateProcessSkiped(Status, PurchaseOrderNo, itm_receipt_skipped_ids) {
        var ItmreceiptProcessToUpdate = search.create({
          type: 'customrecord_abj_ir_bulk',
          columns: ['internalid', 'custrecord_abj_ir_so'],
          filters: [{
            name: 'custrecord_abj_ir_so',
            operator: 'is',
            values: PurchaseOrderNo
          }, ]
        });
        if (itm_receipt_skipped_ids.length > 0) {
          ItmreceiptProcessToUpdate.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: itm_receipt_skipped_ids
          }));
        }
        var ItmreceiptProcessToUpdateset = ItmreceiptProcessToUpdate.run();
        ItmreceiptProcessToUpdate = ItmreceiptProcessToUpdateset.getRange(0, 1000);

        ItmreceiptProcessToUpdate.forEach(function(itemreceipt) {
          var ItmreceiptProcessId = itemreceipt.getValue({
            name: 'internalid'
          });
          log.debug("ItmreceiptProcessId", ItmreceiptProcessId);
          var recItmreceiptProcess = record.load({
            type: 'customrecord_abj_ir_bulk',
            id: ItmreceiptProcessId,
            isDynamic: false
          });
          recItmreceiptProcess.setValue({
            fieldId: 'custrecord_abj_ir_status',
            value: Status,
            ignoreFieldChange: true
          });

          recItmreceiptProcess.setValue({
            fieldId: 'custrecord_abj_ir_error',
            value: 'Quantity is more than the receive quantity',
            ignoreFieldChange: true
          });
          recItmreceiptProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      function UpdateProcessStatus(Status, PurchaseOrderNo, itm_receipt_process_ids, receipt_id, err_message = '') {
        var ItmreceiptProcessToUpdate = search.create({
          type: 'customrecord_abj_ir_bulk',
          columns: ['internalid', 'custrecord_abj_ir_so'],
          filters: [{
            name: 'custrecord_abj_ir_so',
            operator: 'is',
            values: PurchaseOrderNo
          }, ]
        });
        if (itm_receipt_process_ids.length > 0) {
          ItmreceiptProcessToUpdate.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: itm_receipt_process_ids
          }));
        }
        var ItmreceiptProcessToUpdateset = ItmreceiptProcessToUpdate.run();
        ItmreceiptProcessToUpdate = ItmreceiptProcessToUpdateset.getRange(0, 1000);

        ItmreceiptProcessToUpdate.forEach(function(itemreceipt) {
          var ItmreceiptProcessId = itemreceipt.getValue({
            name: 'internalid'
          });
          log.debug("ItmreceiptProcessId", ItmreceiptProcessId);
          var recItmreceiptProcess = record.load({
            type: 'customrecord_abj_ir_bulk',
            id: ItmreceiptProcessId,
            isDynamic: false
          });
          recItmreceiptProcess.setValue({
            fieldId: 'custrecord_abj_ir_status',
            value: Status,
            ignoreFieldChange: true
          });
          if (Status == 'Success') {
            recItmreceiptProcess.setValue({
              fieldId: 'custrecord_abj_ir',
              value: receipt_id,
              ignoreFieldChange: true
            });
          }
          recItmreceiptProcess.setValue({
            fieldId: 'custrecord_abj_ir_error',
            value: Status == 'Success' ? '' : err_message,
            ignoreFieldChange: true
          });
          recItmreceiptProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var receiptTrue = [];
      var receiptTrueData = [];
      var poExecute = [];
      try {
        log.debug('itemreceipt_toprocess', itemreceipt_toprocess);
        var find_po = search.create({
          type: 'purchaseorder',
          columns: ['internalid'],
          filters: [{
              name: 'tranid',
              operator: 'is',
              values: PurchaseOrderNo
            },
            {
              name: 'mainline',
              operator: 'is',
              values: true
            },
          ]
        }).run().getRange(0, 1000);
        var itm_receipt_process_ids = [];
        var itm_receipt_skipped_ids = [];

        if (find_po.length > 0) {
          log.debug('find_po', find_po);
          var po_internalid = find_po[0].getValue({
            name: 'internalid'
          });
          log.debug('po_internalid', po_internalid);

          var receipt_rec = record.transform({
            fromType: record.Type.PURCHASE_ORDER,
            fromId: po_internalid,
            toType: record.Type.ITEM_RECEIPT,
            isDynamic: true,
          });
          var loop_head = 0;
          var receiptcount = 0;
          var receiptfalse = 0;
          var lineTotal = receipt_rec.getLineCount({
            sublistId: 'item'
          });
          var arrayProcess = [];
          itemreceipt_toprocess.forEach(function(itemreceipt) {
            var itemreceipts = JSON.parse(itemreceipt);
            var poID = itemreceipts.po_id;
            var po_line_id = itemreceipts.po_line_id;
            var locationid = itemreceipts.locationid;
            var po_item_id = itemreceipts.po_item_id;
            var po_internal_id = itemreceipts.po_internal_id;
            var itemEksid = itemreceipts.itemEksid;
            var itm_receipt_process_id = itemreceipts.id;
            var quantity = itemreceipts.quantity;
            var line_memo = itemreceipts.line_memo;
            var dateUpload = itemreceipts.date_upload;
            arrayProcess.push({
              po_id: poID,
              po_internal_id: po_internal_id,
              locationid: locationid,
              po_line_id: po_line_id,
              quantity: quantity,
              line_memo: line_memo,
              itemEksid: itemEksid,
              itm_receipt_process_id: itm_receipt_process_id,
            });
            if (!poExecute.includes(poID)) {
              loop_head++;
              receipt_rec.setValue({
                fieldId: 'shipstatus',
                value: 'C',
                ignoreFieldChange: true
              });
              var dateUploadConvert = format.parse({
                value: dateUpload,
                type: format.Type.DATE
              });
              // log.debug("dateUploadConvert", dateUploadConvert);
              var postingPeriod = months[dateUploadConvert.getMonth()] + ' ' + dateUploadConvert.getFullYear();
              // log.debug("postingPeriod", postingPeriod);

              var postingPeriodData = search.load({
                id: 'customsearch_accounting_period',
              });
              postingPeriodData.filters.push(search.createFilter({
                name: 'periodname',
                operator: search.Operator.IS,
                values: postingPeriod
              }));
              postingPeriodDataSet = postingPeriodData.run();
              postingPeriodData = postingPeriodDataSet.getRange(0, 1);
              log.debug("postingPeriodData", postingPeriodData);
              var postingPeriodID = postingPeriodData[0].getValue("internalid");
              log.debug("postingPeriodID", postingPeriodID);

              receipt_rec.setValue({
                fieldId: 'trandate',
                value: dateUploadConvert,
                ignoreFieldChange: true
              });
              receipt_rec.setValue({
                fieldId: 'postingperiod',
                value: postingPeriodID,
                ignoreFieldChange: true
              });
              poExecute.push(poID);
            }
            itm_receipt_process_ids.push(itm_receipt_process_id);
            receiptTrueData.push(po_line_id);
          });
          log.debug("loop_head", loop_head);
          log.debug("receiptTrue", receiptTrue);
          log.debug("arrayProcess", arrayProcess);
          for (var i = 0; i < lineTotal; i++) {
            receipt_rec.selectLine({
              sublistId: 'item',
              line: i
            });
            var order_line = receipt_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'orderline',
            });
            var po_agility_lineid = receipt_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_abj_agility_linenum',
            });
            var qtySum = receipt_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
            });
            var ir_item_id = receipt_rec.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'item',
            });
            
            if (po_agility_lineid && receiptTrueData.includes(po_agility_lineid)) {
              var filterData = arrayProcess.filter(function(row) {
                return row.po_line_id == po_agility_lineid && row.po_id == PurchaseOrderNo;
              });
              log.debug("filterData", filterData);
              log.debug('purchasorderNo', PurchaseOrderNo);
              filterData.forEach(function(itemreceipt) {
                var po_id = itemreceipt.po_id;
                var po_internal_id = itemreceipt.po_internal_id;
                var locationid = itemreceipt.locationid;
                var itm_receipt_process_id = itemreceipt.itm_receipt_process_id
                var quantity = itemreceipt.quantity;
                var line_memo = itemreceipt.line_memo;
                var po_line_id = itemreceipt.po_line_id;
                var itemEksid = itemreceipt.itemEksid;
                receiptTrue.push(po_line_id);
                log.debug("item", {
                  locationid: locationid,
                  quantity: quantity,
                  line_memo: line_memo,
                  itemEksid: itemEksid,
                  po_internal_id: po_internal_id
                });
                if (receiptTrue.includes(po_agility_lineid)) {
                    log.debug('po_internal_id', po_internal_id);
                    var qtySO = search.load({
                      id: 'customsearch_po_item_qty_2',
                    });
                    
                    qtySO.filters.push(search.createFilter({
                      name: 'intercotransaction',
                      operator: search.Operator.IS,
                      values: po_internal_id
                    }));
                    qtySO.filters.push(search.createFilter({
                      name: 'item',
                      operator: search.Operator.IS,
                      values: itemEksid
                    }));
                    var qtySOset = qtySO.run();
                    qtySO = qtySOset.getRange({
                      start: 0,
                      end: 1
                    });
                    log.debug('qtySO', qtySO);
                    if(qtySO.length > 0){
                      var py = qtySO[0];
                      var qtySavedSearch = py.getValue(qtySOset.columns[5]);
                      log.debug('qtySavedSearch', qtySavedSearch);
                      log.debug('itm_receipt_process_id', itm_receipt_process_id);
                      if(quantity > qtySavedSearch){
                        receipt_rec.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'itemreceive',
                          value: false
                        });
                        receiptfalse++;
                        itm_receipt_skipped_ids.push(itm_receipt_process_id);
                      }else{
                        receipt_rec.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'itemreceive',
                          value: true
                        });
                        log.debug('quantitytoset', quantity);
                        receipt_rec.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'quantity',
                          value: quantity
                        });
                        receipt_rec.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'location',
                          value: locationid
                        });
                        receipt_rec.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'custcol_abj_agi_memo',
                          value: line_memo
                        });
                        receiptcount++;
                      }
                    }else{
                    receipt_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'itemreceive',
                      value: true
                    });
                    if(quantity > qtySum){
                      log.debug('qtySum', qtySum);
                      receipt_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: qtySum
                      });
                    }else{
                      receipt_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: quantity
                      });
                    }
                    receipt_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'location',
                      value: locationid
                    });
                    receipt_rec.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_abj_agi_memo',
                      value: line_memo
                    });
                    receiptcount++;
                  }
                  // log.debug('receipt process', 'receipt');
                  // receipt_rec.setCurrentSublistValue({
                  //   sublistId: 'item',
                  //   fieldId: 'itemreceive',
                  //   value: true
                  // });
                  // receipt_rec.setCurrentSublistValue({
                  //   sublistId: 'item',
                  //   fieldId: 'quantity',
                  //   value: quantity
                  // });
                  // receipt_rec.setCurrentSublistValue({
                  //   sublistId: 'item',
                  //   fieldId: 'location',
                  //   value: locationid
                  // });
                  // receipt_rec.setCurrentSublistValue({
                  //   sublistId: 'item',
                  //   fieldId: 'custcol_abj_agi_memo',
                  //   value: line_memo
                  // });
                  // receiptcount++;
                }
              });
            } else {
              log.debug('receipt process', 'not receipt');
              receipt_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: false
              });
            }
            receipt_rec.commitLine('item');
          }
          log.debug('receiptcount', receiptcount);
          log.debug('receiptfalse', receiptfalse);
          log.debug('itm_receipt_skipped_ids', itm_receipt_skipped_ids)
          if (receiptcount) {
            var receipt_id = receipt_rec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });

            if (receipt_id) {
              UpdateProcessStatus('Success', PurchaseOrderNo, itm_receipt_process_ids, receipt_id);
            }
          }
          if(receiptfalse){
            
            UpdateProcessSkiped('Error', PurchaseOrderNo, itm_receipt_skipped_ids);
          }
        }

        context.write({
          key: PurchaseOrderNo,
          value: itm_receipt_process_ids
        });
      } catch (e) {
        var err_msg = 'Failure to create receipt for purchase order: ' + PurchaseOrderNo + ' ' + e.name + ': ' + e.message + '\n';
        UpdateProcessStatus('Failed', PurchaseOrderNo, itm_receipt_process_ids, 0, err_msg);
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