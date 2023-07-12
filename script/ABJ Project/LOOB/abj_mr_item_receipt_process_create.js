	/**
	 * @NApiVersion 2.1
	 * @NScriptType MapReduceScript
	 * created by Rangga
	 */
	define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
	  function(search, record, email, runtime, error) {
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
	      var itemreceipt_toprocess = search.load({
	        id: searchId
	      });

	      return itemreceipt_toprocess;
	    }

	    function itm_receipt_process_Data(id, po_id, locationid, po_item_id, po_line_id, quantity, line_memo) {
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
	      this.po_line_id = po_line_id;
	      this.quantity = quantity;
	      this.line_memo = line_memo;
	    }

	    function map(context) {
	      var searchResult = JSON.parse(context.value);
	      //var itm_receipt_process_Id = searchResult.id;
	      var PurchaseOrderNo = searchResult.values.custrecord_abj_ir_so;
	      var itm_receipt_process = new itm_receipt_process_Data(
	        searchResult.id,
	        PurchaseOrderNo,
	        searchResult.values.custrecord_sol_rcpt_loc_list.value,
	        searchResult.values.custrecord_abj_ir_item.value,
	        searchResult.values.custrecord_abj_ir_lineid,
	        searchResult.values.custrecord_abj_ir_qty,
	        searchResult.values.custrecord_abj_ir_line_memo
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
	          if (Status == 'Success')
	            recItmreceiptProcess.setValue({
	              fieldId: 'custrecord_abj_ir',
	              value: receipt_id,
	              ignoreFieldChange: true
	            });
	          recItmreceiptProcess.setValue({
	            fieldId: 'custrecord_abj_ir_error',
	            value: err_message,
	            ignoreFieldChange: true
	          });
	          recItmreceiptProcess.save({
	            enableSourcing: true,
	            ignoreMandatoryFields: true
	          });
	        });
	      }

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
	          receipt_rec.setValue({
	            fieldId: 'shipstatus',
	            value: 'C',
	            ignoreFieldChange: true
	          });

	          var receiptcount = 0;

	          lineTotal = receipt_rec.getLineCount({
	            sublistId: 'item'
	          });
	          log.debug("line total", lineTotal);
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

	            var ir_item_id = receipt_rec.getCurrentSublistValue({
	              sublistId: 'item',
	              fieldId: 'item',
	            });

	            log.debug('if loop',
	              'order_line :' + order_line + ' ' +
	              'po_agility_lineid :' + po_agility_lineid + ' '
	            );
	            if (po_agility_lineid) {
	              log.debug('receipt process', 'receipt');

	              itemreceipt_toprocess.forEach(function(itemreceipt) {
	                var itemreceipts = JSON.parse(itemreceipt);
	                log.debug("itemreceipts", itemreceipts);
	                var po_line_id = itemreceipts.po_line_id;
	                log.debug("po_line_id", po_line_id);
	                if (po_agility_lineid == po_line_id) {
	                  //var PurchaseOrder_id = itemreceipts.po_id;
	                  var locationid = itemreceipts.locationid;
	                  var po_item_id = itemreceipts.po_item_id;
	                  var itm_receipt_process_id = itemreceipts.id;
	                  var quantity = itemreceipts.quantity;
	                  var line_memo = itemreceipts.line_memo;
	                  itm_receipt_process_ids.push(itm_receipt_process_id);

	                  log.debug('receipt process loop',
	                    'receipt process id :' + itm_receipt_process_id + ' ' +
	                    'po_item_id :' + po_item_id + ' ' +
	                    'po_line_id :' + po_line_id + ' ' +
	                    'quantity :' + quantity + ' ' +
	                    'line_memo :' + line_memo + ' ' +
	                    'locationid :' + locationid + ' ' +
	                    'po_agility_lineid :' + po_agility_lineid + ' '
	                  );
	                  receipt_rec.setCurrentSublistValue({
	                    sublistId: 'item',
	                    fieldId: 'itemreceive',
	                    value: true
	                  });
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
	          if (receiptcount) {
	            var receipt_id = receipt_rec.save({
	              enableSourcing: true,
	              ignoreMandatoryFields: true
	            });

	            if (receipt_id) {
	              UpdateProcessStatus('Success', PurchaseOrderNo, itm_receipt_process_ids, receipt_id);
	            }
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