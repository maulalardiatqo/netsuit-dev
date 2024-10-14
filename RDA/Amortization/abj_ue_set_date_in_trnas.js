/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format", "N/task"], function (record, search, format, task) {
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
                log.debug('postingPeriod', postingPeriod);
                var postingPeriodText = recordLoad.getText('postingperiod');
                log.debug('postingPeriodText', postingPeriodText)
                var countLineExpense = recordLoad.getLineCount({
                    sublistId : "expense"
                });
                log.debug('countLineExpense', countLineExpense)
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
                        log.debug('amount', amount)
                        log.debug('idLine', idLine)
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
                        log.debug("vendorbillSearchObj result count",searchResultCount);
                        vendorbillSearchObj.run().each(function(result){
                            var tempAmort = result.getValue({
                                name: "amortemplate",
                                join: "amortizationSchedule",
                            });
                            if(tempAmort){
                                idAmortTemp = tempAmort
                            }
                            log.debug('tempAmort', tempAmort)
                            var schedAmort = result.getValue({
                                name: "internalid",
                                join: "amortizationSchedule",
                            });
                            log.debug('schedAmort', schedAmort)
                            if(schedAmort){
                                if(context.type === context.UserEventType.CREATE){
                                    log.debug('masuk create')
                                    idAmortSched = Number(schedAmort) + Number(1)
                                }else{
                                    idAmortSched = schedAmort
                                }
                                
                            }
                            return true;
                        });
                       
                        if(idAmortTemp){
                            log.debug('idAmortTemp', idAmortTemp)
                            var recTempAmor = record.load({
                                type: 'amortizationtemplate',
                                id: idAmortTemp,
                                isDynamic: true,
                            });
                            
                            var account = recTempAmor.getValue('accttarget');
                            
                            // Function to extract month and year from posting period text
                            function getMonthYearFromText(postingPeriodText) {
                                const parts = postingPeriodText.split(' '); 
                                const monthText = parts[1]; 
                                const year = parseInt(parts[2]);
                            
                                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                const month = months.indexOf(monthText) + 1;
                            
                                log.debug(`Month: ${month}, Year: ${year}`);
                            
                                return { month, year };
                            }
                            
                            // Function to add months to a given month/year
                            function addMonths(month, year, monthsToAdd) {
                                let newMonth = month + monthsToAdd; 
                                let newYear = year;
                            
                                while (newMonth > 12) {
                                    newMonth -= 12;
                                    newYear++;
                                }
                            
                                log.debug(`New Month after adding: ${newMonth}, New Year: ${newYear}`);
                            
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
                            
                            var amortPeriod = recTempAmor.getValue('amortizationperiod'); 
                            var periodOffset = recTempAmor.getValue('periodoffset');      
                            var startOffset = recTempAmor.getValue('revrecoffset');        
                            
                            
                            const { dateAwal, dateAhir } = getAmortizationDates(postingPeriodText, amortPeriod, periodOffset, startOffset);
                            
                            log.debug('dateAwal', dateAwal); 
                            log.debug('dateAhir', dateAhir);  
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

                            function convertToDate(dateString) {
                                var dateParts = dateString.split('/');
                                return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
                            }
                            
                            var startDate = convertToDate(result.lastDate);
                            var endDate = convertToDate(result.endDate);

                            log.debug('startDate', startDate);
                            log.debug('endDate', endDate);
                            if(startOffset > 0){
                                amortPeriod = Number(amortPeriod) - Number(startOffset)
                            }
                            var amounttoSet = Number(amount) / Number(amortPeriod)
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
                            log.debug('Parameters Sent to Map/Reduce', {
                                custscript_amortization_id: idAmortSched,
                                custscript_recamount: amounttoSet,
                                custscript_startdate: startDate,
                                custscript_enddate: endDate
                            });
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
                            log.debug("amortizationscheduleSearchObj result count",searchResultCount);
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
                    var saveRec = recordLoad.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveRec', saveRec)
                }
                // var countLineItem = recordLoad.getLineCount({
                //     sublistId : "item"
                // });
                // log.debug('countLine', countLine)
                // if(countLineItem > 0){
                //     for(var i = 0; i < countLine; i++){
                //         recordLoad.selectLine({
                //             sublistId : "item",
                //             line : i
                //         })
                //         recordLoad.setCurrentSublistValue({
                //             sublistId : 'item',
                //             fieldId : 'rate',
                //             line : i,
                //             value : 0
                //         });
                //         recordLoad.setCurrentSublistValue({
                //             sublistId : 'item',
                //             fieldId : 'taxcode',
                //             line : i,
                //             value : 5
                //         });
                        
                //         recordLoad.commitLine("item")
                //     }
                //     var saveRec = recordLoad.save({
                //         enableSourcing: true,
                //         ignoreMandatoryFields: true,
                //     });
                //     log.debug('saveRec', saveRec)
                // }
                // var mapReduceTask = task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_your_mapreduce_script', 
                //     deploymentId: 'customdeploy_your_mapreduce_script',
                //     params: {
                //         custscript_amortization_id: amortizationScheduleId,
                //         custscript_recamount: recAmount,
                //         custscript_postingperiod: postingPeriod
                //     }
                // });
            }catch(e){
                log.debug('error', e)
            }
        }
        
    }
    return {
        afterSubmit: afterSubmit,
      };
    });
    