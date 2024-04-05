/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var expRpt = rec.getValue('custbody5');
                var depoId = rec.id
                log.debug('depoid', depoId)
                if(expRpt){
                    var recExp = record.load({
                        type : 'expensereport',
                        id : expRpt,
                        isDynamic : false
                    })
                    recExp.setValue({
                        fieldId : 'custbody_abj_deposit',
                        value: depoId, 
                        ignoreFieldChange: true
                    });
                    var saveRec = recExp.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRec', saveRec)

                }
            }
        } catch (e) {
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});