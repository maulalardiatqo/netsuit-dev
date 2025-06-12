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

      // Buang header jika ada
      if (lines[0].toLowerCase().includes('customer')) {
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
      const values = line.split(',');

      if (values.length < 5) return;

      const [customerId, email, itemId, quantity, rate] = values.map(val => val.trim());

      // Validasi minimal
      if (!customerId || !itemId || !quantity || !rate) return;

      const parsedData = {
        customerId: parseInt(customerId),
        email,
        itemId: parseInt(itemId),
        quantity: parseFloat(quantity),
        rate: parseFloat(rate)
      };

      // Gunakan ID transaksi sebagai key (jika unique) atau generate key acak
      context.write({
        key: context.key,
        value: parsedData
      });
    } catch (e) {
      log.error('map error', `Line ${context.key}: ${e.message}`);
    }
  };

  const reduce = (context) => {
    context.values.forEach(value => {
      try {
        const data = JSON.parse(value);

        // Validasi angka
        if (isNaN(data.customerId) || isNaN(data.itemId) || isNaN(data.quantity) || isNaN(data.rate)) {
          log.error('Invalid numeric values', data);
          return;
        }

        const cashSale = record.create({
          type: record.Type.CASH_SALE,
          isDynamic: true
        });

        cashSale.setValue({
          fieldId: 'entity',
          value: data.customerId
        });

        cashSale.selectNewLine({ sublistId: 'item' });
        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: data.itemId });
        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: data.quantity });
        cashSale.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: data.rate });
        cashSale.commitLine({ sublistId: 'item' });

        const recordId = cashSale.save({ ignoreMandatoryFields: false });

        log.audit('Cash Sale created', `ID: ${recordId} for customer ${data.customerId}`);
      } catch (e) {
        log.error('reduce error', `Key ${context.key}: ${e.message}`);
      }
    });
  };

  return { getInputData, map, reduce };
});
