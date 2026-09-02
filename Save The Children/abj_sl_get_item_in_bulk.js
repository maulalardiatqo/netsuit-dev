/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/search"], (search) => {

    const searchAccountsBulk = (itemIds) => {
        var accountMap = {};
        
        if (!itemIds || itemIds.length === 0) return accountMap;

        var itemSearchObj = search.create({
            type: "item",
            filters: [["internalid", "anyof", itemIds]], 
            columns: [
                search.createColumn({ name: "type" }),
                search.createColumn({ name: "assetaccount" }),
                search.createColumn({ name: "expenseaccount" })
            ]
        });

        var results = itemSearchObj.run().getRange({ start: 0, end: 1000 });
        log.debug("Bulk itemSearchObj result count", results.length);

        results.forEach(function (result) {
            var itemId = result.id;
            var type = result.getValue({ name: "type" });
            var assetAccount = result.getValue({ name: "assetaccount" });
            var expenseAccount = result.getValue({ name: "expenseaccount" });
            var account;

            if (type === 'InvtPart') {
                account = assetAccount;
            } else {
                account = expenseAccount;
            }

            accountMap[itemId] = account || '';
        });

        return accountMap;
    };

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            let itemIdsParam = context.request.parameters.custscript_item_ids;
            log.debug('Received Item IDs Raw', itemIdsParam);
            
            var responseData = {};

            if (itemIdsParam) {
                try {
                    var itemIds = JSON.parse(itemIdsParam); 
                    
                    if (Array.isArray(itemIds) && itemIds.length > 0) {
                        responseData = searchAccountsBulk(itemIds);
                    }
                } catch (e) {
                    log.error('Error parsing item IDs JSON', e);
                }
            }

            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            context.response.write(JSON.stringify(responseData));

        } else {
            context.response.write('POST request received');
        }
    };

    return { onRequest };
});