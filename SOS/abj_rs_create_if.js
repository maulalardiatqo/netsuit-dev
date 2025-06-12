/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', './abj_utils_sos_integration_log_record', 'N/search'], (record, log, error, format, integrationLogRecord, search) => {
    function createItemFulfill(data) {
        try {
            const itemFulfillRec = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: data.sales_order.internal_id,
                toType: record.Type.ITEM_FULFILLMENT,
                isDynamic: true
            });

            if (data.tran_date) {
                itemFulfillRec.setValue({
                    fieldId: 'trandate',
                    value: new Date(data.tran_date)
                });
            }
            if (data.memo) {
                itemFulfillRec.setValue({
                    fieldId: 'memo',
                    value: data.memo
                });
            }
            if (data.location && data.location.internal_id) {
                itemFulfillRec.setValue({
                    fieldId: 'location',
                    value: data.location.internal_id
                });
            }

            if (data.ships_tatus && data.ships_tatus.internal_id) {
                itemFulfillRec.setValue({
                    fieldId: 'shipstatus',
                    value: data.ships_tatus.internal_id
                });
            }

            const lineCount = itemFulfillRec.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                itemFulfillRec.selectLine({ sublistId: 'item', line: i });

                const itemId = itemFulfillRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                const match = data.order_items.find(o => o.item && o.item.internal_id == itemId);

                if (match && match.item_receive) {
                    itemFulfillRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: true
                    });

                    if (match.quantity) {
                        itemFulfillRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: match.quantity
                        });
                    }

                    if (match.location && match.location.internal_id) {
                        itemFulfillRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            value: match.location.internal_id
                        });
                    }

                } else {
                    itemFulfillRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: false
                    });
                }

                itemFulfillRec.commitLine({ sublistId: 'item' });
            }

            const ifId = itemFulfillRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            return {
                success: true,
                ifId: ifId
            };

        } catch (e) {
            log.error('Error createItemFulfill', e);
            throw new Error({
                name: 'CREATE_ITEM_FULFILL_ERROR',
                message: e.message,
                notifyOff: false
            });
        }
    }


     return {
    post: (context) => {
      try {
        log.audit('Received Data', JSON.stringify(context));

        // Validate transaction_type
        if (!context.transaction_type || context.transaction_type !== 'item_fulillment') {
          throw new Error({
            name: 'INVALID_TRANSACTION_TYPE',
            message: 'This endpoint only accepts transaction_type = "item_fulillment".',
            notifyOff: false
          });
        }

        // Validate required data
        if (!context.data || !context.data.entity) {
          throw new Error({
            name: 'MISSING_REQUIRED_DATA',
            message: 'Entity data is required in payload.',
            notifyOff: false
          });
        }
        var result
  
        try{
            result = createItemFulfill(context.data);
        }catch(e){
             throw new Error({
                name: 'Error',
                message: e.message,
                notifyOff: false
            });
        }
        
        log.debug('result', result)
        var IfId = result.ifId
        log.debug('IfIdCheck', IfId)
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
            jobName: '- ABJ RS | ETP create IF',
            jobType: 'Restlet - POST',
            jobLink: 'JOB LINK - URL DARI POS',
            reqBody: JSON.stringify(context.data),
            resBody: JSON.stringify(result),
            linkTrx: IfId
      });
      log.debug('integrationLogRec', integrationLogRec)

        return {
            status: true,
            message: 'Itemfulfill created successfully.',
            data: IfId
        };

      } catch (e) {
        log.error('RESTlet Error', e);

        result = {
            status: false,
            message: e.message || 'Unexpected error occurred.',
        };
        if(!result.status){
            throw new Error(result.message)
        }
      }
    }
  };

});