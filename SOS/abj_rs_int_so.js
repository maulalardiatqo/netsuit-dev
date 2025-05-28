/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', './abj_utils_sos_integration_log_record'], (record, log, error, format, integrationLogRecord) => {
  const createSalesOrder = (data) => {
    try {
      const so = record.create({
        type: record.Type.SALES_ORDER,
        isDynamic: false
      });
      log.debug('data.tran_date', data.tran_date)
      var dateObj = new Date(data.tran_date);
      log.debug('dateObj', dateObj)
      var shipDateObj = new Date(data.ship_date);
      log.debug('shipDateObj', shipDateObj)
      so.setValue({ fieldId: 'entity', value: data.entity.internal_id });
      so.setValue({ fieldId: 'subsidiary', value: data.subsidiary.internal_id });
      so.setValue({ fieldId: 'trandate', value: dateObj });
      so.setValue({ fieldId: 'location', value: data.location.internal_id });
      so.setValue({ fieldId: 'class', value: data.class.internal_id });
      so.setValue({ fieldId: 'department', value: data.department.internal_id });
      so.setValue({ fieldId: 'currency', value: data.currency.internal_id });
      so.setValue({ fieldId: 'exchangerate', value: data.exchange_rate });
      so.setValue({ fieldId: 'memo', value: data.memo || '' });
      if (data.sales_rep) so.setValue({ fieldId: 'salesrep', value: data.sales_rep.internal_id });
      if (data.ship_date) so.setValue({ fieldId: 'shipdate', value: shipDateObj });
      if (data.ship_address_list) so.setValue({ fieldId: 'shipaddresslist', value: data.ship_address_list.internal_id });

      data.order_items.forEach((line, index) => {
        so.setSublistValue({ sublistId: 'item', fieldId: 'item', line: index, value: line.item.internal_id });
        so.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: index, value: line.quantity });

        // Set price ke custom
        so.setSublistValue({ sublistId: 'item', fieldId: 'price', line: index, value: '-1' });

        // Pastikan rate bukan NaN
        var rateValue = parseFloat(line.rate);
        if (isNaN(rateValue)) {
            throw 'Rate is not a number!';
        }
        so.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: index, value: rateValue });

        if (line.units) {
            so.setSublistValue({ sublistId: 'item', fieldId: 'units', line: index, value: line.units.internal_id });
        }
        if (line.description) {
            so.setSublistValue({ sublistId: 'item', fieldId: 'description', line: index, value: line.description });
        }
        if (line.tax_code) {
            so.setSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: index, value: line.tax_code.internal_id });
        }
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

        const result = createSalesOrder(context.data);
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
          data: result
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
