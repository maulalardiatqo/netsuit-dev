/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/log', 'N/error', 'N/record'], (search, log, error, record) => {

    const beforeSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                const rec = context.newRecord;
                const cekCreatedFrom = rec.getText({ fieldId: 'createdfrom' });

                if (cekCreatedFrom && cekCreatedFrom.includes('Return Authorization')) {
                    const lineCount = rec.getLineCount({ sublistId: 'item' });
                    const itemIds = [];

                    // Kumpulkan itemId unik dari Item Receipt
                    for (let i = 0; i < lineCount; i++) {
                        const itemId = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        if (itemId && !itemIds.includes(itemId)) {
                            itemIds.push(itemId);
                        }
                    }

                    if (itemIds.length === 0) return;

                    // Ambil averagecost dan type item lewat search
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
                    log.debug('itemCostMap', itemCostMap)
                    // Load createdfrom id
                    const createdFromId = rec.getValue({ fieldId: 'createdfrom' });
                    if (!createdFromId) return;

                    // Saved search ke Return Authorization detail line
                    const costEstimateMap = {};

                    const returnAuthSearch = search.create({
                        type: "returnauthorization",
                        filters: [
                            ["type", "anyof", "RtnAuth"],
                            "AND",
                            ["internalid", "anyof", createdFromId],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["customgl", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "item" }),
                            search.createColumn({ name: "line" }),
                            search.createColumn({ name: "costestimate" })
                        ]
                    });

                    returnAuthSearch.run().each(function (result) {
                        const itemId = result.getValue({ name: "item" });
                        const lineId = result.getValue({ name: "line" });
                        const costEstimate = result.getValue({ name: "costestimate" });

                        const key = `${itemId}_${lineId}`;
                        costEstimateMap[key] = costEstimate;
                        return true;
                    });

                    log.debug('costEstimateMap', costEstimateMap);

                    const errorLines = [];

                    for (let i = 0; i < lineCount; i++) {
                        const itemId = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        if (!itemId) continue;

                        const itemType = itemTypeMap[itemId];
                        if (itemType !== 'InvtPart') continue; 

                        const orderLine = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline',
                            line: i
                        });
                        const key = `${itemId}_${orderLine}`;
                        log.debug('key', key)
                        const costEstimate = costEstimateMap[key];
                        log.debug('costEstimate', costEstimate)

                        if (costEstimate !== null && costEstimate !== '' && Number(costEstimate) !== 0) continue;

                        const unitCostOverride = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitcostoverride',
                            line: i
                        });
                        log.debug('unitCostOverride in line exist', unitCostOverride)
                        if ((unitCostOverride === '' || unitCostOverride === null || unitCostOverride == 0) &&
                            itemCostMap[itemId] !== null && itemCostMap[itemId] !== '') {
                                log.debug('itemCostMap[itemId]', itemCostMap[itemId])
                                rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'unitcostoverride',
                                    line: i,
                                    value: Number(itemCostMap[itemId])
                                });
                        }

                        const finalUnitCost = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitcostoverride',
                            line: i
                        });

                        if (finalUnitCost === '' || finalUnitCost === null || Number(finalUnitCost) === 0) {
                            errorLines.push(i + 1);
                        }
                    }
                    if (errorLines.length > 0) {
                        var message = 'Peringatan! Line ' + errorLines.join(', ') + ' memiliki Unit Cost Override kosong atau 0. ' +
                                    'Silahkan isi nilai Unit Cost atau perbaiki Average Cost pada master item.';
                        throw message;
                    }
                }

            } catch (e) {
                log.error('Error in beforeSubmit', e);
                throw e;
            }
        }
    };

    return { beforeSubmit };

});
