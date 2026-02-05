/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search', 'N/error', 'N/log'], (search, error, log) => {

    /**
     * GET method to fetch updated inventory item quantities since a given date.
     * This RESTlet identifies items affected by recent inventory transactions and returns their current quantities per location.
     * 
     * @param {Object} context - The request context containing query parameters.
     * @returns {Object} JSON response with updated items and their quantities.
     */
    const get = (context) => {
        const since = context.since;
        if (!since) {
            throw error.create({
                name: 'MISSING_PARAM',
                message: 'The "since" date parameter is required (format: YYYY-MM-DD).'
            });
        }

        try {
            const transFilters = [
                search.createFilter({ name: 'type', operator: 'anyof', values: ['InvAdjst', 'ItemRcpt', 'ItemShip', 'InvTrnfr'] }), 
                search.createFilter({ name: 'trandate', operator: 'after', values: since })
            ];
            const transColumns = [
                search.createColumn({ name: 'item', summary: 'GROUP' })
            ];
            const transSearch = search.create({
                type: 'transaction',
                filters: transFilters,
                columns: transColumns
            });

            const itemIds = [];
            const pagedData = transSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    const itemId = result.getValue({ name: 'item', summary: 'GROUP' });
                    if (itemId) {
                        itemIds.push(itemId);
                    }
                });
            });

            if (itemIds.length === 0) {
                return { updatedItems: [] };
            }

            const itemFilters = [
                search.createFilter({ name: 'internalid', operator: 'anyof', values: itemIds }),
                search.createFilter({ name: 'type', operator: 'anyof', values: ['InvtPart'] })
            ];
            const itemColumns = [
                search.createColumn({ name: 'itemid', label: 'Item Name' }),
                search.createColumn({ name: 'inventorylocation', label: 'Inventory Location ID' }),
                search.createColumn({ name: 'name', join: 'inventorylocation', label: 'Inventory Location Name' }),
                search.createColumn({ name: 'locationquantityonhand', label: 'Location On Hand' }) 
            ];
            const itemSearch = search.create({
                type: 'inventoryitem',
                filters: itemFilters,
                columns: itemColumns
            });
            const updatedItems = {};
            const itemPagedData = itemSearch.runPaged({ pageSize: 1000 });
            itemPagedData.pageRanges.forEach((pageRange) => {
                const page = itemPagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    const itemId = result.id; // Internal ID of the item
                    const itemName = result.getValue('itemid');
                    const locId = result.getValue('inventorylocation');
                    const locName = result.getValue({ name: 'name', join: 'inventorylocation' });
                    const qty = parseFloat(result.getValue('locationquantityonhand')) || 0;

                    if (!updatedItems[itemId]) {
                        updatedItems[itemId] = {
                            id: itemId,
                            name: itemName,
                            locations: []
                        };
                    }
                    if (locId) {
                        updatedItems[itemId].locations.push({
                            locationId: locId,
                            locationName: locName,
                            quantity: qty
                        });
                    }
                });
            });
            return { updatedItems: Object.values(updatedItems) };
        } catch (e) {
            log.error({ title: 'Error in GET Inventory Sync', details: e });
            throw e;
        }
    };
    return { get };
});
