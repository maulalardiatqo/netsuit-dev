/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/runtime', 'N/log'], (file, record, runtime, log) => {

  const getInputData = () => {
    try {
      const fileId = runtime.getCurrentScript().getParameter({ name: 'custscript_csv_file_id' });
      const csvFile = file.load({ id: fileId });
      let lines = csvFile.getContents().split(/\r?\n/).filter(line => line.trim() !== '');
      log.debug('lines', lines)

      // Buang header jika ada
      if (lines[0].toLowerCase().includes('customer_id')) {
        lines.shift();
      }

      return lines;
    } catch (e) {
      log.error('getInputData error', e);
      throw e;
    }
  };

  const map = (context) => {
    try {
      const line = context.value;
      const values = line.split(',').map(val => val.trim());

      if (values.length < 12) return; // pastikan ada 12 kolom sesuai header

      const [
        date,
        customerId,
        orderName,
        outletIdRaw,
        outletName,
        itemId,
        product,
        quantity,
        amount,
        tax,
        voucher,
        discount
      ] = values;

      // Validasi dan mapping outletId sesuai ketentuan
      let outletId = parseInt(outletIdRaw);
      switch (outletId) {
        case 8806:
        case 8604:
        case 2:
          outletId = 2;
          break;
        case 8805:
        case 7395:
        case 1:
          outletId = 1;
          break;
        default:
          outletId = outletId;
          break;
      }

      const parsedData = {
        date,
        customerId: parseInt(customerId),
        orderName,
        outletId,
        outletName,
        itemId: parseInt(itemId),
        product,
        quantity: parseFloat(quantity),
        amount: parseFloat(amount),
        tax: parseFloat(tax),
        voucher: parseFloat(voucher),
        discount: parseFloat(discount)
      };
      context.write({
        key: orderName,
        value: parsedData
      });

    } catch (e) {
      log.error('map error', `Line ${context.key}: ${e.message}`);
    }
  };



  const reduce = (context) => {
  try {
    function parseNetSuiteDate(dateStr) {
      const parts = dateStr.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; 
      const year = parseInt(parts[2], 10);

      return new Date(year, month, day); // format: new Date(YYYY, MM, DD)
    }
    const orderLines = context.values.map(JSON.parse);

    const headerData = orderLines[0];
    const cashSale = record.create({
      type: record.Type.CASH_SALE,
      isDynamic: true
    });

    cashSale.setValue({ fieldId: 'entity', value: headerData.customerId });
    const parsedDate = parseNetSuiteDate(headerData.date);
    cashSale.setValue({ fieldId: 'trandate', value: parsedDate });
    cashSale.setValue({ fieldId: 'memo', value: 'Upload CSV'});
    cashSale.setValue({ fieldId: 'location', value: headerData.outletId });
    cashSale.setValue({ fieldId: 'account', value: 1 });
    cashSale.setValue({ fieldId: 'tranid', value: headerData.orderName});
    cashSale.setValue({ fieldId: 'externalid', value: headerData.orderName});

    orderLines.forEach(line => {
      cashSale.selectNewLine({ sublistId: 'item' });
      cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: line.itemId });
      cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: "-1" });
      cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: line.quantity });
      if(line.itemId == '243'){
        cashSale.setCurrentSublistValue({sublistId : 'item', fieldId : 'taxcode', value: "5"})
      }else{
        cashSale.setCurrentSublistValue({sublistId : 'item', fieldId : 'taxcode', value: "6"})
      }
      cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value: line.amount });
      var cekLineAmt = cashSale.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount'
      });
      log.debug('cekLineAmt', cekLineAmt)
      var rateSet = parseFloat((Number(cekLineAmt) / Number(line.quantity)).toFixed(2));
      log.debug('rateSet', rateSet);
      cashSale.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          value: rateSet,
          ignoreFieldChange : true
        });
      cashSale.commitLine({ sublistId: 'item' });
    });

    const id = cashSale.save();
    log.audit('Cash Sale Created', `Order: ${context.key}, ID: ${id}`);
  } catch (e) {
    log.error('reduce error', `Order: ${context.key}, Error: ${e.message}`);
    try {
      const errorRecord = record.create({
        type: 'customrecord1426',
        isDynamic: true
      });

      errorRecord.setValue({
        fieldId: 'custrecord_document_number',
        value: context.key
      });

      errorRecord.setValue({
        fieldId: 'custrecord_error_msg',
        value: e.message
      });

      const errorId = errorRecord.save();
      log.audit('Error Record Created', `Order: ${context.key}, Error Record ID: ${errorId}`);
    } catch (err) {
      log.error('Gagal simpan error record', `Order: ${context.key}, Error: ${err.message}`);
    }
  }
};


  return { getInputData, map, reduce };
});
