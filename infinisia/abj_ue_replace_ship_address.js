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
                    log.debug('masuk')
                    var rec = context.newRecord;
                    var recNew = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    })
                    if(rec.type == 'itemfulfillment'){
                        var createdFrom = recNew.getValue('createdfrom');
                        log.debug('createdFrom', createdFrom)
                        var shipAddressSO = ''
                        if(createdFrom){
                            try{
                                var recSo = record.load({
                                    type: 'salesorder',
                                    id: createdFrom,
                                    isDynamic: false
                                })
                                shipAddressSO = recSo.getValue('shipaddress');
                            }catch(e){
                                log.debug('error load so', e)
                            }
                            
                        }
                        
                        log.debug('shipAddressSO', shipAddressSO)
                        if(shipAddressSO){
                            recNew.setValue({
                                fieldId : 'shipaddress',
                                value : shipAddressSO
                            })
                        }
                    }else{
                        var createdFrom = recNew.getValue('custbody3');
                        log.debug('createdFrom', createdFrom)
                        var shipAddressSO = ''
                        try{
                            var recIF = record.load({
                                type: 'itemfulfillment',
                                id: createdFrom,
                                isDynamic: false
                            })
                            shipAddressSO = recIF.getValue('shipaddress');
                        }catch(e){
                            log.debug('error load so', e)
                        }
                        log.debug('shipAddressSO', shipAddressSO)
                        if(shipAddressSO){
                            recNew.setValue({
                                fieldId : 'shipaddress',
                                value : shipAddressSO
                            })
                        }
                    }

                    recNew.save();
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return{
            afterSubmit : afterSubmit
        }
    });