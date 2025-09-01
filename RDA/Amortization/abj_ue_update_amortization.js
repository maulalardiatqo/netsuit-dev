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
        log.debug('currentMonth', currentMonth)
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
                var recId = rec.id
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                
                var prefPostingPeriod = recordLoad.getText('postingperiod');
                var postingPeriodText = getEndOfNextMonth(prefPostingPeriod);
                log.debug('prefPostingPeriod', prefPostingPeriod)
                log.debug('postingPeriodText', postingPeriodText)
                var dataSearch = []
                // search 
                var vendorbillSearchObj = search.create({
                type: "vendorbill",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                filters:
                [
                    ["type","anyof","VendBill"], 
                    "AND", 
                    ["amortizationschedule.internalid","noneof","@NONE@"], 
                    "AND", 
                    ["internalid","anyof",recId], 
                    "AND", 
                    ["cogs","is","F"], 
                    "AND", 
                    ["mainline","is","F"], 
                    "AND", 
                    ["taxline","is","F"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "line",
                        summary: "GROUP",
                        label: "Line ID"
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "amortizationSchedule",
                        summary: "GROUP",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "amortemplate",
                        join: "amortizationSchedule",
                        summary: "GROUP",
                        label: "Template Name"
                    })
                ]
                });
                var searchResultCount = vendorbillSearchObj.runPaged().count;
                log.debug("vendorbillSearchObj result count",searchResultCount);
                vendorbillSearchObj.run().each(function(result){
                var lineId = result.getValue({
                    name: "line",
                    summary: "GROUP",
                })
                var idAmortSced = result.getValue({
                    name: "internalid",
                    join: "amortizationSchedule",
                    summary: "GROUP",
                });
                var amortTempName = result.getValue({
                    name: "amortemplate",
                    join: "amortizationSchedule",
                    summary: "GROUP",
                });
                dataSearch.push({
                    lineId : lineId,
                    idAmortSced : idAmortSced,
                    amortTempName : amortTempName
                })
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
                log.debug('dataSearch', dataSearch)
                var countLineExpense = recordLoad.getLineCount({
                    sublistId : "expense"
                });
                if(countLineExpense > 0){
                    var paramsArray = [];
                    for(var i = 0; i < countLineExpense; i++){
                        var idLine = recordLoad.getSublistValue({
                            sublistId : 'expense',
                            fieldId : 'line',
                            line : i
                        })
                        log.debug('idLine', idLine)
                        var matched = dataSearch.find(function(d){
                            return d.lineId == idLine; 
                        });

                        if (matched) {
                            var idAmortSced = matched.idAmortSced;
                            log.debug('idAmortSced for line ' + idLine, idAmortSced);
                            var amount = recordLoad.getSublistValue({
                                sublistId : 'expense',
                                fieldId : 'amount',
                                line : i
                            });
                            var cekIdAmortCek = recordLoad.getSublistValue({
                                sublistId : 'expense',
                                fieldId : 'amortizationsched',
                                line : i
                            });
                            log.debug('cekIdAmortCek', cekIdAmortCek)
                            if(cekIdAmortCek){
                                var recTempAmor = record.load({
                                    type: 'amortizationtemplate',
                                    id: cekIdAmortCek,
                                    isDynamic: true,
                                });
                                
                                var account = recTempAmor.getValue('accttarget');
                                var amortPeriod = recTempAmor.getValue('amortizationperiod') || 1; 
                                var periodOffset = recTempAmor.getValue('periodoffset');      
                                var startOffset = recTempAmor.getValue('revrecoffset');        
                                log.debug('amortPeriod', amortPeriod)
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
                                log.debug('endDate', endDate)

                                if(startOffset > 0){
                                    log.debug('startOffset', startOffset)
                                    amortPeriod = Number(amortPeriod) - Number(startOffset)
                                }
                                log.debug('amortPeriod', amortPeriod)
                                var amounttoSet = (Number(amount) / Number(amortPeriod)).toFixed(2);
                                log.debug('amounttoSet', amounttoSet)
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
                                            ["internalid","anyof",idAmortSced]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "recuramount", label: "Amount"})
                                    ]
                                });
                                var searchResultCount = amortizationscheduleSearchObj.runPaged().count;
                                if(searchResultCount < 0 || searchResultCount == null || searchResultCount == ''){
                                    idAmortSced = Number(idAmortSced)
                                }
                                paramsArray.push({
                                    amortizationId: idAmortSced,
                                    amount: amounttoSet,
                                    startDate: startDate,
                                    endDate: endDate,
                                    account: account,
                                    recId: recId,
                                    totalAmount: amount
                                });
                            
                            }
                            
                        }
                    }
                    log.debug('paramsArray', paramsArray)
                    if (paramsArray.length > 0) {
                        var mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_abj_mr_set_amortization',
                            params: {
                                custscript_params_array: JSON.stringify(paramsArray)
                            }
                        });
                        var taskId = mapReduceTask.submit();
                        log.debug('Map/Reduce Task Submitted', taskId);
                    }
                  
                }
                var countLineItem = recordLoad.getLineCount({
                    sublistId : "item"
                });
                log.debug('countLine', countLineItem)
                if(countLineItem > 0){
                    var paramsArray = [];
                    for(var i = 0; i < countLineItem; i++){
                        var idLine = recordLoad.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'line',
                            line : i
                        })
                        log.debug('idLine', idLine)
                        var matched = dataSearch.find(function(d){
                            return d.lineId == idLine; 
                        });

                        if (matched) {
                            var idAmortSced = matched.idAmortSced;
                            log.debug('idAmortSced for line ' + idLine, idAmortSced);
                            var amount = recordLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'amount',
                                line : i
                            });
                            var cekIdAmortCek = recordLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'amortizationsched',
                                line : i
                            });
                            log.debug('amount', amount)
                            if(cekIdAmortCek){
                                var recTempAmor = record.load({
                                    type: 'amortizationtemplate',
                                    id: cekIdAmortCek,
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
                                log.debug('endDate', endDate)

                                if(startOffset > 0){
                                    amortPeriod = Number(amortPeriod) - Number(startOffset)
                                }
                                var amounttoSet = (Number(amount) / Number(amortPeriod)).toFixed(2);
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
                                            ["internalid","anyof",idAmortSced]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "recuramount", label: "Amount"})
                                    ]
                                });
                                var searchResultCount = amortizationscheduleSearchObj.runPaged().count;
                                if(searchResultCount < 0 || searchResultCount == null || searchResultCount == ''){
                                    idAmortSced = Number(idAmortSced)
                                }
                                paramsArray.push({
                                    amortizationId: idAmortSced,
                                    amount: amounttoSet,
                                    startDate: startDate,
                                    endDate: endDate,
                                    account: account,
                                    recId: recId,
                                    totalAmount: amount
                                });
                            }
                        }
                       
                    }
                    log.debug('paramsArray', paramsArray)
                    if (paramsArray.length > 0) {
                        var mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_abj_mr_set_amortization',
                            params: {
                                custscript_params_array: JSON.stringify(paramsArray)
                            }
                        });
                        var taskId = mapReduceTask.submit();
                        log.debug('Map/Reduce Task Submitted', taskId);
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
        afterSubmit: afterSubmit
      };
    });
    