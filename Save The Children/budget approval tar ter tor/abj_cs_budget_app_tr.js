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
            filters.push("AND", ["isinactive", "is", "F"]);

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
        var approval = runSearch(true);
        if (!approval) {
            approval = runSearch(false);
        }

        return approval;
    }
    function getFinanceMatric(sofId){
        var approvalFinance
        var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: [
                ["custrecord_stc_sof_mtrx_finance", "anyof", sofId]
            ],
            columns: [
                search.createColumn({ name: "custrecord_stc_apprvl_finance", label: "Approval Finance" })
            ]
        });

        var results = customrecord_stc_apprvl_mtrix_financeSearchObj.run().getRange({
            start: 0,
            end: 1
        });

        if (results.length > 0) {
            approvalFinance = results[0].getValue("custrecord_stc_apprvl_finance");
        }
        return approvalFinance
    }
    function validateLine(context) {
    var currentRec = currentRecord.get();
        var typeRec = currentRec.type;
        console.log('typeRec', typeRec)
        var sublistExpens
        if(typeRec == 'customrecord_tar'){
            sublistExpens = 'recmachcustrecord_tar_e_id'
        }
        // ==== KONDISI SUBLIST ITEM ====
        if (context.sublistId === 'item') {
            var cekType = currentRec.getValue('type');
            console.log('cekType', cekType)
            var itemId = currentRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            }) || 0;
            console.log('itemId', itemId)

            var account;
            if (itemId) {
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

                console.log("itemSearchObj result count", results.length);

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
            }

            var sofId = currentRec.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "cseg_stc_sof"
            });
            var grossamt = currentRec.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "grossamt"
            });
            if(cekType == 'cutrprch108' || cekType == 'purchreq'){
                var grossamt = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount"
                });
            }
            

            console.log('parameterSearch', { itemId: itemId, account: account, sofId: sofId, grossamt: grossamt })
            console.log('cekCurrentMode', currentMode)

            if (sofId) {
                var cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
                if(cekType == 'vendbill' || cekType == 'purchreq'){
                    var emp = getFinanceMatric(sofId)
                    if(emp){
                        currentRec.setCurrentSublistValue({
                            sublistId : "item",
                            fieldId : "custcol_stc_approver_fa",
                            value : emp
                        })
                        currentRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_stc_apprvl_sts_fa",
                            value: "1"
                        })
                    }
                }
                console.log('cekEmp', cekEmp)
                if (cekEmp) {
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_stc_approver_linetrx",
                        value: cekEmp
                    })
                }
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_stc_approval_status_line",
                    value: "1"
                })
            } else {
                return true
            }
        }

        // ==== KONDISI SUBLIST EXPENSE ====
        
        if (context.sublistId === sublistExpens) {
            var accontField
            var sofField
            var amountField
            var approverField
            var statusField
            if(typeRec == 'customrecord_tar'){
                accontField = 'custrecord_tare_account';
                sofField = 'custrecord_tare_source_of_funding'
                amountField = 'custrecord_tare_amount'
                approverField = 'custrecord_tare_approver'
                statusField = 'custrecord_tare_approval_status'
            }
            var account = currentRec.getCurrentSublistValue({
                sublistId: sublistExpens,
                fieldId: accontField
            });
            var sofId = currentRec.getCurrentSublistValue({
                sublistId: sublistExpens,
                fieldId: sofField
            });
            var grossamt = currentRec.getCurrentSublistValue({
                sublistId: sublistExpens,
                fieldId: amountField
            });

            console.log('parameterSearch (expense)', { account: account, sofId: sofId, grossamt: grossamt })
            console.log('cekCurrentMode', currentMode)

            if (sofId) {
                var cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
                console.log('cekEmp (expense)', cekEmp)
                
                if(cekType == 'vendbill' || cekType == 'exprept' || cekType == 'purchreq'){
                    var emp = getFinanceMatric(sofId)
                    if(emp){
                        currentRec.setCurrentSublistValue({
                            sublistId : "expense",
                            fieldId : "custcol_stc_approver_fa",
                            value : emp
                        })
                        currentRec.setCurrentSublistValue({
                            sublistId: "expense",
                            fieldId: "custcol_stc_apprvl_sts_fa",
                            value: "1"
                        })
                    }
                }
                if (cekEmp) {
                    currentRec.setCurrentSublistValue({
                        sublistId: sublistExpens,
                        fieldId: approverField,
                        value: cekEmp
                    })
                }
                currentRec.setCurrentSublistValue({
                    sublistId: sublistExpens,
                    fieldId: statusField,
                    value: "1"
                })
            } else {
                return true
            }
        }

        return true;
    }

    return{
        validateLine : validateLine,
        pageInit : pageInit
    }
})