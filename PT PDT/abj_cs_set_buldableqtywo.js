/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/log'], (search, log) => {

    const fieldChanged = (scriptContext) => {
        const { currentRecord, fieldId } = scriptContext;

        if (fieldId !== 'billofmaterialsrevision') {
            return;
        }

        const bomRevId = currentRecord.getValue({ fieldId: 'billofmaterialsrevision' });
        
        if (!bomRevId) {
            currentRecord.setValue({
                fieldId: 'custbody_abj_pdt_buildable_qty',
                value: '',
                ignoreFieldChange: true
            });
            return;
        }

        const bomrevisionSearchObj = search.create({
            type: "bomrevision",
            filters: [
                ["internalid", "anyof", bomRevId]
            ],
            columns: [
                search.createColumn({ name: "item", join: "component" }),
                search.createColumn({ name: "quantity", join: "component" })
            ]
        });

        const bomData = {};
        bomrevisionSearchObj.run().each((result) => {
            const item = result.getValue({ name: "item", join: "component" });
            const quantity = parseFloat(result.getValue({ name: "quantity", join: "component" })) || 0;
            
            if (item && quantity > 0) {
                bomData[item] = quantity;
            }
            return true;
        });

        if (Object.keys(bomData).length === 0) {
            return;
        }

        const lineCount = currentRecord.getLineCount({ sublistId: 'item' });
        let minQty = Infinity;
        let hasMatchedItem = false;

        for (let i = 0; i < lineCount; i++) {
            const sublistItem = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            const qtyOnHand = parseFloat(currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantityonhand', line: i })) || 0;

            if (bomData[sublistItem]) {
                const bomQty = bomData[sublistItem];
                const calculatedQty = Math.floor(qtyOnHand / bomQty); 
                log.debug('calculatedQty', calculatedQty);

                if (calculatedQty < minQty) {
                    minQty = calculatedQty;
                }
                hasMatchedItem = true;
            }
        }

        log.debug('hasMatchedItem', hasMatchedItem);

        if (hasMatchedItem) {
            currentRecord.setValue({
                fieldId: 'custbody_abj_pdt_buildable_qty',
                value: minQty,
                ignoreFieldChange: true
            });
        }
    };

    return { fieldChanged };
});