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

        function callPeriodMulti(yearName, periodName) {
            const suiteletUrl = url.resolveScript({
                scriptId: "customscript_abj_sl_get_period_id",
                deploymentId: "customdeploy_abj_sl_get_period_id",
                params: {
                    custscript_year_name: yearName,
                    custscript_period_name: periodName
                }
            });

            const response = https.get({ url: suiteletUrl });
            var data = JSON.parse(response.body);

            return {
                yearId: data.yearId || '',
                periodId: data.periodId || ''
            };
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
            log.debug('filterSearch consumed', { account : account, estAmount : estAmount, classId : classId, sofId: sofId, department : department, periodId : periodId})
            const suiteletUrl = url.resolveScript({
                scriptId: "customscript_abj_sl_get_coonsumedamt",
                deploymentId: "customdeploy_abj_sl_get_coonsumedamt",
                params: {
                    custscript_account_id: account,
                    custscript_department_id: department,
                    custscript_class_id: classId,
                    custscript_sof_id: sofId,
                    custscript_period_id: periodId,
                    custscript_est_amt: estAmount,
                }
            });

            const response = https.get({ url: suiteletUrl });
            var data = JSON.parse(response.body);
            console.log('data', data)
            var newAmount = data.newAmt || 0
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
            var periodName = result.periodName;

            // call suitelet sekali saja
            var periodData = callPeriodMulti(yearPeriodName, periodName);

            var yearId = periodData.yearId;
            var periodId = periodData.periodId;

            var monthIndex = getMonthIndex(date);

            if (sublistName === 'expense') {
                actionSublist(currentRecordObj, 'expense', yearId, periodId, monthIndex);
            }

            if (sublistName === 'item') {
                actionSublist(currentRecordObj, 'item', yearId, periodId, monthIndex);
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