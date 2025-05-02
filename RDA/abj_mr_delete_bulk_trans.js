/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime'], function (search, record, log, runtime) {
    function getInputData() {
        log.debug('masuk call')
        try {
            var currentScript = runtime.getCurrentScript();
            var searchId = currentScript.getParameter({
                name: "custscript_ps_savedsearch_id_abj"
            });

            log.debug({
                title: "Saved Search ID",
                details: searchId
            });
            return search.load({ id: searchId });
        } catch (e) {
            log.debug({
                title: "error",
                details: e.message
            });
        }
    }

    function map(context) {
        try{
            const result = JSON.parse(context.value);
            const idTrans = result.id;
            const transType = result.recordType;
            
            log.debug('datamap', {idTrans : idTrans, transType : transType})
            context.write({
                key: idTrans,
                value: JSON.stringify({ idTrans, transType })
            });

        }catch(e){
            log.debug('error', e)
        }
    }

    function reduce(context) {
        context.values.forEach(val => {
            try {
                const data = JSON.parse(val);
                log.debug('Menghapus transaksi', data);

                if (data.idTrans && data.transType) {
                    record.delete({
                        type: data.transType,
                        id: data.idTrans
                    });
                    log.debug('Berhasil Dihapus', `RecordType: ${data.transType}, ID: ${data.idTrans}`);
                } else {
                    log.error('Data tidak lengkap', data);
                }

            } catch (e) {
                log.error('Gagal menghapus record', e.message);
            }
        });
    }

    function summarize(summary) {
        // log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
        // summary.reduceSummary.errors.iterator().each(function (key, error) {
        //     log.error(`Error Deleting Record ID ${key}`, error);
        //     return true;
        // });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
