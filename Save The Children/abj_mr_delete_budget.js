/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime'], function (search, record, log, runtime) {

    function getInputData() {
        const script = runtime.getCurrentScript();
        const searchId = script.getParameter({
            name: 'custscript_saved_search_id_4'
        });

        if (!searchId) {
            throw new Error('Saved Search ID is required in deployment parameter');
        }

        log.audit('Using Saved Search', searchId);

        return search.load({ id: searchId });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        let transId = result.id;
        
        let transType = "budget"; 

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

            log.audit('Deleted Budget Record', { id: transId });

        } catch (e) {
            log.error('Error Deleting', { id: transId, error: e });
        }
    }

    function summarize(summary) {
        log.audit('Process Summary', {
            totalProcessed: summary.inputSummary.recordCount
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});