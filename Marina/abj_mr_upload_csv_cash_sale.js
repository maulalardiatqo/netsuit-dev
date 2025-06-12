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
        log.debug('masuk kondisi')
        lines.shift();
      }
      log.debug('lines update', lines)

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
          outletId = outletId; // biarkan sesuai nilai asli kalau di luar list
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
      log.debug('parseData', parsedData)
      context.write({
        key: context.key,
        value: parsedData
      });

    } catch (e) {
      log.error('map error', `Line ${context.key}: ${e.message}`);
    }
  };



  const reduce = (context) => {
    // context.values.forEach(value => {
    //   try {
    //     const data = JSON.parse(value);

    //     // Validasi angka
    //     if (isNaN(data.customerId) || isNaN(data.itemId) || isNaN(data.quantity) || isNaN(data.rate)) {
    //       log.error('Invalid numeric values', data);
    //       return;
    //     }

    //     const cashSale = record.create({
    //       type: record.Type.CASH_SALE,
    //       isDynamic: true
    //     });

    //     cashSale.setValue({
    //       fieldId: 'entity',
    //       value: data.customerId
    //     });

    //     cashSale.selectNewLine({ sublistId: 'item' });
    //     cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: data.itemId });
    //     cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: data.quantity });
    //     cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: data.rate });
    //     cashSale.commitLine({ sublistId: 'item' });

    //     const recordId = cashSale.save({ ignoreMandatoryFields: false });

    //     log.audit('Cash Sale created', `ID: ${recordId} for customer ${data.customerId}`);
    //   } catch (e) {
    //     log.error('reduce error', `Key ${context.key}: ${e.message}`);
    //   }
    // });
  };

  return { getInputData, map, reduce };
});
