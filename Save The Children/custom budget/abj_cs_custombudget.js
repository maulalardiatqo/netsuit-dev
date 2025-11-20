/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    try{
        var records = currentRecord.get();
        var budgetContorlGolbal
        var msgGlobal = '<b style="color:red; font-size:20px;">WARNING<br>One or more line transaction is exceeded Budget</b>';


        function pageInit(context) {
            console.log('init masuk')
        }
        function getMonthIndex(dateObj) {
            if (!dateObj) return null;
            return dateObj.getMonth() + 1;
        }

        function callPeriod(periodName){
            var perId = ''
            var accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters:
            [
                ["periodname","is",periodName]
            ],
            columns:
            [
                search.createColumn({name: "periodname", label: "Name"}),
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "startdate", label: "Start Date"}),
                search.createColumn({name: "enddate", label: "End Date"})
            ]
            });
            var searchResultCount = accountingperiodSearchObj.runPaged().count;
            log.debug("accountingperiodSearchObj result count",searchResultCount);
            accountingperiodSearchObj.run().each(function(result){
                perId = result.getValue({
                    name: "internalid"
                })
            return true;
            });
            return perId
        }
        function getFiscalInfo(dateObj) {
            if (!dateObj) return { tahun: "", periodName: "" };

            // Daftar nama bulan dalam format NetSuite (3 huruf)
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            const year = dateObj.getFullYear();
            const month = monthNames[dateObj.getMonth()];

            return {
                tahun: `FY ${year}`,
                periodName: `${month} ${year}`
            };
        }

        function getBudget(account, department, classId, sofId, yearId, periodId, monthIndex){
            log.debug('filter search budget', {account, department, classId, sofId})
            console.log('filter search budget', {account, department, classId, sofId})
            var budgetAmt = 0
            const suiteletUrl = url.resolveScript({
                scriptId: "customscript_abj_sl_get_budget",
                deploymentId: "customdeploy_abj_sl_get_budget",
                params: {
                    custscript_account_id: account,
                    custscript_department_id: department,
                    custscript_class_id: classId,
                    custscript_sof_id: sofId,
                    custscript_year_id: yearId,
                    custscript_period_id: periodId,
                    custscript_monthidx: monthIndex,
                }
            });

            const response = https.get({ url: suiteletUrl });
            var data = JSON.parse(response.body);
            console.log('data', data)
            budgetAmt = data.amount || 0

            return budgetAmt
        }
        function callSearch( account, department, estAmount, classId, sofId, periodId){
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
                ["line.cseg_stc_sof","anyof",sofId],
                "AND",
                ["postingperiod","abs",periodId]
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
        function setSblValue(currentRecordObj, account, department, classId, sofId, estAmount, additionalAmt, sblsId, yearId, periodId, monthIndex){
            var newAmount = 0
            if(account && department && estAmount && classId && sofId){
                newAmount = callSearch( account, department, estAmount, classId, sofId, periodId)
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
            var dataBudget = 0
            if(account && department){
                dataBudget = getBudget(account, department, classId, sofId, yearId, periodId, monthIndex)
            }
            console.log('DATA BUDGET', dataBudget)
            log.debug('DATA BUDGET', dataBudget)
            
            if(dataBudget){
                var budgetAmt = dataBudget
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
        function actionSublist(currentRecordObj, sblsId, yearId, periodId, monthIndex){
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
                setSblValue(currentRecordObj, account, department, classId, sofId, estAmount, additionalAmt, sblsId, yearId, periodId, monthIndex);
            }
            
        }
        function validateLine(context) {
            var currentRecordObj = context.currentRecord;
            var sublistName = context.sublistId;
            var date = currentRecordObj.getValue('trandate');
            var result = getFiscalInfo(date);
            var yearPeriodName = result.tahun;
            var yearId = ''
            if(yearPeriodName){
                yearId = callPeriod(yearPeriodName)
            }
            var periodName = result.periodName;
            var periodId = '';
            if(periodName){
                periodId = callPeriod(periodName);
            }
            console.log('date', date)
            var monthIndex = getMonthIndex(date);
            
            // EXPENSE SUBLIST
            if (sublistName === 'expense') {
                var sblsId = "expense";
                actionSublist(currentRecordObj, sblsId, yearId, periodId, monthIndex);
            }
            // ITEM SUBLIST
            if (sublistName === 'item') {
                var sblsId = "item";
                actionSublist(currentRecordObj, sblsId, yearId, periodId, monthIndex);
            }

            return true;
        }

       
    }catch(e){
        log.debug('error', e)
    }
    
    
    return {
        pageInit: pageInit,
        validateLine : validateLine
    };
});