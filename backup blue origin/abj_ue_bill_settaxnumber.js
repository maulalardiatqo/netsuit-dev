/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget", "N/ui/message", "N/record"], function (runtime, log, serverWidget, message, record) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            log.debug('masuk create');
            var tranPrefixField = context.form.getField({
                id: 'custbody_fcn_vb_npwp_penandatangan'
            });
            tranPrefixField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
        }
    }

function beforeSubmit(context) {
    var currentRecord = context.newRecord;
    var customForm = currentRecord.getValue({
        fieldId: 'customform'
    });
    log.debug('customForm', customForm)
    if(customForm == '134' || customForm == '135'){
        try{
            var subsidiriId = currentRecord.getValue({
                fieldId: 'subsidiary'
                }); 
                
                if(subsidiriId){
                    var recSubsidiary = record.load({
                        type: 'subsidiary',
                        id: subsidiriId
                    });
    
                    var taxSubsidiary = recSubsidiary.getValue('custrecord_fcn_npwppgrs');
                    log.debug('taxSUbsidiary', taxSubsidiary);
    
                    if(taxSubsidiary){
                        currentRecord.setValue({
                            fieldId: "custbody_fcn_vb_npwp_penandatangan",
                            value: taxSubsidiary,
                            ignoreFieldChange: true,
                        });
                    }
                }
        }catch(e){
            log.debug('error', e)
        }
        
    }
    
}

return {
    beforeLoad : beforeLoad,
    beforeSubmit: beforeSubmit
};
});
  