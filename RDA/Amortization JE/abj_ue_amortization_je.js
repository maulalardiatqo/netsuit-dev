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
                var recType = rec.type
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

                var dataLine = [];
                var journalentrySearchObj = search.create({
                    type: "journalentry",
                    settings: [
                        { name: "consolidationtype", value: "ACCTTYPE" },
                        { name: "includeperiodendtransactions", value: "F" }
                    ],
                    filters: [
                        ["type", "anyof", "Journal"],
                        "AND",
                        ["internalid", "anyof", recId], 
                        "AND",
                        ["isrevrectransaction", "is", "T"],
                        "AND",
                        ["amortizationschedule.internalid", "noneof", "@NONE@"]
                    ],
                    columns: [
                        search.createColumn({ name: "lineuniquekey", label: "Line Unique Key" }),
                        search.createColumn({ name: "isrevrectransaction", label: "Is Amortization/Revenue Recognition" }),
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

                var searchResultCount = journalentrySearchObj.runPaged().count;
                log.debug("journalentrySearchObj result count", searchResultCount);

                journalentrySearchObj.run().each(function(result) {
                    var lineKey = result.getValue({ name: "lineuniquekey" });
                    var idAmortTemp = "";
                    var idAmortSched = "";
                    var tempAmort = result.getValue({
                        name: "amortemplate",
                        join: "amortizationSchedule",
                    });
                    log.debug('tempAmort', tempAmort);

                    if (tempAmort) {
                        idAmortTemp = tempAmort;
                    }
                    log.debug('idAmortTemp', idAmortTemp);

                    var schedAmort = result.getValue({
                        name: "internalid",
                        join: "amortizationSchedule",
                    });
                    log.debug('schedAmort', schedAmort);

                    if (schedAmort) {
                        if (context.type === context.UserEventType.CREATE) {
                            log.debug('masuk create');
                            idAmortSched = Number(schedAmort) + 1;
                        } else {
                            idAmortSched = schedAmort;
                        }
                    }
                    dataLine.push({
                        lineKey: lineKey,
                        idAmortTemp: idAmortTemp,
                        idAmortSched: idAmortSched
                    });

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
                    sublistId : "line"
                });
                var dataForMR = [];

                if (countLineExpense > 0) {
                    for (var i = 0; i < countLineExpense; i++) {
                        var idLine = recordLoad.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'lineuniquekey',
                            line: i
                        });
                        var amount = recordLoad.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            line: i
                        });
                        var cekIdAmortCek = recordLoad.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'schedule',
                            line: i
                        });
                        log.debug('cekIdAmortCek', cekIdAmortCek)
                        var matchLine = dataLine.find(function (line) {
                            return line.lineKey == idLine;
                        });

                        if (matchLine) {
                            var idAmortTemp = matchLine.idAmortTemp;
                            var idAmortSched = matchLine.idAmortSched;

                            if (idAmortTemp) {
                                var recTempAmor = record.load({
                                    type: 'amortizationtemplate',
                                    id: idAmortTemp,
                                    isDynamic: true,
                                });

                                var account = recTempAmor.getValue('accttarget');
                                var amortPeriod = recTempAmor.getValue('amortizationperiod') || 1;
                                var periodOffset = recTempAmor.getValue('periodoffset');
                                var startOffset = recTempAmor.getValue('revrecoffset');

                                const { dateAwal, dateAhir } = getAmortizationDates(postingPeriodText, amortPeriod, periodOffset, startOffset);

                                var startDate = convertToDate(dateAwal);
                                var endDate = convertToDate(dateAhir);

                                if (startOffset > 0) {
                                    amortPeriod = Number(amortPeriod) - Number(startOffset);
                                }

                                var amounttoSet = (Number(amount) / Number(amortPeriod)).toFixed(2);
                                dataForMR.push({
                                    idAmortSched: idAmortSched,
                                    amounttoSet: amounttoSet,
                                    startDate: startDate,
                                    endDate: endDate,
                                    account: account,
                                    recId: recId,
                                    amount: amount
                                });

                                recordLoad.selectLine({
                                    sublistId: "line",
                                    line: i
                                });
                                recordLoad.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'startdate',
                                    value: startDate
                                });
                                recordLoad.setCurrentSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'enddate',
                                    value: endDate
                                });
                                recordLoad.commitLine("line");
                            }
                        }
                    }

                    if (dataForMR.length > 0) {
                        log.debug('Sending to MR:', JSON.stringify(dataForMR));
                        var mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_abj_mr_set_amortization_je',
                            deploymentId: 'customdeploy_abj_mr_set_amortization_je',
                            params: {
                                custscript_json_payload: JSON.stringify(dataForMR)
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
    