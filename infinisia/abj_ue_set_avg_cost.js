/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function afterSubmit(context){
        try {
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var ifId = rec.getValue('custbody3');
                log.debug('ifId', ifId)
                var idInv = rec.getValue('id');
                log.debug('idInv', idInv)
                if(ifId){
                    log.debug('masuk ifid')
                    var recIf = record.load({
                        type: "itemfulfillment",
                        id: ifId,
                        isDynamic: true,
                    });
                    recIf.setValue({
                        fieldId: "custbody_abj_invoice_number",
                        value: idInv,
                        ignoreFieldChange: true,
                    });
                    var saveIr = recIf.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveIr', saveIr)
            
                }
                
            }
        }catch(e){
            log.debug('error in aftersubmit', e)
        }
    }

    return {
        afterSubmit : afterSubmit
    };
});
