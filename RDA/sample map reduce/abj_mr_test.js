/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/task'], function (search, record, log, task) {
    function getInputData() {
        var currentScript = runtime.getCurrentScript();
        var dataToProcess = currentScript.getParameter({ name: 'custscript_id_so_test' });
        log.debug('dataToProcess', dataToProcess)
    }

    function map(context) {
       
    }

    function reduce(context) {
    }

    function summarize(summary) {
        log.audit('Process Summary');
        
        summary.reduceSummary.errors.iterator().each(function (key, error) {
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
