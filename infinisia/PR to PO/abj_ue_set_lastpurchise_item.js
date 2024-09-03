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
                    log.debug('trigerred')
                    var rec = context.newRecord;
                    var dataRec = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    });
                    var lPurchise = dataRec.getValue('lastpurchaseprice');
                    log.debug('lPurchise', lPurchise)
                    if(lPurchise){
                        log.debug('masuk kondisi')
                        dataRec.setValue({
                            fieldId: "custitem_abj_last_purchase_price",
                            value: lPurchise,
                            ignoreFieldChange: true,
                        })
                    }
                    var saveItem = dataRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveItem', saveItem)

                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return {
            afterSubmit: afterSubmit,
        };
});