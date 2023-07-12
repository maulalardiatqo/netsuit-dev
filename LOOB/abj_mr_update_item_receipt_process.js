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
	        var msg = 'Failure to create fullfillment for IF Id : ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
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
	      var searchId = runtime.getCurrentScript().getParameter("custscript_item_receipt_update_search_id");
	      var itemreceipt_toprocess = search.load({
	        id: searchId
	      });

	      return itemreceipt_toprocess;
	    }

	    function itm_receipt_process_Data(id, IfID, po_line_id, quantity, line_memo) {
	      this.id = id;
	      this.IfID = IfID;
	      this.po_line_id = po_line_id;
	      this.quantity = quantity;
	      this.line_memo = line_memo;
	    }

	    function map(context) {
	      var searchResult = JSON.parse(context.value);
	      //var itm_receipt_process_Id = searchResult.id;
	      var IfID = searchResult.values.custrecord_abj_ir_it_id;
	      var itm_receipt_process = new itm_receipt_process_Data(
	        searchResult.id,
	        IfID,
	        searchResult.values.custrecord_abj_ir_lineid,
	        searchResult.values.custrecord_abj_ir_qty,
	        searchResult.values.custrecord_abj_ir_line_memo
	      );

	      context.write({
	        key: IfID,
	        value: itm_receipt_process
	      });
	    }

	    function reduce(context) {
	      var IfID = context.key;
	      var itemreceipt_toprocess = context.values;
	      var itm_receipt_process_id = 0;

	      function UpdateProcessStatus(Status, itm_receipt_process_ids, receipt_id, err_message = '') {
	        var ItmReceiptProcessToUpdate = search.create({
	          type: 'customrecord_abj_ir_bulk',
	          columns: ['internalid'],
	          filters: [{
	            name: 'internalid',
	            operator: 'anyof',
	            values: itm_receipt_process_ids
	          }, ]
	        });
	        var ItmReceiptProcessToUpdateset = ItmReceiptProcessToUpdate.run();
	        ItmReceiptProcessToUpdate = ItmReceiptProcessToUpdateset.getRange(0, 1000);

	        ItmReceiptProcessToUpdate.forEach(function(itemreceipt) {
	          var ItmReceiptProcessId = itemreceipt.getValue({
	            name: 'internalid'
	          });
	          var recItmReceiptProcess = record.load({
	            type: 'customrecord_abj_ir_bulk',
	            id: ItmReceiptProcessId,
	            isDynamic: false
	          });
	          recItmReceiptProcess.setValue({
	            fieldId: 'custrecord_abj_ir_status',
	            value: Status,
	            ignoreFieldChange: true
	          });
	          if (Status == 'Success')
	            recItmReceiptProcess.setValue({
	              fieldId: 'custrecord_abj_ir',
	              value: receipt_id,
	              ignoreFieldChange: true
	            });
	        //   recItmReceiptProcess.setValue({
	        //     fieldId: 'custrecord_abj_ir_error',
	        //     value: err_message,
	        //     ignoreFieldChange: true
	        //   });
	          recItmReceiptProcess.save({
	            enableSourcing: true,
	            ignoreMandatoryFields: true
	          });
	        });
	      }

	      try {
	        log.debug('itemreceipt_toprocess', itemreceipt_toprocess);
	        var receipt_rec = record.load({
	          type: 'itemreceipt',
	          id: IfID,
	          isDynamic: true
	        });

	        log.debug('receipt process', 'fulfill');
	        var receiptCount = 0;
	        var itm_receipt_process_ids = [];
	        itemreceipt_toprocess.forEach(function(itemreceipt) {
	          var itemreceipts = JSON.parse(itemreceipt);
	          var po_line_id = itemreceipts.po_line_id;
	          var ir_line_to_update = receipt_rec.findSublistLineWithValue({
	            sublistId: 'item',
	            fieldId: 'custcol_abj_agility_linenum',
	            value: po_line_id
	          });
	          if (ir_line_to_update > -1) {
	            var itm_receipt_process_id = itemreceipts.id;
	            itm_receipt_process_ids.push(itm_receipt_process_id);

	            log.debug("ir_line_to_update", ir_line_to_update);
	            receipt_rec.selectLine({
	              sublistId: 'item',
	              line: ir_line_to_update
	            });

	            var quantity = itemreceipts.quantity;
	            receipt_rec.setCurrentSublistValue({
	              sublistId: 'item',
	              fieldId: 'quantity',
	              value: quantity
	            });

	            var line_memo = itemreceipts.line_memo;
	            receipt_rec.setCurrentSublistValue({
	              sublistId: 'item',
	              fieldId: 'custcol_abj_agi_memo',
	              value: line_memo
	            });

	            receipt_rec.commitLine('item');

	            log.debug('receipt process loop',
	              'receipt process id :' + itm_receipt_process_id + ' ' +
	              'po_line_id :' + po_line_id + ' ' +
	              'quantity :' + quantity + ' ' +
	              'line_memo :' + line_memo + ' '
	            );
	            receiptCount++;
	          }
	        });
	        log.debug('receiptCount', receiptCount);
	        if (receiptCount) {
	          var receipt_id = receipt_rec.save({
	            enableSourcing: true,
	            ignoreMandatoryFields: true
	          });

	          if (receipt_id) {
	            UpdateProcessStatus('Success', itm_receipt_process_ids, receipt_id);
	          }
	        }

	        context.write({
	          key: IfID,
	          value: itm_receipt_process_ids
	        });
	      } catch (e) {
	        var err_msg = 'Failure to update fullfillment for IF Id: ' + IfID + ' ' + e.name + ': ' + e.message + '\n';
	        UpdateProcessStatus('Failed', itm_receipt_process_ids, 0, err_msg);
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