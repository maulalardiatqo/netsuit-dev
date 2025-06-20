/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.CREATE) return;

        try {
            let rec = record.load({
                type: context.newRecord.type,
                id: context.newRecord.id,
                isDynamic: true
            });

            const lineCount = rec.getLineCount({ sublistId: 'item' });
            const itemIds = [];

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

            const itemCostMap = {}; 
            log.debug('itemIds', itemIds)
            if (itemIds.length > 0) {
                const itemSearchObj = search.create({
                    type: "item",
                    filters: [
                        ["internalid", "anyof", itemIds]
                    ],
                    columns: [
                        "internalid",
                        "averagecost"
                    ]
                });

                itemSearchObj.run().each(function (result) {
                    const id = result.getValue({ name: 'internalid' });
                    const avgCost = result.getValue({ name: 'averagecost' });
                    itemCostMap[id] = avgCost;
                    return true;
                });
            }
            log.debug('itemCostMap', itemCostMap)
            for (let i = 0; i < lineCount; i++) {
                rec.selectLine({ sublistId: 'item', line: i });

                const unitCostOverride = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitcostoverride'
                });

                const itemId = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                if ((unitCostOverride === '' || unitCostOverride === null) && itemId && itemCostMap[itemId] !== null && itemCostMap[itemId] !== '') {
                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'unitcostoverride',
                        value: Number(itemCostMap[itemId])
                    });
                }

                rec.commitLine({ sublistId: 'item' });
            }

            rec.save({ ignoreMandatoryFields: true });

        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }

    return { afterSubmit };

});
