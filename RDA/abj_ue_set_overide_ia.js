/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/log', 'N/error', 'N/record'], (search, log, error, record) => {

    const beforeSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                const rec = context.newRecord;
                
                const lineCount = rec.getLineCount({ sublistId: 'inventory' });
                const itemIds = [];

                for (let i = 0; i < lineCount; i++) {
                    const itemId = rec.getSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'item',
                        line: i
                    });
                    if (itemId && !itemIds.includes(itemId)) {
                        itemIds.push(itemId);
                    }
                }

                if (itemIds.length === 0) return;
                    const itemCostMap = {};
                    const itemTypeMap = {};
                    const itemSearchObj = search.create({
                        type: "item",
                        filters: [["internalid", "anyof", itemIds]],
                        columns: [
                            search.createColumn({ name: "averagecost" }),
                            search.createColumn({ name: "type" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({name: "cost"}),
                            search.createColumn({name: "custitem_rda_conversnum_largest"})
                        ]
                    });

                    itemSearchObj.run().each(function (result) {
                        const id = result.getValue({ name: "internalid" });
                        let avgCost = 0
                        var cekavg = result.getValue({ name: "averagecost" });
                        if(cekavg != null && cekavg != "" && cekavg != 0){
                            avgCost = cekavg;
                        }else{
                            var cekCost = result.getValue({ name: "cost" });
                            if(cekCost != null && cekCost != "" && cekCost != 0){
                                var convLargest = result.getValue({name : "custitem_rda_conversnum_largest"});
                                avgCost = Number(cekCost) / Number(convLargest);
                            }
                        }
                        const itemType = result.getValue({ name: "type" });
                        itemCostMap[id] = avgCost;
                        itemTypeMap[id] = itemType;
                        return true;
                    });
                    log.debug('itemCostMap', itemCostMap);
                    const errorLines = [];
                    for (let i = 0; i < lineCount; i++) {
                        const itemId = rec.getSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            line: i
                        });
                        if (!itemId) continue;

                        const itemType = itemTypeMap[itemId];
                        if (itemType !== 'InvtPart') continue; 

                        const unitCostOverride = rec.getSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'unitcost',
                            line: i
                        });
                        
                        if ((unitCostOverride === '' || unitCostOverride === null || unitCostOverride == 0) &&
                            itemCostMap[itemId] !== null && itemCostMap[itemId] !== '') {
                                log.debug('unitCostOverride in line exist', unitCostOverride)
                                log.debug('itemCostMap[itemId]', itemCostMap[itemId])
                                rec.setSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'unitcost',
                                    line: i,
                                    value: Number(itemCostMap[itemId]),
                                    ignoreFieldChange : true
                                });
                        }

                        const finalUnitCost = rec.getSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'unitcost',
                            line: i
                        });
                        log.debug('finalUnitCost', finalUnitCost)
                        if (finalUnitCost === '' || finalUnitCost === null || Number(finalUnitCost) === 0) {
                            errorLines.push(i + 1);
                        }
                    }
                    if (errorLines.length > 0) {
                        var message = 'Peringatan! Line ' + errorLines.join(', ') + ' memiliki Unit Cost Override kosong atau 0. ' +
                                    'Silakan isi nilai Unit Cost atau perbaiki Average Cost pada master item.';
                        throw message;
                    }
            } catch (e) {
                log.error('Error in beforeSubmit', e);
                throw e;
            }
        }
    };

    return { beforeSubmit};

});
