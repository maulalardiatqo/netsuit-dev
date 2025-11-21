/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/https', 'N/url'], function(currentRecord, dialog, log, search, https, url) {
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
    function getFinanceMatric(sofId, amount){
        var approvalFinance
        var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: [
                ["custrecord_stc_sof_mtrx_finance", "anyof", sofId],
                "AND", 
                ["custrecord_finance_max_amnt","greaterthanorequalto",amount]
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
        var sublistItem
        if(typeRec == 'customrecord_tar'){
            sublistExpens = 'recmachcustrecord_tar_e_id'
        }

        if(typeRec == 'customrecord_ter'){
            sublistItem = 'recmachcustrecord_terd_id'
            sublistExpens = 'recmachcustrecord_tar_id_ter'
        }
        if(typeRec == 'customrecord_tor'){
            sublistItem = 'recmachcustrecord_tori_id'
        }
        // ==== KONDISI SUBLIST ITEM ====
        if (context.sublistId === sublistItem) {
            var cekType = currentRec.getValue('type');
            console.log('cekType', cekType)
            var itemField
            var sofField
            var amtField
            var approverLineField
            var approvalStatusLineField
            if(typeRec == 'customrecord_ter'){
                itemField = 'custrecord_ted_item'
                sofField = 'custrecord_terd_sourcing_of_funding'
                amtField = 'custrecord_terd_amount'
                approverLineField = 'custrecord_terd_approver'
                approvalStatusLineField = 'custrecord_terd_approval_status'
            }else if(typeRec == 'customrecord_tor'){
                itemField = 'custrecord_tori_item'
                sofField = 'custrecord_tori_source_of_funding'
                amtField = 'custrecord_tori_amount'
                approverLineField = 'custrecord_tori_approver'
                approvalStatusLineField = 'custrecord_tori_approval_status'
            }

            var itemId = currentRec.getCurrentSublistValue({
                sublistId: sublistItem,
                fieldId: itemField
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
                sublistId: sublistItem,
                fieldId: sofField
            });
            var grossamt = currentRec.getCurrentSublistValue({
                sublistId: sublistItem,
                fieldId: amtField
            });
            

            console.log('parameterSearch', { itemId: itemId, account: account, sofId: sofId, grossamt: grossamt })
            console.log('cekCurrentMode', currentMode)

            if (sofId) {
                var cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
                if(typeRec == 'customrecord_tor'){
                    var emp = getFinanceMatric(sofId, grossamt)
                    if(emp){
                        currentRec.setCurrentSublistValue({
                            sublistId : sublistItem,
                            fieldId : "custrecord_tori_approver_fa",
                            value : emp
                        })
                        currentRec.setCurrentSublistValue({
                            sublistId: sublistItem,
                            fieldId: "custrecord_tori_approval_status_fa",
                            value: "1"
                        })
                    }
                }
                console.log('cekEmp', cekEmp)
                if (cekEmp) {
                    currentRec.setCurrentSublistValue({
                        sublistId: sublistItem,
                        fieldId: approverLineField,
                        value: cekEmp
                    })
                }
                currentRec.setCurrentSublistValue({
                    sublistId: sublistItem,
                    fieldId: approvalStatusLineField,
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
            }else if(typeRec == 'customrecord_ter'){
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
                    var emp = getFinanceMatric(sofId, grossamt)
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