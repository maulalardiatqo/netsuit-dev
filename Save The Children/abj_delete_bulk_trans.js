/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime'], function (search, record, log, runtime) {

    function getInputData() {
        const script = runtime.getCurrentScript();
        const searchId = script.getParameter({
            name: 'custscript_saved_search_id_2'
        });

        if (!searchId) {
            throw new Error('Saved Search ID is required in deployment parameter');
        }

        log.audit('Using Saved Search', searchId);

        return search.load({ id: searchId });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        log.debug('result', result)
        let transId   = result.id;
        let transType = result.recordType;
        log.debug('transType', transType)
        context.write({
            key: transId,
            value: transType
        });
    }

    function reduce(context) {
        let transId = context.key;
        let transType = context.values[0]; 

        try {
            record.delete({
                type: transType,
                id: transId
            });

            log.audit('Deleted Transaction', {
                id: transId,
                type: transType
            });

        } catch (e) {
            log.error('Error Deleting Transaction', {
                id: transId,
                type: transType,
                error: e
            });
        }
    }

    function summarize(summary) {
        log.audit('Process Summary', {
            totalProcessed: summary.inputSummary.recordCount
        });

        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error(`Error on ID ${key}`, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
