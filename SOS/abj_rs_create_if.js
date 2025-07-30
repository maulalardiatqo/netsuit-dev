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
            itemFulfillRec.setValue({
                fieldId : 'customform',
                value : '103'
            })
            if (data.tran_date) {
                itemFulfillRec.setValue({
                    fieldId: 'trandate',
                    value: new Date(data.tran_date)
                });
            }
            itemFulfillRec.setValue({
                fieldId : 'custbody_sos_transaction_types',
                value : '2'
            })
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
            if (data.ship_to) {
                itemFulfillRec.setValue({ fieldId: 'shipaddresslist', value: null });

                const shippingSubrec = itemFulfillRec.getSubrecord({ fieldId: 'shippingaddress' });

                if (data.ship_to.country) {
                    shippingSubrec.setValue({ fieldId: 'country', value: 'ID' }); // hardcode atau ambil dari data.ship_to.country jika kamu punya mapping
                    itemFulfillRec.setValue({ fieldId: 'shipcountry', value: 'ID' });
                }
                if (data.ship_to.attention) {
                    shippingSubrec.setValue({ fieldId: 'attention', value: data.ship_to.attention });
                    itemFulfillRec.setValue({ fieldId: 'shipattention', value: data.ship_to.attention });
                }
                if (data.ship_to.addressee) {
                    shippingSubrec.setValue({ fieldId: 'addressee', value: data.ship_to.addressee });
                    itemFulfillRec.setValue({ fieldId: 'shipaddressee', value: data.ship_to.addressee });
                }
                if (data.ship_to.phone) {
                    shippingSubrec.setValue({ fieldId: 'phone', value: data.ship_to.phone });
                    itemFulfillRec.setValue({ fieldId: 'shipphone', value: data.ship_to.phone });
                }
                if (data.ship_to.address1) {
                    shippingSubrec.setValue({ fieldId: 'addr1', value: data.ship_to.address1 });
                    itemFulfillRec.setValue({ fieldId: 'shipaddr1', value: data.ship_to.address1 });
                }
                if (data.ship_to.address2) {
                    shippingSubrec.setValue({ fieldId: 'addr2', value: data.ship_to.address2 });
                    itemFulfillRec.setValue({ fieldId: 'shipaddr2', value: data.ship_to.address2 });
                }
                if (data.ship_to.city) {
                    shippingSubrec.setValue({ fieldId: 'city', value: data.ship_to.city });
                    itemFulfillRec.setValue({ fieldId: 'shipcity', value: data.ship_to.city });
                }
                if (data.ship_to.state) {
                    shippingSubrec.setValue({ fieldId: 'state', value: data.ship_to.state });
                    itemFulfillRec.setValue({ fieldId: 'shipstate', value: data.ship_to.state });
                }
                if (data.ship_to.zip) {
                    shippingSubrec.setValue({ fieldId: 'zip', value: data.ship_to.zip });
                    itemFulfillRec.setValue({ fieldId: 'shipzip', value: data.ship_to.zip });
                }
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
                status: true,
                ifId: ifId
            };

        } catch (e) {
            log.error('Error createItemFulfill', e);
            log.debug('e.message', e.message)
             const err = new Error(e.message);
                err.name = 'ITEM_FULFILLMENT_CREATION_FAILED';
                err.notifyOff = false;
                throw err;
        }
    }


     return {
    post: (context) => {
        var integrationLogRecordId = context.log_id || null;
      const scriptObj = runtime.getCurrentScript();
      var scriptId = scriptObj.id;
      var deploymentId = scriptObj.deploymentId;
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
            log.debug('e', e)
            result = {
                status: false,
                message: e.message || JSON.stringify(e)
            };
        }
        
        log.debug('result', result)
        var IfId = result.ifId
        log.debug('IfIdCheck', IfId)
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
            jobName: '- ABJ RS | ETP create IF',
            jobType: 'Restlet - POST',
            jobLink: 'JOB LINK - URL DARI POS',
            reqBody: JSON.stringify(context),
            resBody: JSON.stringify(result),
            linkTrx: IfId,
            status : true,
            logId : integrationLogRecordId,
            scriptId : scriptId,
            deploymentId : deploymentId
        });
      log.debug('integrationLogRec', integrationLogRec)
        if(!result.status){
           throw new Error(result.message)

        }else{
             return {
                status: true,
                message: 'Itemfulfill created successfully.',
                data: IfId
            };
        }
       
      } catch (e) {
        log.error('RESTlet Error', e);

        result = {
            status: false,
            message: e.message || 'Unexpected error occurred.',
        };
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
            jobName: '- ABJ RS | ETP create IF',
            jobType: 'Restlet - POST',
            jobLink: 'JOB LINK - URL DARI POS',
            reqBody: JSON.stringify(context),
            resBody: JSON.stringify(result),
            linkTrx: '',
            status : false,
          logId : integrationLogRecordId,
          scriptId : scriptId,
          deploymentId : deploymentId
        });
        log.debug('integrationLogRec', integrationLogRec)
        log.debug('resultMessage', result.message)
        if(!result.status){
            throw new Error(result.message)
        }
      }
    }
  };

});