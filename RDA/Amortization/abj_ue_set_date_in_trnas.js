/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format"], function (record, search, format) {
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
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                            filters:
                            [
                                ["amortizationschedule.internalid","noneof","@NONE@"], 
                                "AND", 
                                ["recordtype","is",recType], 
                                "AND", 
                                ["internalid","anyof",recId], 
                                "AND", 
                                ["line","equalto",idLine]
                            ],
                            columns:
                            [
                                search.createColumn({name: "recordtype", label: "Record Type"}),
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "internalid",
                                    join: "amortizationSchedule",
                                    label: "Internal ID"
                                }),
                                search.createColumn({
                                    name: "amortemplate",
                                    join: "amortizationSchedule",
                                    label: "Template Name"
                                }),
                                search.createColumn({name: "account", label: "Account"}),
                                search.createColumn({name: "line", label: "Line ID"})
                            ]
                        });
                        var searchResultCount = transactionSearchObj.runPaged().count;
                        log.debug("transactionSearchObj result count",searchResultCount);
                        transactionSearchObj.run().each(function(result){
                            var tempAmort = result.getValue({
                                name: "amortemplate",
                                join: "amortizationSchedule",
                            });
                            if(tempAmort){
                                idAmortTemp = tempAmort
                            }
                            log.debug('tempAmort', tempAmort)
                            return true;
                        });
                        if(idAmortTemp){
                            log.debug('idAmortTemp', idAmortTemp)
                            var recTempAmor = record.load({
                                type: 'amortizationtemplate',
                                id: idAmortTemp,
                                isDynamic: true,
                            })
                            var amortPeriod = recTempAmor.getValue('amortizationperiod');
                            log.debug('amortPeriod', amortPeriod)
                            var amounttoSet = Number(amount) / Number(amortPeriod);
                            log.debug('amounttoSet', amounttoSet)

                           // Mengambil bagian-bagian dari postingPeriodText
                            var parts = postingPeriodText.split(' ');
                            var month = parts[1];
                            var year = parts[2];

                            // Mendapatkan tanggal terakhir dari bulan
                            var lastDateOfMonth = new Date(year, new Date(Date.parse(month + " 1")).getUTCMonth() + 1, 0);

                            // Format tanggal ke dd/mm/yyyy
                            var lastDateFormatted = ('0' + lastDateOfMonth.getUTCDate()).slice(-2) + '/' +
                                                    ('0' + (lastDateOfMonth.getMonth() + 1)).slice(-2) + '/' +
                                                    lastDateOfMonth.getUTCFullYear();
                            log.debug('lastDateFormatted', lastDateFormatted);

                            // Tambahkan amortPeriod ke bulan untuk mendapatkan endDate
                            var endDate = new Date(lastDateOfMonth);
                            endDate.setMonth(endDate.getUTCMonth() + amortPeriod);

                            // Format endDate ke dd/mm/yyyy
                            var endDateFormatted = ('0' + endDate.getUTCDate()).slice(-2) + '/' +
                                                    ('0' + (endDate.getMonth() + 1)).slice(-2) + '/' +
                                                    endDate.getUTCFullYear();
                            log.debug('endDateFormatted', endDateFormatted);

                            // Fungsi untuk mendapatkan tanggal sistem
                            function sysDate(lastDateFormatted, endDateFormatted) {
                                var date = new Date();
                                var tdate = date.getUTCDate();
                                var month = date.getUTCMonth() + 1;
                                var year = date.getUTCFullYear();
                                log.debug("tdate month year", tdate + '/' + month + '/' + year);

                                log.debug("lastDateFormatted", lastDateFormatted);
                                log.debug("endDateFormatted", endDateFormatted);
                                
                                return {
                                    lastDate: lastDateFormatted,
                                    endDate: endDateFormatted
                                };
                            }

                            var result = sysDate(lastDateFormatted, endDateFormatted);

                            // Memecah lastDateFormatted menjadi bagian tanggal, bulan, dan tahun
                            var lastDateParts = result.lastDate.split('/');
                            var lastDate = new Date(lastDateParts[2], lastDateParts[1] - 1, lastDateParts[0]);

                            // Memecah endDateFormatted menjadi bagian tanggal, bulan, dan tahun
                            var endDateParts = result.endDate.split('/');
                            var endDateFor = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

                            // Format objek Date menjadi format yang diinginkan
                            function convertToDate(dateString) {
                                var dateParts = dateString.split('/');
                                return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); // Year, Month (0-indexed), Day
                            }
                            
                            var startDate = convertToDate(result.lastDate);
                            var endDate = convertToDate(result.endDate);

                            log.debug('startDate', startDate);
                            log.debug('endDate', endDate);

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
    