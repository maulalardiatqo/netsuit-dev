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
      so.setValue({ fieldId: 'department', value: "6" });
      so.setValue({ fieldId: 'currency', value: data.currency.internal_id });
      so.setValue({ fieldId: 'exchangerate', value: data.exchange_rate });
      so.setValue({ fieldId: 'memo', value: data.memo || '' });
      so.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.tran_etp || '' });
      so.setValue({ fieldId : 'orderstatus', value : 'B'});
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
      // set ship address
      if (data.ship_to) {
        so.setValue({ fieldId: 'shipaddresslist', value: null });

        const shippingSubrec = so.getSubrecord({ fieldId: 'shippingaddress' });

        if (data.ship_to.country) {
          shippingSubrec.setValue({ fieldId: 'country', value: 'ID' }); // hardcode atau ambil dari data.ship_to.country jika kamu punya mapping
          so.setValue({ fieldId: 'shipcountry', value: 'ID' });
        }
        if (data.ship_to.attention) {
          shippingSubrec.setValue({ fieldId: 'attention', value: data.ship_to.attention });
          so.setValue({ fieldId: 'shipattention', value: data.ship_to.attention });
        }
        if (data.ship_to.addressee) {
          shippingSubrec.setValue({ fieldId: 'addressee', value: data.ship_to.addressee });
          so.setValue({ fieldId: 'shipaddressee', value: data.ship_to.addressee });
        }
        if (data.ship_to.phone) {
          shippingSubrec.setValue({ fieldId: 'phone', value: data.ship_to.phone });
          so.setValue({ fieldId: 'shipphone', value: data.ship_to.phone });
        }
        if (data.ship_to.address1) {
          shippingSubrec.setValue({ fieldId: 'addr1', value: data.ship_to.address1 });
          so.setValue({ fieldId: 'shipaddr1', value: data.ship_to.address1 });
        }
        if (data.ship_to.address2) {
          shippingSubrec.setValue({ fieldId: 'addr2', value: data.ship_to.address2 });
          so.setValue({ fieldId: 'shipaddr2', value: data.ship_to.address2 });
        }
        if (data.ship_to.city) {
          shippingSubrec.setValue({ fieldId: 'city', value: data.ship_to.city });
          so.setValue({ fieldId: 'shipcity', value: data.ship_to.city });
        }
        if (data.ship_to.state) {
          shippingSubrec.setValue({ fieldId: 'state', value: data.ship_to.state });
          so.setValue({ fieldId: 'shipstate', value: data.ship_to.state });
        }
        if (data.ship_to.zip) {
          shippingSubrec.setValue({ fieldId: 'zip', value: data.ship_to.zip });
          so.setValue({ fieldId: 'shipzip', value: data.ship_to.zip });
        }
      }
      data.order_items.forEach((line) => {
        so.selectNewLine({ sublistId: 'item' });

        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: line.item.internal_id
        });
        var brand = so.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'cseg_sos_brand'
        });
        if(brand == '' || brand == null){
            so.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'cseg_sos_brand',
              value: line.brand.internal_id
            });
        }
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
        if (line.description) {
          so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: line.description
          });
        }

        
        if(line.brand.internal_id){
           so.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'cseg_sos_brand',
            value: line.brand.internal_id
          });
        }
        
        // if (line.units) {
        //   so.setCurrentSublistValue({
        //     sublistId: 'item',
        //     fieldId: 'units',
        //     value: line.units.internal_id
        //   });
        // }
        var grossAmt = line.gross_amount
        // var rateValue = parseFloat(line.rate);
        // log.debug('rateValue', rateValue)
       
        if (line.tax_code) {
            so.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'taxcode',
              value: line.tax_code.internal_id
            });
        }
        so.setCurrentSublistValue({
          sublistId : 'item',
          fieldId : 'grossamt',
          value : grossAmt
        })
        var amtLine = so.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount'
        });
        log.debug('amtLine', amtLine);
        var rateSet = Number(amtLine) / Number(line.quantity);
        log.debug('rateSet', rateSet);
        so.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: rateSet,
          ignoreFieldChange : true
        });
        so.setCurrentSublistValue({
          sublistId : 'item',
          fieldId : 'custcol_sos_disc_amount',
          value : line.discount_line
        })
        // var amount = Number(rateValue) * Number(line.quantity)
        // log.debug('amount', amount)
        // so.setCurrentSublistValue({
        //   sublistId: 'item',
        //   fieldId: 'amount',
        //   value: amount
        // });
        

        so.commitLine({ sublistId: 'item' });
      });
      
      const salesOrderId = so.save({ enableSourcing: true, ignoreMandatoryFields: false });
      log.debug('salesOrderId', salesOrderId)
      
      return {
        status: true,
        salesOrderId: salesOrderId
      };

    } catch (e) {
      log.error('Error creating Sales Order', e);
      throw new Error({
        name: 'SALES_ORDER_CREATION_FAILED',
        message: e.message,
        notifyOff: false
      });
    }
  };
 const updateSalesOrder = (data, internalId) => {
  try {
    const soRecord = record.load({
      type: record.Type.SALES_ORDER,
      id: internalId,
      isDynamic: true
    });
    // Set field header
     var dateObj = new Date(data.tran_date);
      log.debug('dateObj', dateObj)
      var shipDateObj = new Date(data.ship_date);
      log.debug('shipDateObj', shipDateObj)
      soRecord.setValue({ fieldId: 'entity', value: data.entity.internal_id });
      // soRecord.setValue({ fieldId: 'subsidiary', value: data.subsidiary.internal_id });
      // if(data.order_type && data.order_type == 'preorder'){
      //   log.debug('masuk order type', data.order_type)
        
      // }
      soRecord.setValue({ fieldId: 'custbody_sos_transaction_types', value: data.order_type.internal_id});
      soRecord.setValue({ fieldId: 'trandate', value: dateObj });
      soRecord.setValue({ fieldId: 'location', value: data.location.internal_id });
      soRecord.setValue({ fieldId: 'class', value: data.class.internal_id });
      soRecord.setValue({ fieldId: 'department', value: data.department.internal_id });
      soRecord.setValue({ fieldId: 'currency', value: data.currency.internal_id });
      soRecord.setValue({ fieldId: 'exchangerate', value: data.exchange_rate });
      soRecord.setValue({ fieldId: 'memo', value: data.memo || '' });
      soRecord.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.tran_etp || '' });
      soRecord.setValue({ fieldId : 'orderstatus', value : 'B'});
      var cekMID = soRecord.getValue('custbody_sos_merchant_id');
      log.debug('cekMID', cekMID)
      if(cekMID){
        log.debug('ada cekMID')
      }else{
        soRecord.setValue({ fieldId: 'custbody_sos_tran_etp', value: data.merchant_id || '' });
      }
      
      if (data.sales_rep) soRecord.setValue({ fieldId: 'salesrep', value: data.sales_rep.internal_id });
      if (data.ship_date) soRecord.setValue({ fieldId: 'shipdate', value: shipDateObj });
      if (data.ship_address_list) soRecord.setValue({ fieldId: 'shipaddresslist', value: data.ship_address_list.internal_id });

    // Ship-to Address (jika disediakan)
   if (data.ship_to) {
        soRecord.setValue({ fieldId: 'shipaddresslist', value: null });

        const shippingSubrec = soRecord.getSubrecord({ fieldId: 'shippingaddress' });

        if (data.ship_to.country) {
          shippingSubrec.setValue({ fieldId: 'country', value: 'ID' }); // hardcode atau ambil dari data.ship_to.country jika kamu punya mapping
          soRecord.setValue({ fieldId: 'shipcountry', value: 'ID' });
        }
        if (data.ship_to.attention) {
          shippingSubrec.setValue({ fieldId: 'attention', value: data.ship_to.attention });
          soRecord.setValue({ fieldId: 'shipattention', value: data.ship_to.attention });
        }
        if (data.ship_to.addressee) {
          shippingSubrec.setValue({ fieldId: 'addressee', value: data.ship_to.addressee });
          soRecord.setValue({ fieldId: 'shipaddressee', value: data.ship_to.addressee });
        }
        if (data.ship_to.phone) {
          shippingSubrec.setValue({ fieldId: 'phone', value: data.ship_to.phone });
          soRecord.setValue({ fieldId: 'shipphone', value: data.ship_to.phone });
        }
        if (data.ship_to.address1) {
          shippingSubrec.setValue({ fieldId: 'addr1', value: data.ship_to.address1 });
          soRecord.setValue({ fieldId: 'shipaddr1', value: data.ship_to.address1 });
        }
        if (data.ship_to.address2) {
          shippingSubrec.setValue({ fieldId: 'addr2', value: data.ship_to.address2 });
          soRecord.setValue({ fieldId: 'shipaddr2', value: data.ship_to.address2 });
        }
        if (data.ship_to.city) {
          shippingSubrec.setValue({ fieldId: 'city', value: data.ship_to.city });
          soRecord.setValue({ fieldId: 'shipcity', value: data.ship_to.city });
        }
        if (data.ship_to.state) {
          shippingSubrec.setValue({ fieldId: 'state', value: data.ship_to.state });
          soRecord.setValue({ fieldId: 'shipstate', value: data.ship_to.state });
        }
        if (data.ship_to.zip) {
          shippingSubrec.setValue({ fieldId: 'zip', value: data.ship_to.zip });
          soRecord.setValue({ fieldId: 'shipzip', value: data.ship_to.zip });
        }
      }

    const updatedId = soRecord.save({ ignoreMandatoryFields: true });

    return {
      status: true,
      message: "Sales Order updated successfully",
      internal_id: updatedId
    };

  } catch (e) {
    log.error('Error Updating Sales Order', e);
    return{
      status: false,
      message: e.message
    }
  }
};

  return {
    post: (context) => {
      try {
        log.audit('Received Data', JSON.stringify(context));

        // Validate transaction_type
        if (!context.transaction_type || context.transaction_type !== 'sales_order') {
          throw new Error({
            name: 'INVALID_TRANSACTION_TYPE',
            message: 'This endpoint only accepts transaction_type = "sales_order".',
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
                result = {
                  status: false,
                  message: 'ETP Number Already Exist',
                };
            }else{
              try{
                result = createSalesOrder(context.data);
              }catch(e){
                result = {
                  status: false,
                  message: e.message
                };
              }
              
            }

        }else{
              try{
                result = createSalesOrder(context.data);
              }catch(e){
                result = {
                  status: false,
                  message: e.message
                };
              }
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
        log.debug('result Status', result.status)
        if(!result.status){
            throw new Error(result.message)
        }else{
            return {
              status: true,
              message: 'Sales Order created successfully.',
              data: salesOrderId
            };
        }
      } catch (e) {
        log.debug('masuk catch juga')
        log.debug('RESTlet Error', e);

        result = {
          status: false,
          message: e.message
        };
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
          jobName: '- ABJ RS | ETP create SO',
          jobType: 'Restlet - POST',
          jobLink: 'JOB LINK - URL DARI POS',
          reqBody: JSON.stringify(context.data),
          resBody: JSON.stringify(result),
          linkTrx: ''
        });
        log.debug('integrationLogRec', integrationLogRec)
        if(!result.status){
          throw new Error(result.message)
        }
      }
    },
    put: (context) => {
      try{
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
              var soId = resultSet[0].getValue({ name: 'internalid' });
              log.debug('soId', soId)
              result = updateSalesOrder(context.data, soId);
          }else{
              result = {
                status: false,
                message: e.message
              };
          }

        }else{
          result = {
            status: false,
            message: "ETP Number is Requered For Updating Sales Order"
          };
        }
        var salesOrderId = result.internal_id;
        const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
          jobName: '- ABJ RS | ETP create SO',
          jobType: 'Restlet - PUT',
          jobLink: 'JOB LINK - URL DARI POS',
          reqBody: JSON.stringify(context.data),
          resBody: JSON.stringify(result),
          linkTrx: soId
        });
      log.debug('integrationLogRec', integrationLogRec)
        log.debug('result Status', result.status)
        if(!result.status){
            throw new Error(result.message)
        }else{
            return {
              status: true,
              message: 'Sales Order update successfully.',
              data: soId
            };
        }
      }catch(e){
          log.debug('RESTlet Error', e);

          result = {
            status: false,
            message: e.message
          };
          const integrationLogRec = integrationLogRecord.createSOSIntegrationLog({
            jobName: '- ABJ RS | ETP create SO',
            jobType: 'Restlet - PUT',
            jobLink: 'JOB LINK - URL DARI POS',
            reqBody: JSON.stringify(context.data),
            resBody: JSON.stringify(result),
            linkTrx: ''
          });
          log.debug('integrationLogRec', integrationLogRec)
          if(!result.status){
            throw new Error(result.message)
          }
      }
    } 
  };

});
