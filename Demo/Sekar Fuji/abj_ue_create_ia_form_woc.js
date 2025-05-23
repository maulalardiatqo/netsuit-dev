/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log", "N/format","N/query"], function (record, search, log,format, query) {
    function afterSubmit(context) {
        try {
           
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var recId = rec.id;

                var newRec = record.load({
                    type : 'workordercompletion',
                    id : recId,
                    isDynamic : false
                })
                var projectValue = newRec.getValue('total');
                var qtyProject = newRec.getValue('quantity');
                var itemWo = newRec.getValue('item');
                log.debug('dataProject', {projectValue : projectValue, qtyProject : qtyProject});
                if(projectValue && qtyProject && itemWo){
                    var subsidiary = newRec.getValue('subsidiary');
                    var trandate = newRec.getValue('trandate');
                    var account = 53
                    var location = newRec.getValue('location');
                    var invDetail = newRec.getValue('inventorydetail');
                    log.debug('invDetail', invDetail)

                    var linkIa1
                    var linkIa2
                    var cekLineCoProd = newRec.getLineCount({sublistId : 'recmachcustrecord202'});
                    if(cekLineCoProd > 0){
                        for(var i = 0; i < cekLineCoProd; i++){
                            var inv1 = newRec.getSublistValue({ 
                                sublistId: 'recmachcustrecord202', 
                                fieldId: 'custrecord207', 
                                line: i 
                            });
                            if(inv1){
                                linkIa1 = inv1
                            }
                            var inv2 = newRec.getSublistValue({ 
                                sublistId: 'recmachcustrecord202', 
                                fieldId: 'custrecord209', 
                                line: i 
                            });
                            if(inv2){
                                linkIa2 = inv2
                            }

                            
                        }
                    }
                    if(linkIa1){
                        record.delete({
                            type: record.Type.INVENTORY_ADJUSTMENT,
                            id: linkIa1
                        });
                        log.debug('deleted record ia 1')
                    }
                    if(linkIa2){
                        record.delete({
                            type: record.Type.INVENTORY_ADJUSTMENT,
                            id: linkIa2
                        });
                        log.debug('deleted record ia 2')
                    }
                    // create inv_adjust 1
                    const inventoryAdjustment1 = record.create({
                        type: record.Type.INVENTORY_ADJUSTMENT,
                        isDynamic: true
                    });
                    inventoryAdjustment1.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary 
                    });
                    inventoryAdjustment1.setValue({
                        fieldId: 'account',
                        value: account 
                    });
                    inventoryAdjustment1.setValue({
                        fieldId: 'trandate',
                        value: trandate
                    });
                    inventoryAdjustment1.setValue({
                        fieldId: 'adjlocation',
                        value: location
                    });

                    // setLine
                    inventoryAdjustment1.selectNewLine({ sublistId: 'inventory' });
                    inventoryAdjustment1.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'item',
                        value: itemWo
                    });

                    inventoryAdjustment1.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'location',
                        value: location
                    });
                    var negativeQty = qtyProject > 0 ? -qtyProject : qtyProject;
                    inventoryAdjustment1.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'adjustqtyby',
                        value: negativeQty
                    });
                
                    inventoryAdjustment1.setCurrentSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'unitcost',
                        value: projectValue,
                        ignoreFieldChange: true
                    });
                    var subrecord = inventoryAdjustment1.getCurrentSublistSubrecord({
                        sublistId: 'inventory',
                        fieldId: 'inventorydetail'
                    });

                    if (invDetail) {
                        var invRec = record.load({
                            type : 'inventorydetail',
                            id : invDetail,
                        });

                        var invAssignments = invRec.getLineCount({ sublistId: 'inventoryassignment' });

                        for (var i = 0; i < invAssignments; i++) {
                            var qty = invRec.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                line: i
                            });

                            var binNumber = invRec.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'binnumber',
                                line: i
                            });

                            var inventoryStatus = invRec.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                line: i
                            });

                            var issueInventoryNumber = invRec.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'receiptinventorynumber',
                                line: i
                            });

                            var expirationDate = invRec.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'expirationdate',
                                line: i
                            });

                            subrecord.selectNewLine({ sublistId: 'inventoryassignment' });
                            log.debug('issueInventoryNumber', issueInventoryNumber)
                            log.debug('binNumber', binNumber);
                            log.debug('qty', qty)
                            if (issueInventoryNumber)
                                subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: issueInventoryNumber });
                            if (binNumber)
                                subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });

                            if (inventoryStatus)
                                subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: inventoryStatus });

                            

                            if (expirationDate)
                                subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'expirationdate', value: expirationDate });
                            var qtyNeg = qty > 0 ? -qty : qty;
                            subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: qtyNeg });

                            subrecord.commitLine({ sublistId: 'inventoryassignment' });
                        }
                    }
                    inventoryAdjustment1.commitLine({ sublistId: 'inventory' });
                    const inventoryAdjustment1Id = inventoryAdjustment1.save({
                        enableSourcing: false, 
                        ignoreMandatoryFields: true 
                    });
                    log.debug('inventoryAdjustment1Id', inventoryAdjustment1Id)
                    var cekLineCount = newRec.getLineCount({sublistId : 'recmachcustrecord202'});
                    log.debug('cekLineCount', cekLineCount);

                    var allData2 = []
                    if(cekLineCount > 0){
                        for(var i = 0; i < cekLineCount; i++){
                            var coProduct = newRec.getSublistValue({ sublistId: 'recmachcustrecord202', fieldId: 'custrecord203', line: i });
                            var coQty = newRec.getSublistValue({ sublistId: 'recmachcustrecord202', fieldId: 'custrecord204', line: i });
                            var amt1 = ((Number(coQty) / Number(qtyProject)) * Number(projectValue)) / Number(coQty);
                            var amt2 = Number(amt1) * Number(coQty)

                            allData2.push({
                                coProduct : coProduct,
                                coQty : coQty,
                                amt1 : amt1,
                                amt2 : amt2,
                            })
                        }
                    }
                    var pengurangan = Number(projectValue)
                    var totalQty = 0
                    var totalAmt2 = 0
                    allData2.forEach((data)=>{
                        var coQty = data.coQty
                        var amt2 = data.amt2
                        totalQty = Number(totalQty) + Number(coQty)
                        totalAmt2 = Number(totalAmt2) + Number(amt2)
                        pengurangan = Number(pengurangan) - Number(amt2)
                    });
                    log.debug('pengurangan', pengurangan);
                    var amt1Hard = Number(pengurangan) / Number(qtyProject);
                    var amt2Hard = Number(amt1Hard) * Number(qtyProject);
                    log.debug('amt1Hard', amt1Hard);
                    log.debug('amt2Hard', amt2Hard);
                    totalQty = Number(totalQty) + Number(qtyProject);
                    totalAmt2 = Number(totalAmt2) + Number(amt2Hard);
                    log.debug('totalQty', totalQty);
                    log.debug('totalAmt2', totalAmt2)
                    var toGetFixUcost = (Number(totalAmt2) / Number(totalQty)).toFixed(2);
                    log.debug('toGetFixUcost', toGetFixUcost)
                    allData2.push({
                        coProduct : itemWo,
                        coQty : qtyProject,
                        amt1 : amt1Hard,
                        amt2 : amt2Hard,
                    })
                    for (let i = 0; i < allData2.length; i++) {
                        let coQty = allData2[i].coQty;
                        let unitCost = Number(coQty) * Number(toGetFixUcost);
                        allData2[i].unitCost = unitCost;
                    }
                    log.debug('allData2', allData2)
                    // create inv adjust2
                    const inventoryAdjustment2 = record.create({
                        type: record.Type.INVENTORY_ADJUSTMENT,
                        isDynamic: true
                    });
                    inventoryAdjustment2.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary 
                    });
                    inventoryAdjustment2.setValue({
                        fieldId: 'account',
                        value: account 
                    });
                    inventoryAdjustment2.setValue({
                        fieldId: 'trandate',
                        value: trandate
                    });
                    inventoryAdjustment2.setValue({
                        fieldId: 'adjlocation',
                        value: location
                    });
                    allData2.forEach((itemData)=>{
                        var coProduct = itemData.coProduct
                        var coQty = itemData.coQty
                        var amt1 = itemData.amt1
                        var amt2 = itemData.amt2
                        var unitCost = itemData.unitCost
                        inventoryAdjustment2.selectNewLine({ sublistId: 'inventory' });
                        inventoryAdjustment2.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            value: coProduct
                        });

                        inventoryAdjustment2.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'location',
                            value: location
                        });
                        inventoryAdjustment2.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: coQty
                        });

                        inventoryAdjustment2.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'unitcost',
                            value: unitCost
                        });
                        if(coProduct == itemWo){
                            var subrecord = inventoryAdjustment2.getCurrentSublistSubrecord({
                                sublistId: 'inventory',
                                fieldId: 'inventorydetail'
                            });

                            if (invDetail) {
                                var invRec = record.load({
                                    type : 'inventorydetail',
                                    id : invDetail,
                                });

                                var invAssignments = invRec.getLineCount({ sublistId: 'inventoryassignment' });

                                for (var i = 0; i < invAssignments; i++) {
                                    var qty = invRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity',
                                        line: i
                                    });

                                    var binNumber = invRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'binnumber',
                                        line: i
                                    });

                                    var inventoryStatus = invRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'inventorystatus',
                                        line: i
                                    });

                                    var issueInventoryNumber = invRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'receiptinventorynumber',
                                        line: i
                                    });

                                    var expirationDate = invRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'expirationdate',
                                        line: i
                                    });

                                    subrecord.selectNewLine({ sublistId: 'inventoryassignment' });

                                    if (issueInventoryNumber)
                                        subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: issueInventoryNumber });

                                    if (binNumber)
                                        subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });

                                    if (inventoryStatus)
                                        subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: inventoryStatus });

                                    

                                    if (expirationDate)
                                        subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'expirationdate', value: expirationDate });

                                    subrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: qty });

                                    subrecord.commitLine({ sublistId: 'inventoryassignment' });
                                }
                            }
                        }
                        inventoryAdjustment2.commitLine({ sublistId: 'inventory' });
                    });
                     const inventoryAdjustment1Id2 = inventoryAdjustment2.save({
                        enableSourcing: false, 
                        ignoreMandatoryFields: true 
                    });
                    log.debug('inventoryAdjustment1Id2', inventoryAdjustment1Id2)
                    if(inventoryAdjustment1Id2){
                        var cekLineCount = newRec.getLineCount({sublistId : 'recmachcustrecord202'});
                        if(cekLineCount > 0){
                            for(var i = 0; i < cekLineCount; i++){
                                newRec.setSublistValue({
                                        sublistId: 'recmachcustrecord202',
                                        fieldId: 'custrecord205',
                                        line: i,
                                        value: toGetFixUcost
                                });
                                newRec.setSublistValue({
                                        sublistId: 'recmachcustrecord202',
                                        fieldId: 'custrecord207',
                                        line: i,
                                        value: inventoryAdjustment1Id2
                                });
                                if(inventoryAdjustment1Id){
                                    newRec.setSublistValue({
                                        sublistId: 'recmachcustrecord202',
                                        fieldId: 'custrecord209',
                                        line: i,
                                        value: inventoryAdjustment1Id
                                });
                                }

                                
                            }
                        }
                    }
                    newRec.save();
                }
              
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});