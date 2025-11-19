/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    try{
        var records = currentRecord.get();
        var budgetContorlGolbal
        var msgGlobal
        function pageInit(context) {
            console.log('init masuk')
        }
        function convertNumberToMonth(number) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            if (number < 1 || number > 12) {
                return "Invalid month number"; 
            }
            return months[number - 1];
        }
        function getBudget(account, department, classId, sofId){
            log.debug('filter search budget', {account, department, classId, sofId})
            console.log('filter search budget', {account, department, classId, sofId})

            var budgetimportSearchObj = search.create({
            type: "budgetimport",
            filters:
            [
                ["account","anyof",account], 
                "AND", 
                ["class","anyof",classId], 
                "AND", 
                ["department","anyof",department], 
                "AND", 
                ["cseg_stc_sof","anyof",sofId]
            ],
            columns:
            [
                search.createColumn({name: "account", label: "Account"}),
                search.createColumn({name: "year", label: "Year"}),
                search.createColumn({name: "amount", label: "Amount"}),
                search.createColumn({name: "department", label: "Cost Center"}),
                search.createColumn({name: "class", label: "Project Code"}),
                search.createColumn({name: "cseg_stc_sof", label: "Source of Funding"}),
                search.createColumn({name: "category", label: "Category"}),
                search.createColumn({name: "global", label: "Global"}),
                search.createColumn({name: "currency", label: "Currency"}),
                search.createColumn({name: "internalid", label: "Internal ID"})
            ]
            });
            // var searchResultCount = budgetimportSearchObj.runPaged().count;
            // log.debug("budgetimportSearchObj result count",searchResultCount);
            // budgetimportSearchObj.run().each(function(result){
            // // .run().each has a limit of 4,000 results
            // return true;
            // });

            var transSearchResult = budgetimportSearchObj.run().getRange({ start: 0, end: 1 });
            //log.debug('transSearchResult : '+transSearchResult.length, transSearchResult);
            var allDataBudget = []
            if (transSearchResult.length > 0) {
                var budget = transSearchResult[0].getValue({ name: "amount",});
                allDataBudget.push({
                    budget : budget,
                })
            }
            return allDataBudget
        }
        function callSearch( account, department, estAmount, classId, sofId){
            log.debug('filterSearch consumed', { account : account, estAmount : estAmount, classId : classId, sofId: sofId, department : department})
            var transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
                ["formulatext: {status}","doesnotcontain","reject"], 
                "AND", 
                ["accounttype","anyof","Expense","OthExpense","DeferExpense"], 
                "AND", 
                ["account.custrecord_bm_budgetaccount","is","F"], 
                "AND", 
                ["status","noneof","PurchOrd:P","PurchOrd:A"], 
                "AND", 
                ["account","anyof", account], 
                "AND", 
                ["department","anyof",department], 
                "AND", 
                ["class","anyof",classId], 
                "AND", 
                ["line.cseg_stc_sof","anyof",sofId]
            ],
            columns:
            [
                search.createColumn({
                    name: "account",
                    summary: "GROUP",
                    label: "Account"
                }),
                search.createColumn({
                    name: "department",
                    summary: "GROUP",
                    label: "Cost Center"
                }),
                search.createColumn({
                    name: "class",
                    summary: "GROUP",
                    label: "Project Code"
                }),
                search.createColumn({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                    label: "SOF"
                }),
                search.createColumn({
                    name: "custcol_stc_budget_amount",
                    summary: "MAX",
                    label: "STC - Budget Amount"
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: "((SUM(NVL(CASE WHEN {recordType}='purchaseorder' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType} = 'itemreceipt' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType}='purchaseorder' AND {status} = 'Closed' THEN {rate}*({quantity} - {quantitybilled}) END,0)))+(SUM(NVL(CASE WHEN {recordType}='purchaserequisition'  AND {status} NOT IN ('PurchReq:F', 'Fully Ordered')THEN {amount}     END, 0)))) + (SUM(NVL(CASE WHEN {posting} = 'T' THEN {amount} END,0)))",
                    label: "Formula (Currency)"
                })
            ]
            });
            var searchResults = transactionSearchObj.run().getRange({ start: 0, end: 1 });
            var amtFromSearch = 0
            log.debug('searchResults : '+searchResults.length, searchResults);
            if (searchResults.length > 0) {
                var amtSearch = searchResults[0].getValue({ 
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: "((SUM(NVL(CASE WHEN {recordType}='purchaseorder' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType} = 'itemreceipt' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType}='purchaseorder' AND {status} = 'Closed' THEN {rate}*({quantity} - {quantitybilled}) END,0)))+(SUM(NVL(CASE WHEN {recordType}='purchaserequisition'  AND {status} NOT IN ('PurchReq:F', 'Fully Ordered')THEN {amount}     END, 0)))) + (SUM(NVL(CASE WHEN {posting} = 'T' THEN {amount} END,0)))",
                });
                log.debug('amtSearch cek search', amtSearch)
                if(amtSearch){
                    amtFromSearch = amtSearch
                }
            }
            var newAmount = Number(amtFromSearch) + Number(estAmount)
            return newAmount
        }
        function setSblValue(currentRecordObj, account, department, classId, sofId, estAmount, additionalAmt, sblsId){
            var newAmount = 0
            if(account && department && estAmount && classId && sofId){
                newAmount = callSearch( account, department, estAmount, classId, sofId)
            }
            
            log.debug('newAmount', newAmount)
            var amtSet = Number(newAmount) + Number(additionalAmt)
            log.debug('amtSet', amtSet)
            if(amtSet){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_stc_budget_consumed",
                    value: amtSet || 0,
                });
            }else{
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_stc_budget_consumed",
                    value: estAmount,
                });
            }
            var dataBudget = []
            if(account && department){
                dataBudget = getBudget(account, department, classId, sofId)
            }
            console.log('DATA BUDGET', dataBudget)
            log.debug('DATA BUDGET', dataBudget)
            
            if(dataBudget.length > 0){
                var budgetAmt = dataBudget[0].budget
                var statLine = ''
                if(amtSet > budgetAmt){
                    statLine = "Transaction line amount exceeds budget."
                }else{
                    statLine = "Amount in all transaction lines is within budget."
                }
            
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcolstc_budget_warning",
                    value: statLine,
                }); 
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_stc_budget_amount",
                    value: budgetAmt,
                });
            }else{
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcolstc_budget_warning",
                    value: '',
                }); 
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_stc_budget_amount",
                    value: 0,
                });
            }
        }
        function actionSublist(currentRecordObj, sblsId){
            var department = currentRecordObj.getCurrentSublistValue({  
                sublistId: sblsId,
                fieldId: "department",
            });
            var classId = currentRecordObj.getCurrentSublistValue({  
                sublistId: sblsId,
                fieldId: "class",
            });
            var sofId = currentRecordObj.getCurrentSublistValue({  
                sublistId: sblsId,
                fieldId: "cseg_stc_sof",
            });
            var account = ''
                if(sblsId == "expense"){
                    account = currentRecordObj.getCurrentSublistValue({  
                    sublistId: sblsId,
                    fieldId: 'account',
                });
            }else{
                var itemId = currentRecordObj.getCurrentSublistValue({  
                    sublistId: sblsId,
                    fieldId: "item",
                });
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
            
            var estAmount = currentRecordObj.getCurrentSublistValue({
                sublistId: sblsId,
                fieldId: "estimatedamount",
            });
            if(sblsId == "item"){
                var qty = currentRecordObj.getCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "quantity",
                });
                var estRate = currentRecordObj.getCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "estimatedrate",
                });
                estAmount = Number(estRate) * Number(qty);
                console.log('estAmount', estAmount);
            }
            var additionalAmt = 0;
            if (department && classId && sofId) {
                var cekLineCount = currentRecordObj.getLineCount({
                    sublistId: sblsId
                });
                
                if (cekLineCount > 0) {
                    var currentLine = currentRecordObj.getCurrentSublistIndex({
                        sublistId: sblsId
                    });
                    
                    for (var i = 0; i < cekLineCount; i++) {
                        log.debug('currentLine', currentLine)
                        if (i === currentLine) {
                            log.debug('masuk currentLine', i)
                            continue; 
                        }
                        var departmentCek = currentRecordObj.getSublistValue({  
                            sublistId: sblsId,
                            fieldId: "department",
                            line: i
                        });
                        var classCek = currentRecordObj.getSublistValue({  
                            sublistId: sblsId,
                            fieldId: "class",
                            line: i
                        });
                        var sofCek = currentRecordObj.getSublistValue({  
                            sublistId: sblsId,
                            fieldId: "cseg_stc_sof",
                            line: i
                        });
                        var accountCek 
                        if(sblsId == 'expense'){
                            accountCek = currentRecordObj.getSublistValue({  
                                sublistId: sblsId,
                                fieldId: 'account',
                                line: i
                            });
                        }else{
                            var itemCek = currentRecordObj.getSublistValue({  
                                sublistId: sblsId,
                                fieldId: "item",
                                line: i
                            });
                            const suiteletUrl = url.resolveScript({
                                scriptId: "customscript_abj_sl_get_item",
                                deploymentId: "customdeploy_abj_sl_get_item",
                                params: {
                                    custscript_item_id: itemCek,
                                }
                            });

                            const response = https.get({ url: suiteletUrl });
                            accountCek = response.body || ''
                            console.log('response', response)
                        }
                        
                        if (departmentCek == department && accountCek == account && classId == classCek && sofId == sofCek) {
                            log.debug('department dan account Sama');
                            var amtLine = currentRecordObj.getSublistValue({  
                                sublistId: sblsId,
                                fieldId: "estimatedamount",
                                line: i
                            });
                            
                            if (amtLine) {
                                additionalAmt += Number(amtLine);
                            }
                        }
                    }
                }
                setSblValue(currentRecordObj, account, department, classId, sofId, estAmount, additionalAmt, sblsId);
            }
            
        }
        function validateLine(context) {
            var currentRecordObj = context.currentRecord;
            var sublistName = context.sublistId;

            // EXPENSE SUBLIST
            if (sublistName === 'expense') {
                var sblsId = "expense";

                // Anda bisa cek semua field yang diperlukan di validateLine
                var estimatedAmount = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'estimatedamount'
                });
                var department = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'department'
                });

                // bila salah satu field berubah nanti validate akan memproses
                actionSublist(currentRecordObj, sblsId);
            }

            // ITEM SUBLIST
            if (sublistName === 'item') {
                var sblsId = "item";

                var estimatedAmount = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'estimatedamount'
                });
                var department = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'department'
                });
                var estimatedRate = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'estimatedrate'
                });

                actionSublist(currentRecordObj, sblsId);
            }

            // WAJIB return true agar line tidak diblok
            return true;
        }

        // function saveRecord(context) {
        //     var currentRecordObj = context.currentRecord;
        //     log.debug('masuk save record')
        //     var cekLineExp = currentRecordObj.getLineCount({ sublistId: 'expense' });
        //     if (cekLineExp > 0) {
        //         for (var i = 0; i < cekLineExp; i++) {
        //             var budget = currentRecordObj.getSublistValue({  
        //                 sublistId: "expense",
        //                 fieldId: "custcol_bm_budgetamount",
        //                 line: i
        //             });
        //             var consumed = currentRecordObj.getSublistValue({  
        //                 sublistId: "expense",
        //                 fieldId: "custcol_bm_budgetamountconsumed",
        //                 line: i
        //             });
        //             log.debug('msgGlobal', msgGlobal);
        //             if(budget && consumed){
        //                 if (consumed > budget) {
        //                     log.debug('budgetContorlGolbal', budgetContorlGolbal)
        //                     if(budgetContorlGolbal == "1"){
                                
        //                         currentRecordObj.setValue({
        //                             fieldId : "custbody_bm_budgetstatus",
        //                             value : msgGlobal
        //                         });
        //                         return true
        //                     }else{
        //                         dialog.alert({
        //                             title: 'Warning!',
        //                             message: '<div style="color: red;">One or more transaction lines in the "Expense" sublist either do not have a matching budget or are exceeding budget. Check the transaction lines and update.</div>'
        //                         });
        //                         return true;
        //                     }
                            
        //                 }
        //             }
                    
                    
        //         }
        //     }
        
        //     var cekLineItem = currentRecordObj.getLineCount({ sublistId: 'item' });
        //     if (cekLineItem > 0) {
        //         for (var k = 0; k < cekLineItem; k++) {
        //             var budget = currentRecordObj.getSublistValue({  
        //                 sublistId: "item",
        //                 fieldId: "custcol_bm_budgetamount",
        //                 line: k
        //             });
        //             var consumed = currentRecordObj.getSublistValue({  
        //                 sublistId: "item",
        //                 fieldId: "custcol_bm_budgetamountconsumed",
        //                 line: k
        //             });
        //             log.debug('SAVE budget', budget)
        //             log.debug('SAVE consumed', consumed)
        //             if(budget && consumed){
        //                 if (consumed > budget) {
        //                     log.debug('budgetContorlGolbal', budgetContorlGolbal)
        //                     if(budgetContorlGolbal == "1"){
        //                         log.debug('msgGlobal', msgGlobal);
        //                         currentRecordObj.setValue({
        //                             fieldId : "custbody_bm_budgetstatus",
        //                             value : msgGlobal
        //                         });
        //                         return true
        //                     }else{
        //                         dialog.alert({
        //                             title: 'Warning!',
        //                             message: '<div style="color: red;">One or more transaction lines in the "Item" sublist either do not have a matching budget or are exceeding budget. Check the transaction lines and update.</div>'
        //                         });
        //                         return true;
        //                     }
                            
        //                 }
        //             }
                    
        //         }
        //     }
        
        //     return true;
        // }
    }catch(e){
        log.debug('error', e)
    }
    
    
    return {
        pageInit: pageInit,
        validateLine : validateLine
    };
});