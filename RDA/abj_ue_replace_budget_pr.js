/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/config"], function(
    record,
    search,
    config
    ) {
        function beforeSubmit(context) {
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                    log.debug('masuk')
                    var recNew = context.newRecord;
                    var lineCountExpense = recNew.getLineCount({sublistId : "expense" })
                    log.debug('lineCountExpense', lineCountExpense)
                    if(lineCountExpense > 0){
                        for(var i = 0; i < lineCountExpense; i++){
                            var estAmtExp = recNew.getSublistValue({
                                sublistId : 'expense',
                                fieldId : 'estimatedamount',
                                line : i
                            });
                            var cekBudgetAmount = recNew.getSublistValue({
                                sublistId : 'expense',
                                fieldId : 'custcol_bm_budgetamount',
                                line : i
                            });
                            log.debug('estAmtExp', estAmtExp);
                            log.debug('cekBudgetAmount', cekBudgetAmount);
                            if(estAmtExp && cekBudgetAmount){
                                recNew.setSublistValue({
                                    sublistId:'expense',
                                    fieldId:'custcol_bm_budgetamountconsumed',
                                    line:i,
                                    value:estAmtExp
                                });
                            }
                        }
                    }
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return {
            beforeSubmit: beforeSubmit,
        };
});