/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log'], (record, log) => {

  const getInputData = () => {
    return [{ type: record.Type.SALES_ORDER, id: '791' }];
  };

  const map = (context) => {
    try {
      const value = JSON.parse(context.value);
      const recordType = value.type;
      const recordId = value.id;

      log.audit('Menghapus Sales Order', `Type: ${recordType}, ID: ${recordId}`);

      record.delete({
        type: recordType,
        id: recordId
      });

      log.audit('Sukses Dihapus', `Sales Order ID ${recordId}`);

    } catch (error) {
      log.error('Gagal Menghapus Sales Order', error);
    }
  };

  return { getInputData, map };
});
