/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try{
                var rec = context.newRecord;
                var recLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var cForm = recLoad.getValue('customform');
                if(cForm == '138'){
                    var lineCount = recLoad.getLineCount({
                        sublistId: 'item'
                    });
                    if(lineCount > 0){
                        for (var i = 0; i < lineCount; i++) {
                            var onHand = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol_abj_onhand',
                                line : i
                            }) || 0;
                            log.debug('onHand', onHand)
                            var incomingStock = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol5',
                                line : i
                            }) || 0;
                            log.debug('incomingStock', incomingStock)
                            var osPo = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol6',
                                line : i
                            }) || 0;
                            log.debug('osPo', osPo)
                            var forecash = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol9',
                                line : i
                            }) || 0;
                            log.debug('forecash', forecash)
                            var qtyToset = (Number(onHand) + Number(incomingStock)) - (Number(osPo) + Number(forecash))
                            log.debug('qtyToset', qtyToset)
                            if(qtyToset){
                                log.debug('masuk qty to set')
                                recLoad.selectLine({
                                    sublistId : "item",
                                    line : i
                                })
                                recLoad.setCurrentSublistValue({
                                    sublistId : "item",
                                    fieldId : "quantity",
                                    line : i,
                                    value : Math.abs(qtyToset)
                                })
                                recLoad.commitLine("item")
                            }
                        }
                       var isSave = recLoad.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true,
                        });
                        log.debug('isSave', isSave)
                    }
                  
                }
               
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return{
        afterSubmit: afterSubmit
    }
});