/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
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
        function getBudget(periodText, subsId, account, department, dateText){
            log.debug('filter search budget', {periodText : periodText, subsId: subsId, account: account, department: department, dateText: dateText})
            console.log('filter search budget', {periodText : periodText, subsId: subsId, account: account, department: department, dateText: dateText})

            var transactionSearchObj = search.create({
                type: "transaction",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                filters:
                [
                    ["type","anyof","Custom111"], 
                    "AND", 
                    ["account","noneof","53"], 
                    "AND", 
                    ["custbody_bm_budget_current","is","T"], 
                    "AND", 
                    //['formulatext: {custbody_bm_period_range}', 'contains', periodText],
                    ["formulatext: TO_CHAR({custcol_bm_start_date}, 'MM/YYYY')","contains",dateText],
                    "AND", 
                    ["subsidiary","anyof",subsId], 
                    "AND", 
                    ["account","anyof",account], 
                    "AND", 
                    ["department","anyof",department]
                ],
                columns:
                [
                    search.createColumn({name: "custbody_bm_budget_name", label: "Budget Name"}),
                    search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)"}),
                    search.createColumn({name: "departmentnohierarchy", label: "Department (no hierarchy)"}),
                    search.createColumn({name: "account", label: "Account"}),
                    search.createColumn({name: "amount", label: "Amount"}),
                    search.createColumn({name: "custcol_bm_line_bdg_val", label: "Budget Period"}),
                    search.createColumn({name: "custbody_bm_budget_control", label: "Budget Control"}),
                    search.createColumn({name: "custbody_bm_period_range", label: "Period Range"}),
                    search.createColumn({
                        name: "custrecord_bm_warn_msg_tran_save",
                        join: "CUSTBODY_BM_BUDGET_CONTROL",
                        label: "Message (Transaction Save)"
                    }),
                    search.createColumn({
                        name: "custrecord_bm_warn_line",
                        join: "CUSTBODY_BM_BUDGET_CONTROL",
                        label: "Message (Line)"
                    }),
                    search.createColumn({
                        name: "custrecord_bm_status_header_msg",
                        join: "CUSTBODY_BM_BUDGET_CONTROL",
                        label: "Status Message (Within Budget)"
                    }),
                    search.createColumn({
                        name: "custrecord_bm_control_pref",
                        join: "CUSTBODY_BM_BUDGET_CONTROL",
                        label: "Budget Control Action"
                    }),
                    search.createColumn({
                        name: "custrecord_bm_budget_head_msg",
                        join: "CUSTBODY_BM_BUDGET_CONTROL",
                        label: "Status Message (Exceeds Budget)"
                     })
                ]
            });
            var transSearchResult = transactionSearchObj.run().getRange({ start: 0, end: 1 });
            //log.debug('transSearchResult : '+transSearchResult.length, transSearchResult);
            var allDataBudget = []
            if (transSearchResult.length > 0) {
                var budget = transSearchResult[0].getValue({ name: "amount",});
                var statusErr = transSearchResult[0].getValue({ 
                    name: "custrecord_bm_warn_msg_tran_save",
                    join: "CUSTBODY_BM_BUDGET_CONTROL",
                });
                var statusErrLine = transSearchResult[0].getValue({ 
                    name: "custrecord_bm_warn_line",
                    join: "CUSTBODY_BM_BUDGET_CONTROL",
                });
                var statusSuccLine = transSearchResult[0].getValue({ 
                    name: "custrecord_bm_status_header_msg",
                    join: "CUSTBODY_BM_BUDGET_CONTROL",
                });
                var budgetCOntrol = transSearchResult[0].getValue({
                    name: "custrecord_bm_control_pref",
                    join: "CUSTBODY_BM_BUDGET_CONTROL",
                })
                if(budgetCOntrol){
                    budgetContorlGolbal = budgetCOntrol
                }
                var msg =  transSearchResult[0].getValue({
                    name: "custrecord_bm_budget_head_msg",
                    join: "CUSTBODY_BM_BUDGET_CONTROL",
                })
                if(msg)[
                    msgGlobal = msg
                ]
                allDataBudget.push({
                    budget : budget,
                    statusErr : statusErr,
                    statusErrLine : statusErrLine,
                    statusSuccLine : statusSuccLine
                })
            }
            return allDataBudget
        }
        function callSearch(subsId, account, department, estAmount, period, dateText){
            log.debug('filterSearch consumed', {subsId : subsId, account : account, estAmount : estAmount, period : period, dateText: dateText})
            var purchaserequisitionSearchObj = search.create({
                type: "purchaserequisition",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                filters:
                [
                    ["type","anyof","PurchReq"], 
                    "AND", 
                    ["account","noneof","220"], 
                    "AND", 
                    ["accounttype","anyof","Expense","OthExpense","DeferExpense"], 
                    "AND", 
                    ["subsidiary","anyof", subsId], 
                    "AND", 
                    ["department","anyof",department], 
                    "AND", 
                    ["account","anyof",account],
                    "AND", 
                    //["formulatext: TO_CHAR({trandate}, 'MM-YYYY')","is",period],
                    ["formulatext: TO_CHAR({trandate}, 'MM/YYYY')","contains",dateText]
                ],
                columns:
                    [
                    search.createColumn({
                        name: "estimatedamount",
                        summary: "SUM",
                        label: "Estimated Amount"
                    }),
                    search.createColumn({
                        name: "amount",
                        summary: "SUM",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "account",
                        summary: "GROUP",
                        label: "Account"
                    }),
                    search.createColumn({
                        name: "subsidiary",
                        summary: "GROUP",
                        label: "Subsidiary"
                    }),
                    search.createColumn({
                        name: "department",
                        summary: "GROUP",
                        label: "Department"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "TO_CHAR({trandate}, 'MM-YYYY')",
                        label: "Period"
                    })
                ]
            });
            var searchResults = purchaserequisitionSearchObj.run().getRange({ start: 0, end: 1 });
            var amtFromSearch = 0
            log.debug('searchResults : '+searchResults.length, searchResults);
            if (searchResults.length > 0) {
                var estimatedAmount = searchResults[0].getValue({ name: "estimatedamount", summary: "SUM", });
                var period = searchResults[0].getValue({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "TO_CHAR({trandate}, 'MM-YYYY')",
                });
                if(estimatedAmount){
                    amtFromSearch = estimatedAmount
                }
            }
            var newAmount = Number(amtFromSearch) + Number(estAmount)
            return newAmount
        }
        function setSblValue(currentRecordObj, subsId, department, account, period, periodText, estAmount, additionalAmt, sblsId, dateText){
            var newAmount = 0
            if(subsId && account && department && estAmount && period && dateText){
                newAmount = callSearch(subsId, account, department, estAmount, period, dateText)
            }
            
            log.debug('newAmount', newAmount)
            var amtSet = Number(newAmount) + Number(additionalAmt)
            log.debug('amtSet', amtSet)
            if(amtSet){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_bm_budgetamountconsumed",
                    value: amtSet || 0,
                });
            }
            var dataBudget = []
            if(periodText && subsId && account && department && dateText){
                dataBudget = getBudget(periodText, subsId, account, department, dateText)
            }
            console.log('DATA BUDGET', dataBudget)
            log.debug('DATA BUDGET', dataBudget)
            
            if(dataBudget.length > 0){
                var budgetAmt = dataBudget[0].budget
                var statLine = ''
                if(amtSet > budgetAmt){
                    statLine = dataBudget[0].statusErrLine
                }else{
                    statLine = dataBudget[0].statusSuccLine
                }
            
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_bm_budgetwarning",
                    value: statLine,
                }); 
                currentRecordObj.setCurrentSublistValue({
                    sublistId: sblsId,
                    fieldId: "custcol_bm_budgetamount",
                    value: budgetAmt,
                });
            }
        }
        function actionSublist(currentRecordObj, sblsId){
            var accountName = ''
            if(sblsId == "expense"){
                accountName = "account"
            }else{
                accountName = "custcol_bm_itemaccount"
            }
            var subsId = currentRecordObj.getValue('subsidiary');
            var trandate = currentRecordObj.getValue('trandate');
            var month = String(trandate.getMonth() + 1); 
            var year = trandate.getFullYear();
            var period = month + '-' + year;
            var bulan = convertNumberToMonth(month);
            var periodText = bulan + ' ' + year;
            var dateText = month + '/' + year;
            
            if (subsId) {
                var department = currentRecordObj.getCurrentSublistValue({  
                    sublistId: sblsId,
                    fieldId: "department",
                });
                var account = currentRecordObj.getCurrentSublistValue({  
                    sublistId: sblsId,
                    fieldId: accountName,
                });
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
                    log.debug('estAmount', estAmount);
                }
                
               
                
                if (department) {
                    var additionalAmt = 0;
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
                            var accountCek = currentRecordObj.getSublistValue({  
                                sublistId: sblsId,
                                fieldId: accountName,
                                line: i
                            });
                            
                            if (departmentCek == department && accountCek == account) {
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
                    setSblValue(currentRecordObj, subsId, department, account, period, periodText, estAmount, additionalAmt, sblsId, dateText);
                }
            }
        }
        function fieldChanged(context){
            var currentRecordObj = context.currentRecord;
            var sublistFieldName = context.fieldId;
            var sublistName = context.sublistId;
            if (sublistName == 'expense'){
                var sblsId = "expense";
                if (sublistFieldName == 'estimatedamount') {
                    
                    actionSublist(currentRecordObj, sblsId)
                }
                
                if(sublistFieldName == 'department'){
                    actionSublist(currentRecordObj, sblsId)
                }
            }
            if (sublistName == 'item'){
                var sblsId = "item";
                if (sublistFieldName == 'estimatedamount') {
                    
                    actionSublist(currentRecordObj, sblsId)
                }
                
                if(sublistFieldName == 'department'){
                    actionSublist(currentRecordObj, sblsId)
                }
                if(sublistFieldName == 'estimatedrate'){
                    actionSublist(currentRecordObj, sblsId)
                }
            }

        }
        function saveRecord(context) {
            var currentRecordObj = context.currentRecord;
            log.debug('masuk save record')
            var cekLineExp = currentRecordObj.getLineCount({ sublistId: 'expense' });
            if (cekLineExp > 0) {
                for (var i = 0; i < cekLineExp; i++) {
                    var budget = currentRecordObj.getSublistValue({  
                        sublistId: "expense",
                        fieldId: "custcol_bm_budgetamount",
                        line: i
                    });
                    var consumed = currentRecordObj.getSublistValue({  
                        sublistId: "expense",
                        fieldId: "custcol_bm_budgetamountconsumed",
                        line: i
                    });
                    log.debug('msgGlobal', msgGlobal);
                    if(budget && consumed){
                        if (consumed > budget) {
                            log.debug('budgetContorlGolbal', budgetContorlGolbal)
                            if(budgetContorlGolbal == "1"){
                                
                                currentRecordObj.setValue({
                                    fieldId : "custbody_bm_budgetstatus",
                                    value : msgGlobal
                                });
                                return true
                            }else{
                                dialog.alert({
                                    title: 'Warning!',
                                    message: '<div style="color: red;">One or more transaction lines in the "Expense" sublist either do not have a matching budget or are exceeding budget. Check the transaction lines and update.</div>'
                                });
                                return true;
                            }
                            
                        }
                    }
                    
                    
                }
            }
        
            var cekLineItem = currentRecordObj.getLineCount({ sublistId: 'item' });
            if (cekLineItem > 0) {
                for (var k = 0; k < cekLineItem; k++) {
                    var budget = currentRecordObj.getSublistValue({  
                        sublistId: "item",
                        fieldId: "custcol_bm_budgetamount",
                        line: k
                    });
                    var consumed = currentRecordObj.getSublistValue({  
                        sublistId: "item",
                        fieldId: "custcol_bm_budgetamountconsumed",
                        line: k
                    });
                    log.debug('SAVE budget', budget)
                    log.debug('SAVE consumed', consumed)
                    if(budget && consumed){
                        if (consumed > budget) {
                            log.debug('budgetContorlGolbal', budgetContorlGolbal)
                            if(budgetContorlGolbal == "1"){
                                log.debug('msgGlobal', msgGlobal);
                                currentRecordObj.setValue({
                                    fieldId : "custbody_bm_budgetstatus",
                                    value : msgGlobal
                                });
                                return true
                            }else{
                                dialog.alert({
                                    title: 'Warning!',
                                    message: '<div style="color: red;">One or more transaction lines in the "Item" sublist either do not have a matching budget or are exceeding budget. Check the transaction lines and update.</div>'
                                });
                                return true;
                            }
                            
                        }
                    }
                    
                }
            }
        
            return true;
        }
    }catch(e){
        log.debug('error', e)
    }
    
    
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        saveRecord : saveRecord
    };
});