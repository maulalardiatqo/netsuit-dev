/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/log'], (file, record, log) => {
    const FILE_ID = '18805'; 

    const getInputData = () => {
        try {
            const csvFile = file.load({ id: FILE_ID });
            const content = csvFile.getContents();
            const lines = content.split(/\r?\n/).filter(line => line && !line.toLowerCase().includes('allid'));
            return lines.map(line => line.trim());
        } catch (e) {
            log.error('Gagal membaca file CSV', e);
            throw e;
        }
    };

    const map = (context) => {
        const internalId = context.value;
        context.write({
            key: internalId,
            value: internalId
        });
    };

    const reduce = (context) => {
        const internalId = context.key;
        try {
            record.delete({
                type: record.Type.CASH_SALE,
                id: internalId
            });
            log.audit('Berhasil hapus Cash Sale', `ID: ${internalId}`);
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

    return {
        getInputData,
        map,
        reduce
    };
});
