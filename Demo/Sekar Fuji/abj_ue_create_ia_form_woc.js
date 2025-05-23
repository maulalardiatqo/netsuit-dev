/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log", "N/format","N/query"], function (record, search, log,format, query) {
    function afterSubmit(context) {
        try {
           
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var recId = rec.id;

                var newRec = record.load({
                    type : 'workordercompletion',
                    id : recId,
                    isDynamic : false
                })

                const suiteQL = `
                SELECT 
                    tl.account,
                    tl.debit,
                    tl.credit,
                    tl.memo,
                    tl.linesequencenumber
                    FROM 
                    transactionline tl
                    WHERE 
                    tl.transaction = ${recId}
                    AND tl.posting = 'T'
                `;

            const results = query.runSuiteQL({ query: suiteQL }).asMappedResults();

            log.debug('GL Impact Lines', results);

            // You can loop over results to process each line
            results.forEach((line, index) => {
                log.audit(`Line ${index + 1}`, `Account: ${line.account}, Debit: ${line.debit}, Credit: ${line.credit}`);
            });
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});