/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {

    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.CREATE) { 
                var request = context.request;
                
                if (request && request.parameters) {
                    var itemship = request.parameters.itemship;
                    log.debug('itemship', itemship)

                    if (itemship) {
                        var recIf = record.load({
                            type: 'itemfulfillment',
                            id: itemship,
                            isDynamic: true
                        })
                        var dateIf = recIf.getValue('trandate')
                        var newRecord = context.newRecord;
                        var soId = recIf.getValue('createdfrom');
                        log.debug('soId', soId)
                        newRecord.setValue({
                            fieldId: 'custbody3',
                            value: itemship
                        });
                        if(dateIf){
                            newRecord.setValue({
                                fieldId: 'trandate',
                                value: dateIf
                            });
                        }

                        log.debug('Itemship value set', 'Value: ' + itemship);
                    } else {
                        log.debug('Itemship not found in URL');
                    }
                }
            }
        } catch (error) {
            log.error('Error in beforeLoad', error);
        }
    }
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
        beforeLoad: beforeLoad,
        afterSubmit : afterSubmit
    };
});
