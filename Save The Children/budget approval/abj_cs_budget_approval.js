/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search'], function(currentRecord, dialog, log, search) {
    let currentMode = '';

    function pageInit(context) {
        currentMode = context.mode;
    }

    function validateLine(context){
        var currentRec = currentRecord.get();
        var itemId = currentRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item'
        }) || 0;
        console.log('itemId', itemId)
        if (itemId) {
            var itemSearchObj = search.create({
                type: "item",
                filters: [
                    ["internalid", "anyof", itemId]
                ],
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

            console.log("itemSearchObj result count", results.length);
            var account
            results.forEach(function (result) {
                var itemName = result.getValue({ name: "itemid" });
                var displayName = result.getValue({ name: "displayname" });
                var type = result.getValue({ name: "type" });
                var basePrice = result.getValue({ name: "baseprice" });
                var assetAccount = result.getValue({ name: "assetaccount" });
                var expenseAccount = result.getValue({ name: "expenseaccount" });

                console.log("Item Info", {
                    itemName: itemName,
                    displayName: displayName,
                    type: type,
                    basePrice: basePrice,
                    assetAccount: assetAccount,
                    expenseAccount: expenseAccount
                });
                if(type == 'InvtPart'){
                    account = assetAccount
                }else{
                    account = expenseAccount
                }
            });

        }
        var sofId = currentRec.getCurrentSublistValue({
            sublistId : "item",
            fieldId : "cseg_stc_sof"
        });
        var grossamt = currentRec.getCurrentSublistValue({
            sublistId : "item",
            fieldId : "grossamt"
        });
        console.log('parameterSearch', {itemId : itemId, account : account, sofId : sofId, grossamt : grossamt})
        console.log('cekCurrentMode', currentMode)
    }
    return{
        validateLine : validateLine,
        pageInit : pageInit
    }
})