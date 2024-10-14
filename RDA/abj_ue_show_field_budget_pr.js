/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'], function(record, serverWidget) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || 
            context.type === context.UserEventType.EDIT || 
            context.type === context.UserEventType.VIEW) {
            
            var purchaseRequisitionRecord = context.newRecord;
            var expenseLineCount = purchaseRequisitionRecord.getLineCount({
                sublistId: 'expense'
            });
            
            for (var i = 0; i < expenseLineCount; i++) {
                var budgetAmount = purchaseRequisitionRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_bm_budgetamount',
                    line: i
                });
                log.debug('budgetAmount', budgetAmount)
                context.form.getSublist({
                    id: 'expense'
                }).getField({
                    id: 'custcol_bm_budgetamount'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
