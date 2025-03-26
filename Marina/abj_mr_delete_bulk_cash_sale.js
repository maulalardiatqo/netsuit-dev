/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function getInputData() {
        return search.load({ id: 'customsearch2290' });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        let cashSaleId = result.id;
        context.write({ key: cashSaleId, value: cashSaleId });
    }

    function reduce(context) {
        let cashSaleIds = context.values;
        cashSaleIds.forEach(id => {
            try {
                record.delete({
                    type: record.Type.CASH_SALE,
                    id: id
                });
                log.audit('Deleted Cash Sale', `ID: ${id}`);
            } catch (error) {
                log.error('Error Deleting Cash Sale', error);
            }
        });
    }

    function summarize(summary) {
        log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error(`Error Deleting Record ID ${key}`, error);
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
