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
        function beforeLoad(context) {
            try {
                if (context.type == context.UserEventType.VIEW) {
                   
                    var rec = context.newRecord;
                    var recNew = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: true
                    })
                   
                    var lastPurchase = recNew.getValue('lastpurchaseprice');
                    log.debug('lastPurchase', lastPurchase)
                    if(lastPurchase){
                        recNew.setValue({
                            fieldId: 'custitem_ajb_pph_last_purchase',
                            value: lastPurchase,
                            ignoreFieldChange: true
                        })
                    }
                    
                    var saveRec = recNew.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRec', saveRec)
                }
            } catch (e) {
                log.debug('error', e)
            }
        }
        return {
            beforeLoad: beforeLoad,
        };
});