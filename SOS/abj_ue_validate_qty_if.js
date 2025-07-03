/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], (record, search) => {

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        const newRec = context.newRecord;
        const lineCount = newRec.getLineCount({ sublistId: 'item' });

        for (let i = 0; i < lineCount; i++) {
            const itemId = newRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            const quantity = newRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });

            const locationId = newRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                line: i
            });

            if (!itemId || !locationId || !quantity) {
                continue; // skip line incomplete data
            }

            // Cari total available berdasarkan item & lokasi
            const inventorySearch = search.create({
                type: 'inventorybalance',
                filters: [
                    ['available', 'greaterthan', '0'],
                    'AND',
                    ['item', 'anyof', itemId],
                    'AND',
                    ['location', 'anyof', locationId]
                ],
                columns: [
                    search.createColumn({ name: 'available' })
                ]
            });

            let totalAvailable = 0;

            inventorySearch.run().each(result => {
                const availableQty = parseFloat(result.getValue('available')) || 0;
                totalAvailable += availableQty;
                return true;
            });

            if (quantity > totalAvailable) {
                let message = `Quantity on line ${i + 1} (${quantity}) exceeds available stock (${totalAvailable}). Please adjust the quantity.`;
                throw message;
            }
        }
    }

    return {
        beforeSubmit
    };

});
