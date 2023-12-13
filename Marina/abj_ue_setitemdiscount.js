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
                var taxCode
                var taxRate
                var totalAmt = 0;
                if(lineCount > 0){
                    for (var i = 0; i < lineCount; i++) {
                        var itemId = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        })
                        
                        var discountProsent = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_msa_discount_persen',
                            line : i
                        });
                        var discountAmount = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_msa_discount_amount',
                            line : i
                        })
                        var Amount = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'amount',
                            line : i
                        });
                        if(itemId == '149'){
                            cekItem = true
                            log.debug('cekItem', cekItem);
                        }else{
                            log.debug('amount', Amount)
                            totalAmt += Amount
                            log.debug('totalAmt', totalAmt);
                        }
                        
                        taxCode = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxcode',
                            line : i
                        });
                        taxRate = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxrate1',
                            line : i
                        });
                        if(discountProsent && discountAmount == ''){
                            log.debug('discount hanya prosent')
                            log.debug('discountProsent', discountProsent);
                            var amountDisc = Number(discountProsent) / 100 * Number(Amount)
                            totalDiscount += amountDisc
                        }
                        if(discountAmount && discountProsent == ''){
                            var amountDisc = Number(discountAmount);
                            totalDiscount += amountDisc
                        }
                        if(discountAmount && discountProsent){
                            log.debug('ada dua duanya');
                            var discountPriority = currentRecord.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol_msa_discount_priority',
                                line : i
                            });
                            
                            log.debug('discountPriority', discountPriority);
                            var currAmount = Amount
                            if(discountPriority){
                                var amountDisc = Number(discountProsent) / 100 * Number(Amount);
                                totalDiscount += amountDisc
                                var amountDisc2 = Number(discountAmount);
                                totalDiscount += amountDisc2
                                
                            }else{
                                currAmount = Number(Amount) - Number(discountAmount);
                                var amountDisc = Number(discountAmount);
                                totalDiscount += amountDisc
                                var amountDisc2 = Number(discountProsent) / 100 * Number(currAmount)
                                totalDiscount += amountDisc2
                            }
                        }
                    }
                }
                var cekPriority = recLoad.getValue("custbody_abj_disc_order_percent_priori");
                var currAmt = 0

                currAmt = Number(totalAmt) - Number(totalDiscount)
                
                log.debug('currAmt', currAmt);
                var totalOrderDisc = 0;
                
                var amtDisc = recLoad.getValue("custbody_abj_disc_order_amount");
                log.debug('amtDisc', amtDisc);
                var percDisc = recLoad.getValue("custbody_abj_disc_order_percentage");
                if(amtDisc && percDisc == ''){
                    totalOrderDisc = amtDisc
                }
                if(percDisc && amtDisc == ''){
                    totalOrderDisc = Number(percDisc) / 100 * Number(currAmt)
                }
                if(amtDisc && percDisc ){
                    if(cekPriority == false){
                        totalOrderDisc += amtDisc
                        log.debug('totalOrderDisc', totalOrderDisc)
                        currAmt = Number(currAmt) - Number(totalOrderDisc)
                        log.debug('crrAmt2', currAmt);
                        log.debug('percDisc',percDisc);
                        var discforCount = Number(percDisc) / 100 * Number(currAmt)
                        totalOrderDisc += discforCount
                        log.debug('totalOrderDiscafterPorcent', totalOrderDisc)
                    }else{
                        totalOrderDisc += Number(percDisc) / 100 * Number(currAmt)
                        currAmt = Number(currAmt) - Number(totalOrderDisc)
                        totalOrderDisc += amtDisc
                    }
                }
                log.debug('totalOrderDisc', totalOrderDisc);
                totalDiscount = totalDiscount + totalOrderDisc
                
                if(totalDiscount != 0){
                    var countTaxBef = (Number(taxRate) / 100 * Number(totalDiscount));
                    var countTax = -1 * (Number(taxRate) / 100 * Number(totalDiscount))
                    var taxAmount = -1 * (Number(totalDiscount) + Number(countTaxBef));
                    var totalDiscountMin = -1 * Number(totalDiscount);
                    log.debug('taxAmount', taxAmount);
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
                                if(itemId == '149'){
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
                                        sublistId : "item",
                                        fieldId : "amount",
                                        line : i,
                                        value : totalDiscountMin
                                    })
                                    recLoad.setCurrentSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'grossamt',
                                        line : i,
                                        value : taxAmount
                                    })
                                    recLoad.setCurrentSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'tax1amt',
                                        line : i,
                                        value : countTax
                                    });
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
                            value : 149
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
                            fieldId : 'amount',
                            value : totalDiscountMin
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxcode',
                            value : taxCode
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxrate1',
                            value : taxRate
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'grossamt',
                            value : taxAmount
                        })
                        recLoad.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'tax1amt',
                            value : countTax
                        });
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