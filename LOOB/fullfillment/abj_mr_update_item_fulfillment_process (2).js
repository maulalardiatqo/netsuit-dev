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

    function getInputData() {
      var searchId = runtime.getCurrentScript().getParameter("custscriptupd_item_fulfillment_search_id");
      var itemfulfillmnt_toprocess = search.load({
        id: searchId //'customsearchloob_update_item_fullfill'
      });

      return itemfulfillmnt_toprocess;
    }

    function itm_fulfillmnt_process_Data(id, IfID, so_line_id, quantity, line_memo, location, dateToUpload, departement_id, class_id, fulfillment_tick) {
      this.id = id;
      this.IfID = IfID;
      this.so_line_id = so_line_id;
      this.quantity = quantity;
      this.line_memo = line_memo;
      this.location = location;
      this.dateToUpload = dateToUpload;
      this.departement_id = departement_id;
      this.class_id = class_id;
      this.fulfillment_tick = fulfillment_tick
    }

    function map(context) {
      var searchResult = JSON.parse(context.value);
      //var itm_fulfillmnt_process_Id = searchResult.id;
      var IfID = searchResult.values.custrecord_abj_if_it_id;
      var itm_fulfillmnt_process = new itm_fulfillmnt_process_Data(
        searchResult.id,
        IfID,
        searchResult.values.custrecord_abj_if_lineid,
        searchResult.values.custrecord_abj_if_qty,
        searchResult.values.custrecord_abj_if_line_memo,
        searchResult.values.custrecord_sol_tfp_loc_list.value,
        searchResult.values.custrecord_abj_if_date,
        searchResult.values.custrecord_abj_tfp_if_dept.value,
        searchResult.values.custrecord_abj_tfp_if_class.value,
        searchResult.values.custrecord_abj_fulfill
      );

      context.write({
        key: IfID,
        value: itm_fulfillmnt_process
      });
    }

    function reduce(context) {
      var IfID = context.key;
      var itemfulfillmnt_toprocess = context.values;
      var itm_fulfillmnt_process_id = 0;
      log.debug('itemfulfillmnt_toprocess', itemfulfillmnt_toprocess);

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
        var fulfillment_rec = record.load({
          type: 'itemfulfillment',
          // id: '120454',
          id: IfID,
          isDynamic: true
        });

        // log.debug('fulfillment process','fulfill');
        var fulfillmntCount = 0;
        var itm_fulfillmnt_process_ids = [];
        itemfulfillmnt_toprocess.forEach(function(itemfulfillmnt) {
          var itemfulfillmnts = JSON.parse(itemfulfillmnt);
          log.debug('itemfulfillmnts', itemfulfillmnts);
          var so_line_id = itemfulfillmnts.so_line_id;
          var if_line_to_update = fulfillment_rec.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'custcol_abj_agility_linenum',
            value: so_line_id
            // value:1
          });
          log.debug('if_line_to_update', if_line_to_update);
          if (if_line_to_update > -1) {
            var itm_fulfillmnt_process_id = itemfulfillmnts.id;
            log.debug('itm_fulfillmnt_process_id', itm_fulfillmnt_process_id);

            itm_fulfillmnt_process_ids.push(itm_fulfillmnt_process_id);

            log.debug("if_line_to_update", if_line_to_update);
            var dateupload = itemfulfillmnts.dateToUpload;
            log.debug('dateToUpload', dateupload);
            var dateFormat = format.parse({
              value: dateupload,
              type: format.Type.DATE
            });
            var postingPeriod = months[dateFormat.getMonth()] + ' ' + dateFormat.getFullYear();
            var postingPeriodData = search.load({
              id: 'customsearch602',
            });
            postingPeriodData.filters.push(search.createFilter({
              name: 'periodname',
              operator: search.Operator.IS,
              values: postingPeriod
            }));
            postingPeriodDataSet = postingPeriodData.run();
            postingPeriodData = postingPeriodDataSet.getRange(0, 1);
            // log.debug("postingPeriodData", postingPeriodData);
            var postingPeriodID = postingPeriodData[0].getValue("internalid");
            log.debug('dateFormat', dateFormat);
            fulfillment_rec.setValue({
              fieldId: 'trandate',
              value: dateFormat,
              ignoreFieldChange: true
            })
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
            log.debug('tickUntick', fulfillmenItemReceive);
            if (fulfillmenItemReceive == 'T') {
              log.debug("do unreceive", true);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: false
              });
            } else {
              log.debug("do receive", true);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: true
              });
              var quantity = itemfulfillmnts.quantity;
              log.debug('Quantity', quantity);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: quantity
              });
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
              log.debug('departmentid', departmentid);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'department',
                value: departmentid
              })
              var classintid = itemfulfillmnts.class_id;
              log.debug('classintid', classintid);
              fulfillment_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'class',
                value: classintid
              });
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
        });
        log.debug('fulfillmntCount', fulfillmntCount);
        if (fulfillmntCount) {
          var fulfillment_id = fulfillment_rec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          if (fulfillment_id) {
            UpdateProcessStatus('Success', itm_fulfillmnt_process_ids, fulfillment_id);
          }
        }

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