/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', './abj_utils_sos_integration_log_record', 'N/search'], (record, log, error, format, integrationLogRecord, search) => {
  const createSalesOrder = (data) => {
    try {
      const so = record.create({
        type: record.Type.SALES_ORDER,
        isDynamic: true
      });
      log.debug('data.tran_date', data.tran_date)
      var dateObj = new Date(data.tran_date);
      log.debug('dateObj', dateObj)
      var shipDateObj = new Date(data.ship_date);
      log.debug('shipDateObj', shipDateObj)
      so.setValue({ fieldId: 'customform', value: 125});
      log.debug('transType', data.order_type);
      
      so.setValue({ fieldId: 'entity', value: data.entity.internal_id });
      // so.setValue({ fieldId: 'subsidiary', value: data.subsidiary.internal_id });
      // if(data.order_type && data.order_type == 'preorder'){
      //   log.debug('masuk order type', data.order_type)
        
      // }
      so.setValue({ fieldId: 'custbody_sos_transaction_types', value: data.order_type.internal_id});
      so.setValue({ fieldId: 'trandate', value: dateObj });
      so.setValue({ fieldId: 'location', value: data.location.internal_id });
      so.setValue({ fieldId: 'class', value: data.class.internal_id });
      so.setValue({ fieldId: 'department', value: data.department.internal_id });
      so.setValue({ fieldId: 'currency', value: data.currency.internal_id });
      so.setValue({ fieldId: 'exchangerate', value: data.exchange_rate });
      so.setValue({ fieldId: 'memo', value: data.memo || '' });
      so.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.tran_etp || '' });
      var cekMID = so.getValue('custbody_sos_merchant_id');
      log.debug('cekMID', cekMID)
      if(cekMID){
        log.debug('ada cekMID')
      }else{
        so.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.merchant_id || '' });
      }
      
      if (data.sales_rep) so.setValue({ fieldId: 'salesrep', value: data.sales_rep.internal_id });
      if (data.ship_date) so.setValue({ fieldId: 'shipdate', value: shipDateObj });
      if (data.ship_address_list) so.setValue({ fieldId: 'shipaddresslist', value: data.ship_address_list.internal_id });
      data.order_items.forEach((line) => {
        so.selectNewLine({ sublistId: 'item' });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: line.item.internal_id
        });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: line.quantity
        });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'price',
          value: '-1'
        });

        
        if (line.units) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'units',
            value: line.units.internal_id
          });
        }
        var rateValue = parseFloat(line.rate);
        log.debug('rateValue', rateValue)
        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: rateValue
        });
        var amount = Number(rateValue) * Number(line.quantity)
        log.debug('amount', amount)
        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: amount
        });
        if (line.description) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: line.description
          });
        }

        if (line.tax_code) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'taxcode',
            value: line.tax_code.internal_id
          });
        }

        so.commitLine({ sublistId: 'item' });
      });
      
      const salesOrderId = so.save({ enableSourcing: true, ignoreMandatoryFields: false });
      log.debug('salesOrderId', salesOrderId)
      
      return {
        success: true,
        salesOrderId: salesOrderId
      };

    } catch (e) {
      log.error('Error creating Sales Order', e);
      throw error.create({
        name: 'SALES_ORDER_CREATION_FAILED',
        message: e.message,
        notifyOff: false
      });
    }
  };
  const updateSalesOrder = (data, internalId) => {
    try {
      log.debug('data update', data);
      log.debug('internalID', internalId);

      const so = record.load({
        type: record.Type.SALES_ORDER,
        id: internalId,
        isDynamic: true
      });

      var dateObj = new Date(data.tran_date);
      var shipDateObj = new Date(data.ship_date);

      so.setValue({ fieldId: 'entity', value: data.entity.internal_id });
      so.setValue({ fieldId: 'custbody_sos_transaction_types', value: data.order_type.internal_id });
      so.setValue({ fieldId: 'trandate', value: dateObj });
      so.setValue({ fieldId: 'location', value: data.location.internal_id });
      so.setValue({ fieldId: 'class', value: data.class.internal_id });
      so.setValue({ fieldId: 'department', value: data.department.internal_id });
      so.setValue({ fieldId: 'currency', value: data.currency.internal_id });
      so.setValue({ fieldId: 'exchangerate', value: data.exchange_rate });
      so.setValue({ fieldId: 'memo', value: data.memo || '' });
      so.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.tran_etp || '' });

      if (data.sales_rep) so.setValue({ fieldId: 'salesrep', value: data.sales_rep.internal_id });
      if (data.ship_date) so.setValue({ fieldId: 'shipdate', value: shipDateObj });
      if (data.ship_address_list) so.setValue({ fieldId: 'shipaddresslist', value: data.ship_address_list.internal_id });

      // Hapus semua item line sebelum menambahkan ulang
      const numLines = so.getLineCount({ sublistId: 'item' });
      for (let i = numLines - 1; i >= 0; i--) {
        so.removeLine({
          sublistId: 'item',
          line: i
        });
      }

      // Tambahkan kembali item lines dari data.order_items
      data.order_items.forEach((line) => {
        so.selectNewLine({ sublistId: 'item' });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: line.item.internal_id
        });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: line.quantity
        });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'price',
          value: '-1'
        });

        if (line.units) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'units',
            value: line.units.internal_id
          });
        }

        const rateValue = parseFloat(line.rate);
        const amount = Number(rateValue) * Number(line.quantity);

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: rateValue
        });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: amount
        });

        if (line.description) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: line.description
          });
        }

        if (line.tax_code) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'taxcode',
            value: line.tax_code.internal_id
          });
        }

        so.commitLine({ sublistId: 'item' });
      });

      const updatedId = so.save({
        enableSourcing: true,
        ignoreMandatoryFields: false
      });

      log.debug('Updated SO ID', updatedId);

      return {
        success: true,
        salesOrderId: updatedId
      };

    } catch (e) {
      log.error('Error updating Sales Order', e);
      throw error.create({
        name: 'SALES_ORDER_UPDATE_FAILED',
        message: e.message,
        notifyOff: false
      });
    }
  };

  return {
    post: (context) => {
      try {
        log.audit('Received Data', JSON.stringify(context));

        // Validate transaction_type
        if (!context.transaction_type || context.transaction_type !== 'sales_order') {
          throw error.create({
            name: 'INVALID_TRANSACTION_TYPE',
            message: 'This endpoint only accepts transaction_type = "sales_order".',
            notifyOff: false
          });
        }

        // Validate required data
        if (!context.data || !context.data.entity) {
          throw error.create({
            name: 'MISSING_REQUIRED_DATA',
            message: 'Entity data is required in payload.',
            notifyOff: false
          });
        }
        var cekTranEtp = context.data.tran_etp;
        log.debug('cekTranEtp', cekTranEtp)
        var result
        if(cekTranEtp){
            var salesorderSearchObj = search.create({
                type: "salesorder",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                filters: [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["custbody_sos_tran_etp", "is", cekTranEtp],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });

            var resultSet = salesorderSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            if (resultSet.length > 0) {
                var searchResult = resultSet[0];
                var internalId = searchResult.getValue({ name: "internalid" });
                log.debug("Found Sales Order Internal ID", internalId);
                result = updateSalesOrder(context.data, internalId);
            }else{
              result = createSalesOrder(context.data);
            }

        }else{
           result = createSalesOrder(context.data);
        }
        
        log.debug('result', result)
        var salesOrderId = result.salesOrderId
        log.debug('salesOrderId cek', salesOrderId)
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
          jobName: '- ABJ RS | ETP create SO',
          jobType: 'Restlet - POST',
          jobLink: 'JOB LINK - URL DARI POS',
          reqBody: JSON.stringify(context.data),
          resBody: JSON.stringify(result),
          linkTrx: salesOrderId
      });
      log.debug('integrationLogRec', integrationLogRec)

        return {
          status: 'success',
          message: 'Sales Order created successfully.',
          data: salesOrderId
        };

      } catch (e) {
        log.error('RESTlet Error', e);

        return {
          status: 'error',
          message: e.message || 'Unexpected error occurred.',
          code: e.name || 'UNEXPECTED_ERROR'
        };
      }
    }
  };

});
