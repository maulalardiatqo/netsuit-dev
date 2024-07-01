/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try{
                var currentRecord = context.newRecord;
                var internalId = currentRecord.id;
                log.debug('internalid', internalId);
                var typeRec = currentRecord.getValue('type');
                log.debug('typeRec', typeRec);
                if(typeRec == 'salesord'){
                    typeRec = 'salesorder'
                }else if(typeRec == 'custinvc'){
                    typeRec = 'invoice'
                }
                var recLoad = record.load({
                    type : typeRec,
                    id : internalId,
                    isDynamic: true,
                })
                var lineCount = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug('lineCount', lineCount);
                var totalDiscount = 0;
                var cekItem = false;
                var taxcode
                if(lineCount > 0){
                    for (var i = 0; i < lineCount; i++) {
                        var itemId = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        })
                        var discountAmount = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_abj_disc_line',
                            line : i
                        })
                        var cekTaxCode = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxcode',
                            line : i
                        })
                        if(cekTaxCode){
                            taxcode = cekTaxCode
                        }
                        if(itemId == '2880'){
                            cekItem = true
                            log.debug('cekItem', cekItem);
                        }
                        if(discountAmount){
                            var amountDisc = Number(discountAmount);
                            totalDiscount += amountDisc
                        }
                    }
                }
                
                if(totalDiscount != 0){
                    var totalDiscountMin = -1 * Number(totalDiscount);
                    log.debug('totalDisc > 0')
                    if(cekItem == true){
                        cekLine = recLoad.getLineCount({
                            sublistId : "item"
                        })
                        if(lineCount > 0){
                            for(var i = 0; i < cekLine; i++){
                                var itemId = recLoad.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "item",
                                    line : i
                                });
                                if(itemId == '2880'){
                                    recLoad.selectLine({
                                        sublistId : "item",
                                        line : i
                                    })
                                    recLoad.setCurrentSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'rate',
                                        line : i,
                                        value : totalDiscountMin
                                    })
                                    recLoad.setCurrentSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'taxcode',
                                        line : i,
                                        value : taxcode
                                    })
                                    // recLoad.setCurrentSublistValue({
                                    //     sublistId : "item",
                                    //     fieldId : "amount",
                                    //     line : i,
                                    //     value : totalDiscountMin
                                    // })
                                    recLoad.commitLine("item")
                                }
                            }
                        }
                    }else{
                        
                        recLoad.selectNewLine({
                            sublistId: 'item'
                        });
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            value : 2880
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'price',
                            value : -1
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'rate',
                            value : totalDiscountMin
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxcode',
                            value : taxcode
                        })
                        // recLoad.setCurrentSublistValue({
                        //     sublistId : 'item',
                        //     fieldId : 'amount',
                        //     value : totalDiscountMin
                        // })
                        recLoad.commitLine("item")
                    }
                }
                recLoad.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true,
                });
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }
    return{
        afterSubmit: afterSubmit
    }
});