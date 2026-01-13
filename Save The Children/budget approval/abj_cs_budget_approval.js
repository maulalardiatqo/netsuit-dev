/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/url', 'N/https'], function(currentRecord, dialog, log, search, url, https) {
    let currentMode = '';

    function pageInit(context) {
        currentMode = context.mode;
    }
    function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, createdBy) {
    
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

                var results = searchObj.run().getRange({ start: 0, end: 100 }); 
                
                if (results && results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        var approverId = results[i].getValue("custrecord_stc_bdgt_hldr_approval");
                        
                        if (approverId != createdBy) {
                            return approverId;
                        }
                        
                        log.debug('Skip Self Approval', 'Approver ' + approverId + ' is the creator. Skipping to next tier.');
                    }
                }
                
                return null;
            }

        var approval = runSearch(true);
        if (!approval) {
            approval = runSearch(false);
        }

        return approval;
    }
    function getFinanceMatric(sofId, amount, createdBy) {
        
        var approvalFinance = null;
        
        var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: [
                ["custrecord_stc_sof_mtrx_finance", "anyof", sofId],
                "AND", 
                ["custrecord_finance_max_amnt", "greaterthanorequalto", amount]
                , "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_finance_max_amnt",
                    sort: search.Sort.ASC
                }),
                search.createColumn({ name: "custrecord_stc_apprvl_finance", label: "Approval Finance" })
            ]
        });

        var results = customrecord_stc_apprvl_mtrix_financeSearchObj.run().getRange({
            start: 0,
            end: 100 
        });

        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var potentialApprover = results[i].getValue("custrecord_stc_apprvl_finance");
                
                if (potentialApprover != createdBy) {
                    approvalFinance = potentialApprover;
                    break; 
                }
                
            }
        }
        
        return approvalFinance;
    }
    function validateLine(context) {
        var currentRec = currentRecord.get();
        var createdBy = currentRec.getValue('custbody_stc_create_by')
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
                const suiteletUrl = url.resolveScript({
                    scriptId: "customscript_abj_sl_get_item",
                    deploymentId: "customdeploy_abj_sl_get_item",
                    params: {
                        custscript_item_id: itemId,
                    }
                });

                const response = https.get({ url: suiteletUrl });
                account = response.body || ''
                console.log('response', response)
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
                var cekEmp = getBudgetHolderApproval(sofId, account, grossamt, createdBy);
                if(cekType == 'vendbill' || cekType == 'purchreq' || cekType == 'purchord'){
                    var emp = getFinanceMatric(sofId, grossamt, createdBy)
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
        if (context.sublistId === 'expense') {
            var cekType = currentRec.getValue('type');
            console.log('cekType', cekType);
        
            var account = currentRec.getCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'account'
            });
            var sofId = currentRec.getCurrentSublistValue({
                sublistId: "expense",
                fieldId: "cseg_stc_sof"
            });
            var grossamt = currentRec.getCurrentSublistValue({
                sublistId: "expense",
                fieldId: "grossamt"
            });
            if(cekType == 'exprept' || cekType == 'purchreq'){
                account =  currentRec.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'expenseaccount'
                });
                grossamt = currentRec.getCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "amount"
                });
            }

            console.log('parameterSearch (expense)', { account: account, sofId: sofId, grossamt: grossamt })
            console.log('cekCurrentMode', currentMode)

            if (sofId) {
                var cekEmp = getBudgetHolderApproval(sofId, account, grossamt, createdBy);
                console.log('cekEmp (expense)', cekEmp)
                
                if(cekType == 'vendbill' || cekType == 'exprept' || cekType == 'purchreq' || cekType == 'purchord'){
                    var emp = getFinanceMatric(sofId, grossamt, createdBy)
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
                        sublistId: "expense",
                        fieldId: "custcol_stc_approver_linetrx",
                        value: cekEmp
                    })
                }
                currentRec.setCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "custcol_stc_approval_status_line",
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