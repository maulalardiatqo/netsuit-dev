/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var customForm = recordLoad.getValue("customform");
                if (customForm == 151) {
                    var lineCount = recordLoad.getLineCount({
                        sublistId : "inventory"
                    });
                    log.debug('lineCount', lineCount);
                    
                    if(lineCount > 0){
                        for(var i = 0; i < lineCount; i++){
                            var itemId = recordLoad.getSublistValue({
                                sublistId : "inventory",
                                fieldId : "item",
                                line : i
                            })
                            var noSo = recordLoad.getSublistValue({
                                sublistId : "inventory",
                                fieldId : "custcol_abj_no_so",
                                line : i
                            })
                            var customerId = recordLoad.getSublistValue({
                                sublistId : "inventory",
                                fieldId : "custcol_abj_customer_line",
                                line : i
                            })
                            var salesRepId = recordLoad.getSublistValue({
                                sublistId : "inventory",
                                fieldId : "custcol_abj_salesrep_invadj",
                                line : i
                            });
                            var idInv = recordLoad.getSublistValue({
                                sublistId : "inventory",
                                fieldId : "inventorydetail",
                                line : i
                            })
                            log.debug('dataToSet', {
                                noSo : noSo,
                                customerId : customerId,
                                salesRepId : salesRepId
                            })
                            log.debug('idInv', idInv)
                                if(idInv){
                                    var recInv = record.load({
                                        type: "inventorydetail",
                                        id : idInv
                                    });
                                    log.debug('recInv', recInv);
                                    var lineAssignmentCount = recInv.getLineCount({
                                        sublistId : "inventoryassignment"
                                    });
                                    log.debug('lineAssignmentCount', lineAssignmentCount);
                                    if(lineAssignmentCount > 0){
                                        for(var j = 0; j < lineAssignmentCount; j++){
                                            var numberedId = recInv.getSublistValue({
                                                sublistId : "inventoryassignment",
                                                fieldId : "numberedrecordid",
                                                line : j
                                            })
                                            log.debug('numberedId', numberedId)
                                            if(numberedId){
                                                var recNumbered = record.load({
                                                    type: "inventorynumber",
                                                    id : numberedId,
                                                    isDynamic : true
                                                });
                                                log.debug('salesRepId', salesRepId)
                                                if(salesRepId){
                                                    log.debug('masuk sini')
                                                    recNumbered.setValue({
                                                        fieldId : "custitemnumber1",
                                                        value : salesRepId,
                                                        ignoreFieldChange: true
                                                    })
                                                }
                                                log.debug('customerId', customerId)
                                                if(customerId){
                                                    recNumbered.setValue({
                                                        fieldId : "custitemnumber_lot_customer",
                                                        value : customerId,
                                                        ignoreFieldChange: true
                                                    })
                                                }
                                                log.debug('noSo', noSo)
                                                if(noSo){
                                                    recNumbered.setValue({
                                                        fieldId : "custitemnumber_lot_so_number",
                                                        value : noSo,
                                                        ignoreFieldChange: true
                                                    })
                                                }
                                                var saveRec = recNumbered.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: true,
                                                });
                                                log.debug('saveRec', saveRec)
                                                
                                            }
                                        }
                                    }
                                }
                            
                            
                        }
                      
                    }
                }
            } catch (e) {
                log.debug('error', e)
            }
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});
                