/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search'], function(record, runtime, search) {

    function getInputData(context) {
        var currentScript = runtime.getCurrentScript();
        
        var startDate = currentScript.getParameter({ name: 'custscript_startdate' });
        var endDate = currentScript.getParameter({ name: 'custscript_enddate' });
        var amortizationId = currentScript.getParameter({ name: 'custscript_amortization_id' });
        var amount = currentScript.getParameter({ name: 'custscript_recamount' });
        var account = currentScript.getParameter({ name: 'custscript_account' });
        var recId = currentScript.getParameter({ name: 'custscript_id_trans' });


        log.debug('Input Parameters:', {
            startDate: startDate,
            endDate: endDate,
            amortizationId: amortizationId,
            amount: amount,
            account : account,
            recId : recId
        });

        return [
            {
                amortizationId: amortizationId,
                startDate: startDate,
                endDate: endDate,
                amount: amount,
                account : account,
                recId : recId
            }
        ];
    }

    function map(context) {
        var data = JSON.parse(context.value); 
        log.debug('data', data)
        var startDate = data.startDate;
        var endDate = data.endDate;
        var amortizationId = data.amortizationId;
        var amount = data.amount;
        var account = data.account;
        var recId = data.recId;
        log.debug('startDate', startDate)
        log.debug('endDate', endDate)
        var vendorbillSearchObj = search.create({
            type: "vendorbill",
            settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
            filters:
            [
                ["type","anyof","VendBill"], 
                "AND", 
                ["amortizationschedule.internalid","noneof","@NONE@"], 
                "AND", 
                ["internalid","anyof",recId]
            ],
            columns:
            [
                search.createColumn({
                    name: "internalid",
                    join: "amortizationSchedule",
                    label: "Internal ID"
                })
            ]
        });
        var searchResultCount = vendorbillSearchObj.runPaged().count;
        log.debug("vendorbillSearchObj result count",searchResultCount);
        vendorbillSearchObj.run().each(function(result){
            var amortId = result.getValue({
                name: "internalid",
                join: "amortizationSchedule",
            })
            if(amortId){
                amortizationId = amortId
            }
            return false;
        });

        function getEndOfMonthRange(startDate, endDate) {
            const parseDate = (dateStr) => {
                const parts = dateStr.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
        
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            const endOfMonthDates = [];
        
            let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
        
            while (currentDate <= end) {
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                endOfMonthDates.push(`${endOfMonth.getDate().toString().padStart(2, '0')}/${(endOfMonth.getMonth() + 1).toString().padStart(2, '0')}/${endOfMonth.getFullYear()}`);
        
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        
            return endOfMonthDates;
        }
        
        function formatDates(datesArray) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const formattedDates = [];
        
            datesArray.forEach(date => {
                const [day, month, year] = date.split('/');
                formattedDates.push(`${day} ${monthNames[Number(month) - 1]} ${year}`);
            });
        
            return formattedDates;
        }
        
        const endOfMonthDates = getEndOfMonthRange(startDate, endDate);
        log.debug('endOfMonthDates', endOfMonthDates)
        const formattedDates = formatDates(endOfMonthDates);
        log.debug('formattedDates', formattedDates)

        try {
            log.debug('amortizationId', )
            var amortizationScheduleRec = record.load({
                type: 'revRecSchedule',
                id: amortizationId,
                isDynamic: true
            });

            var lineCount = amortizationScheduleRec.getLineCount({ sublistId: 'recurrence' });
            log.debug('lineCount', lineCount)
            for (var i = lineCount - 1; i >= 0; i--) {
                log.debug('masuk loopingan', i)
                amortizationScheduleRec.selectLine({
                    sublistId: 'recurrence',
                    line: i
                });
                amortizationScheduleRec.removeLine({
                    sublistId: 'recurrence',
                    line: i,
                    ignoreRecalc: true
                });
            }
            var forSave = false
            formattedDates.forEach(formattedDate => {
                log.debug('formattedDate', formattedDate)
                var idPeriod
                var accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters:
                    [
                        ["periodname","is",formattedDate]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                });
                var searchResultCount = accountingperiodSearchObj.runPaged().count;
                log.debug("accountingperiodSearchObj result count",searchResultCount);
                accountingperiodSearchObj.run().each(function(result){
                    var period = result.getValue({
                        name: "internalid"
                    })
                    if(period){
                        idPeriod = period
                    }
                    return false;
                });
                log.debug('idPeriod', idPeriod)
                if(idPeriod){
                    forSave = true
                    log.debug('idPeriod', idPeriod)
                    log.debug('data to set', {idPeriod : idPeriod, account: account, amount : amount})
                    amortizationScheduleRec.selectNewLine({ sublistId: 'recurrence' });
                    amortizationScheduleRec.setCurrentSublistValue({
                        sublistId: 'recurrence',
                        fieldId: 'defrevaccount',
                        value: account
                    });
                    amortizationScheduleRec.setCurrentSublistValue({
                        sublistId: 'recurrence',
                        fieldId: 'postingperiod',
                        value: idPeriod
                    });
                    amortizationScheduleRec.setCurrentSublistValue({
                        sublistId: 'recurrence',
                        fieldId: 'recamount',
                        value: amount
                    });
                    amortizationScheduleRec.commitLine({ sublistId: 'recurrence' });
                }
               
            });
            if(forSave){
                var saveAmor = amortizationScheduleRec.save()
                log.debug('saveAmor', saveAmor)
            }
            
        } catch (e) {
           log.debug('error', e)
        }
    }

    function summarize(summary) {
        summary.mapSummary.errors.iterator().each(function(key, error, executionNo) {
            log.error({
                title: 'Error with key: ' + key + ', execution number: ' + executionNo,
                details: error
            });
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
