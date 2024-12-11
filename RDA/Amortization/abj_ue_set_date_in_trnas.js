/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format", "N/task"], function (record, search, format, task) {
    function getEndOfNextMonth(postingPeriodText) {
        const [day, monthStr, year] = postingPeriodText.split(" ");
        const monthMap = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };
        const currentMonth = monthMap[monthStr];
    
        const nextMonthDate = new Date(year, currentMonth + 1, 1);
    
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        nextMonthDate.setDate(0);
    
        const endOfMonth = nextMonthDate.getDate();
        const endMonthStr = Object.keys(monthMap).find(key => monthMap[key] === nextMonthDate.getMonth());
        const endYear = nextMonthDate.getFullYear();
    
        return `${endOfMonth} ${endMonthStr} ${endYear}`;
    }
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                var rec = context.newRecord;
                var recType = rec.type
                var recId = rec.id
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                
                var postingPeriod = recordLoad.getValue('postingperiod');
                var prefPostingPeriod = recordLoad.getText('postingperiod');
                var postingPeriodText = getEndOfNextMonth(prefPostingPeriod);
                log.debug('prefPostingPeriod', prefPostingPeriod)
                log.debug('postingPeriodText', postingPeriodText)

                var idAmortTemp
                var idAmortSched
                var vendorbillSearchObj = search.create({
                    type: "vendorbill",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                    filters:
                    [
                        ["type","anyof","VendBill"], 
                        "AND", 
                        ["internalid","anyof",recId], 
                        "AND", 
                        ["amortizationschedule.internalid","noneof","@NONE@"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "amortizationSchedule",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "amortemplate",
                            join: "amortizationSchedule",
                            label: "Template Name"
                        })
                    ]
                });
                var searchResultCount = vendorbillSearchObj.runPaged().count;
                vendorbillSearchObj.run().each(function(result){
                    var tempAmort = result.getValue({
                        name: "amortemplate",
                        join: "amortizationSchedule",
                    });
                    if(tempAmort){
                        idAmortTemp = tempAmort
                    }
                    var schedAmort = result.getValue({
                        name: "internalid",
                        join: "amortizationSchedule",
                    });
                    if(schedAmort){
                        if(context.type === context.UserEventType.CREATE){
                            idAmortSched = Number(schedAmort) + Number(1)
                        }else{
                            idAmortSched = schedAmort
                        }
                        
                    }
                    return true;
                });

                function getMonthYearFromText(postingPeriodText) {
                    const parts = postingPeriodText.split(' '); 
                    const monthText = parts[1]; 
                    const year = parseInt(parts[2]);
                
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const month = months.indexOf(monthText) + 1;
                
                    return { month, year };
                }
                
                function addMonths(month, year, monthsToAdd) {
                    let newMonth = month + monthsToAdd; 
                    let newYear = year;
                
                    while (newMonth > 12) {
                        newMonth -= 12;
                        newYear++;
                    }
                
                    return { newMonth, newYear };
                }
                
                // Function to subtract months from a given month/year
                
                function getLastDayOfMonth(year, month) {
                    const lastDay = new Date(year, month, 0); 
                    const day = String(lastDay.getDate()).padStart(2, '0');
                    const monthFormatted = String(lastDay.getMonth() + 1).padStart(2, '0');
                    const yearFormatted = lastDay.getFullYear();
                
                    return `${day}/${monthFormatted}/${yearFormatted}`;
                }
                
                function getAmortizationDates(postingPeriodText, amortPeriod, periodOffset, startOffset) {
                    const { month: startMonth, year: startYear } = getMonthYearFromText(postingPeriodText);
                    
                    const { newMonth: endMonth, newYear: endYear } = addMonths(startMonth, startYear, amortPeriod - 1);
                
                    let dateAwal = getLastDayOfMonth(startYear, startMonth);
                    let dateAhir = getLastDayOfMonth(endYear, endMonth);
                
                    if (periodOffset > 0) {
                        const { newMonth: adjStartMonth, newYear: adjStartYear } = addMonths(startMonth, startYear, periodOffset);
                        const { newMonth: adjEndMonth, newYear: adjEndYear } = addMonths(endMonth, endYear, periodOffset);
                
                        dateAwal = getLastDayOfMonth(adjStartYear, adjStartMonth);
                        dateAhir = getLastDayOfMonth(adjEndYear, adjEndMonth);
                    }
                
                    if (startOffset > 0) {
                        const { newMonth: adjStartMonth, newYear: adjStartYear } = addMonths(startMonth, startYear, startOffset);
                        dateAwal = getLastDayOfMonth(adjStartYear, adjStartMonth);
                    }
                
                    return { dateAwal, dateAhir };
                }
                
                function convertToDate(dateString) {
                    var dateParts = dateString.split('/');
                    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
                }

                var countLineExpense = recordLoad.getLineCount({
                    sublistId : "expense"
                });
                if(countLineExpense > 0){

                    for(var i = 0; i < countLineExpense; i++){
                        var idLine = recordLoad.getSublistValue({
                            sublistId : 'expense',
                            fieldId : 'line',
                            line : i
                        })
                        var amount = recordLoad.getSublistValue({
                            sublistId : 'expense',
                            fieldId : 'amount',
                            line : i
                        });

                        if(idAmortTemp){
                            var recTempAmor = record.load({
                                type: 'amortizationtemplate',
                                id: idAmortTemp,
                                isDynamic: true,
                            });
                            
                            var account = recTempAmor.getValue('accttarget');
                            var amortPeriod = recTempAmor.getValue('amortizationperiod'); 
                            var periodOffset = recTempAmor.getValue('periodoffset');      
                            var startOffset = recTempAmor.getValue('revrecoffset');        
                            
                            
                            const { dateAwal, dateAhir } = getAmortizationDates(postingPeriodText, amortPeriod, periodOffset, startOffset);
                             
                            function sysDate(dateAwal, dateAhir) {
                                var date = new Date();
                                var tdate = date.getUTCDate();
                                var month = date.getUTCMonth() + 1;
                                var year = date.getUTCFullYear();
                                
                                return {
                                    lastDate: dateAwal,
                                    endDate: dateAhir
                                };
                            }

                            var result = sysDate(dateAwal, dateAhir);

                            var lastDateParts = result.lastDate.split('/');
                            var lastDate = new Date(lastDateParts[2], lastDateParts[1] - 1, lastDateParts[0]);

                            var endDateParts = result.endDate.split('/');
                            var endDateFor = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

                           
                            
                            var startDate = convertToDate(result.lastDate);
                            var endDate = convertToDate(result.endDate);

                            if(startOffset > 0){
                                amortPeriod = Number(amortPeriod) - Number(startOffset)
                            }
                            var amounttoSet = Number(amount) / Number(amortPeriod)
                            recordLoad.selectLine({
                                sublistId : "expense",
                                line : i
                            })
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'expense',
                                fieldId : 'amortizstartdate',
                                line : i,
                                value : startDate
                            });
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'expense',
                                fieldId : 'amortizationenddate',
                                line : i,
                                value : endDate
                            });
                            recordLoad.commitLine("expense")
                           
                            var amortizationscheduleSearchObj = search.create({
                                type: "amortizationschedule",
                                filters:
                                [
                                        ["internalid","anyof",idAmortSched]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "recuramount", label: "Amount"})
                                ]
                            });
                            var searchResultCount = amortizationscheduleSearchObj.runPaged().count;
                            if(searchResultCount < 0 || searchResultCount == null || searchResultCount == ''){
                                idAmortSched = Number(idAmortSched) + 1
                            }
                            var mapReduceTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_abj_mr_set_amortization', 
                                deploymentId: 'customdeploy_abj_mr_set_amortization',
                                params: {
                                    custscript_amortization_id: idAmortSched,
                                    custscript_recamount: amounttoSet,
                                    custscript_startdate: startDate,
                                    custscript_enddate: endDate,
                                    custscript_account : account,
                                    custscript_id_trans : recId

                                }
                            });
                            var taskId = mapReduceTask.submit();
                            log.debug('Map/Reduce Task Submitted', taskId);
                        }
                    }
                  
                }
                var countLineItem = recordLoad.getLineCount({
                    sublistId : "item"
                });
                log.debug('countLine', countLineItem)
                if(countLineItem > 0){
                    for(var i = 0; i < countLineItem; i++){
                        var idLine = recordLoad.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'line',
                            line : i
                        })
                        var amount = recordLoad.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'amount',
                            line : i
                        });
                        log.debug('amount', amount)
                        if(idAmortTemp){
                            var recTempAmor = record.load({
                                type: 'amortizationtemplate',
                                id: idAmortTemp,
                                isDynamic: true,
                            });
                            
                            var account = recTempAmor.getValue('accttarget');
                            var amortPeriod = recTempAmor.getValue('amortizationperiod'); 
                            var periodOffset = recTempAmor.getValue('periodoffset');      
                            var startOffset = recTempAmor.getValue('revrecoffset');        
                            
                            
                            const { dateAwal, dateAhir } = getAmortizationDates(postingPeriodText, amortPeriod, periodOffset, startOffset);
                            function sysDate(dateAwal, dateAhir) {
                                var date = new Date();
                                var tdate = date.getUTCDate();
                                var month = date.getUTCMonth() + 1;
                                var year = date.getUTCFullYear();
                                
                                return {
                                    lastDate: dateAwal,
                                    endDate: dateAhir
                                };
                            }

                            var result = sysDate(dateAwal, dateAhir);

                            var lastDateParts = result.lastDate.split('/');
                            var lastDate = new Date(lastDateParts[2], lastDateParts[1] - 1, lastDateParts[0]);

                            var endDateParts = result.endDate.split('/');
                            var endDateFor = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

                           
                            
                            var startDate = convertToDate(result.lastDate);
                            var endDate = convertToDate(result.endDate);

                            if(startOffset > 0){
                                amortPeriod = Number(amortPeriod) - Number(startOffset)
                            }
                            var amounttoSet = Number(amount) / Number(amortPeriod)
                            recordLoad.selectLine({
                                sublistId : "item",
                                line : i
                            })
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'amortizstartdate',
                                line : i,
                                value : startDate
                            });
                            recordLoad.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'amortizationenddate',
                                line : i,
                                value : endDate
                            });
                            recordLoad.commitLine("item")
                           
                            var amortizationscheduleSearchObj = search.create({
                                type: "amortizationschedule",
                                filters:
                                [
                                        ["internalid","anyof",idAmortSched]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "recuramount", label: "Amount"})
                                ]
                            });
                            var searchResultCount = amortizationscheduleSearchObj.runPaged().count;
                            if(searchResultCount < 0 || searchResultCount == null || searchResultCount == ''){
                                idAmortSched = Number(idAmortSched) + 1
                            }
                            log.debug('params', {
                                idAmortSched : idAmortSched,
                                amounttoSet : amounttoSet,
                                startDate : startDate,
                                endDate : endDate,
                                account : account,
                                recId : recId
                            })
                            var mapReduceTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_abj_mr_set_amortization', 
                                deploymentId: 'customdeploy_abj_mr_set_amortization',
                                params: {
                                    custscript_amortization_id: idAmortSched,
                                    custscript_recamount: amounttoSet,
                                    custscript_startdate: startDate,
                                    custscript_enddate: endDate,
                                    custscript_account : account,
                                    custscript_id_trans : recId

                                }
                            });
                            var taskId = mapReduceTask.submit();
                            log.debug('Map/Reduce Task Submitted', taskId);
                        }
                    }
                }
                var saveRec = recordLoad.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true,
                });
                log.debug('saveRec', saveRec)
            }catch(e){
                log.debug('error', e)
            }
        }
        
    }
    return {
        afterSubmit: afterSubmit,
      };
    });
    