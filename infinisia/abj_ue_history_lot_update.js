/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record"], function(
    record,
    ) {
        function beforeSubmit(context) {
            try {
                if (context.type == context.UserEventType.EDIT) {
                    var oldData = getOldData(context);
                    log.debug('oldData', oldData);
                    var rec = context.newRecord;
                    var idRec = rec.id
                    var isReturn = rec.getValue('custbody_abj_return_lot');
                    log.debug('isReturn', isReturn)
                    var newData = []
                    if(isReturn == true){
                        var status = rec.getValue('shipstatus');
                        if(status == 'C'){
                            var lineItem = rec.getLineCount({
                                sublistId : 'item'
                            });
                            for(var i = 0; i < lineItem; i++){
                                var itemId = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                })
                                var sublistRecord = rec.getSublistSubrecord({
                                    sublistId: 'item',
                                    fieldId: 'inventorydetail',
                                    line: i
                                });
                                var count = sublistRecord.getLineCount({sublistId: 'inventoryassignment'});
                                for ( var k=0; k < count ; k++){
                                    var lotNumber = sublistRecord.getSublistValue({sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: k});
                                    var qty = sublistRecord.getSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', line: k});
                                    log.debug('lotNumber', lotNumber)
                                    newData.push({
                                        idRec : idRec,
                                        itemId : itemId,
                                        lineItem : i,
                                        lineInv : k,
                                        lotNumber : lotNumber,
                                        qty : qty
                                    });
                                }
                            }
        
                            for (var i = 0; i < oldData.length; i++) {
                                for (var j = 0; j < newData.length; j++) {
                                    if (oldData[i].lineNo === newData[j].lineItem && oldData[i].lineInv === newData[j].lineInv) {
                                        if (oldData[i].lotNumber !== newData[j].lotNumber) {
 
                                            var oldLotNumber = oldData[i].lotNumber;
                                            var newLotNumber = newData[j].lotNumber;
                                            var idRec = newData[j].idRec;
                                            var itemId = newData[j].itemId;
                                            var qty = newData[j].qty; 
                                            
                                            log.debug('dataSet', {oldLotNumber : oldLotNumber, newLotNumber : newLotNumber,idRec : idRec, itemId: itemId, qty : qty });
                                            var createRecord = record.create({
                                                type: 'customrecord_abj_history_lot_return',
                                                isDynamic: true
                                            });
                                            createRecord.setValue({
                                                fieldId: 'custrecord_id_if',
                                                value: idRec, 
                                                ignoreFieldChange: true
                                            });
                                            createRecord.setValue({
                                                fieldId: 'custrecord_abj_returnlot',
                                                value: itemId, 
                                                ignoreFieldChange: true
                                            });
                                            createRecord.setValue({
                                                fieldId: 'custrecord_abj_lotreturn_lot_old',
                                                value: oldLotNumber, 
                                                ignoreFieldChange: true
                                            });
                                            createRecord.setValue({
                                                fieldId: 'custrecord_abj_lotreturn_lot_number_new',
                                                value: newLotNumber, 
                                                ignoreFieldChange: true
                                            });
                                            createRecord.setValue({
                                                fieldId: 'custrecord_abj_lotreturn_qty',
                                                value: qty, 
                                                ignoreFieldChange: true
                                            });
                                            var saveRec = createRecord.save({
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            });
                                            log.debug('saveRec', saveRec)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch(e) {
                log.debug('error', e)
            }
        }

    function getOldData(context) {
        var oldData = []
        var oldRec = context.oldRecord;
        var oldTrans = oldRec
        var lineItem = oldTrans.getLineCount({
            sublistId : 'item'
        });
        for(var i = 0; i < lineItem; i++){
            var sublistRecord = oldTrans.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: i
            });
            var count = sublistRecord.getLineCount({sublistId: 'inventoryassignment'});
            for ( var k=0; k < count ; k++){
                var lotNumber = sublistRecord.getSublistValue({sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: k});
                oldData.push({
                    lineNo : i,
                    lineInv : k,
                    lotNumber : lotNumber
                })
                
            }
        }
        return oldData
    }

    return {
        beforeSubmit: beforeSubmit,
    };
});
