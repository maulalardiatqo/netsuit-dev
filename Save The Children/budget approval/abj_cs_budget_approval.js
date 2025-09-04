/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search'], function(currentRecord, dialog, log, search) {
    let currentMode = '';

    function pageInit(context) {
        currentMode = context.mode;
    }
    function getBudgetHolderApproval(paramSof, paramAccount, paramAmount) {
        function runSearch(useAccount) {
            var filters = [];
            filters.push(["custrecord_stc_sof", "is", paramSof]);

            if (useAccount && paramAccount) {
                filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);
            }

            filters.push("AND", ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount]);

            var searchObj = search.create({
                type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                filters: filters,
                columns: [
                    search.createColumn({ name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC }),
                    search.createColumn({ name: "custrecord_stc_bdgt_hldr_approval" })
                ]
            });

            var result = searchObj.run().getRange({ start: 0, end: 1 });
            if (result && result.length > 0) {
                return result[0].getValue("custrecord_stc_bdgt_hldr_approval");
            }
            return null;
        }

        // 1️⃣ coba dulu dengan Account (kalau ada)
        var approval = runSearch(true);

        // 2️⃣ kalau null → ulangi tanpa Account
        if (!approval) {
            approval = runSearch(false);
        }

        return approval;
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
        if(sofId){
            var cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
            console.log('cekEmp', cekEmp)
            if(cekEmp){
                currentRec.setCurrentSublistValue({
                    sublistId : "item",
                    fieldId : "custcol_stc_approver_linetrx",
                    value : cekEmp
                })
            }
            if(currentMode == "create"){
                currentRec.setCurrentSublistValue({
                    sublistId : "item",
                    fieldId : "custcol_stc_approval_status_line",
                    value : "1"
                })
            }
        }
        
        return true
    }
    return{
        validateLine : validateLine,
        pageInit : pageInit
    }
})