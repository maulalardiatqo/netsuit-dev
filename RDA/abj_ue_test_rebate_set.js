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
        function afterSubmit(context) {
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                    log.debug('masuk save');
                    var rec = context.newRecord;
                    var recNew = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    })
                    var budgetAmount = recNew.getValue('custrecord_rda_rebate_budget_amount');
                    log.debug('budgetAmount', budgetAmount);
                    if(budgetAmount){
                        var toSetComment = 'Budget Amount :' + budgetAmount
                        recNew.setValue({
                            fieldId: "custrecord_comments_field",
                            value: toSetComment,
                            ignoreFieldChange: true,
                          });
                    }
                    var saveReb = recNew.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                      });
                      log.debug("saveReb", saveReb);

                }
            }catch (e) {
                log.debug('error', e)
            }
        }
        return {
            afterSubmit: afterSubmit,
        };
});