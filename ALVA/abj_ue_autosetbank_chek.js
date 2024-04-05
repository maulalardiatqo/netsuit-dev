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
              if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                log.debug('masuk')
                var rec = context.newRecord;
                var recNew = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                })
                var emp = recNew.getValue('entity');
                log.debug('emp', emp)
                if(emp){
                    var recEmp = record.load({
                        type: 'employee',
                        id : emp,
                        isDynamic : false
                    })
                    var bankName = recEmp.getValue('custentity_abj_bank_name');
                    if(bankName){
                        recNew.setValue({
                            fieldId : 'custbody_check_bank_name',
                            value : bankName,
                            ignoreFieldChange: true
                        })
                    }
                    var bankAcc = recEmp.getValue('custentity_abj_bank_account_name');
                    if(bankAcc){
                        recNew.setValue({
                            fieldId : 'custbody_check_bank_acc_name',
                            value : bankAcc,
                            ignoreFieldChange: true
                        })
                    }
                    var accName = recEmp.getValue('custentity_abj_account_name');
                    if(accName){
                        recNew.setValue({
                            fieldId : 'custbody_check_account_name',
                            value : accName,
                            ignoreFieldChange: true
                        })
                    }
                    var saveRec = recNew.save({
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