/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget',"N/search"], (serverWidget, search) => {

    const searchAccount = (itemId) => {
        var account
        var itemSearchObj = search.create({
            type: "item",
            filters: [["internalid", "anyof", itemId]],
            columns: [
                search.createColumn({ name: "itemid", label: "Name" }),
                search.createColumn({ name: "displayname", label: "Display Name" }),
                search.createColumn({ name: "type", label: "Type" }),
                search.createColumn({ name: "baseprice", label: "Base Price" }),
                search.createColumn({ name: "assetaccount", label: "Asset Account" }),
                search.createColumn({ name: "expenseaccount", label: "Expense/COGS Account" })
            ]
        });
        var results = itemSearchObj.run().getRange({ start: 0, end: 1000 });

        log.debug("itemSearchObj result count", results.length);

        results.forEach(function (result) {
            var type = result.getValue({ name: "type" });
            var assetAccount = result.getValue({ name: "assetaccount" });
            var expenseAccount = result.getValue({ name: "expenseaccount" });

            if (type == 'InvtPart') {
                account = assetAccount;
            } else {
                account = expenseAccount;
            }
        });
        return account
    };

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            let itemId = context.request.parameters.custscript_item_id;
            log.debug('SOF  ID', itemId);
            let account = searchAccount(itemId);
            log.debug('account', account)

            context.response.write(account ? account : 'no_data');
        } else {
            context.response.write('POST request received');
        }
    };

    return { onRequest };
});
