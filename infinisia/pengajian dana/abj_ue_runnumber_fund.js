/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE) {
                function formatToDDMMYYYY(dateValue) {
                    var d = new Date(dateValue);
                    var day = d.getDate().toString().padStart(2, '0');
                    var month = (d.getMonth() + 1).toString().padStart(2, '0');
                    var year = d.getFullYear();
                    return day + '/' + month + '/' + year;
                }

                function getStartOfMonth(dateValue) {
                    return new Date(dateValue.getFullYear(), dateValue.getMonth(), 1);
                }

                function getEndOfMonth(dateValue) {
                    return new Date(dateValue.getFullYear(), dateValue.getMonth() + 1, 0);
                }


                var rec = context.newRecord;
                var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var date = recordTRans.getValue('custrecord_fund_date');
                log.debug('date', date);
                var d = new Date(date);
                var year = d.getFullYear().toString().slice(-2);
                var month = (d.getMonth() + 1).toString().padStart(2, '0');
                var formatDateYYMM = year + month;

                log.debug('formatDateYYMM', formatDateYYMM);
                var prefix = 'FR';
                var firstFormat = prefix + formatDateYYMM
                log.debug('firstFormat', firstFormat)

                var startDate = getStartOfMonth(date);
                var endDate = getEndOfMonth(date);                     

                var startDateString = formatToDDMMYYYY(startDate);
                var endDateString = formatToDDMMYYYY(endDate);
                var customrecord_runnumber_fundSearchObj = search.create({
                type: "customrecord_runnumber_fund",
                filters:
                [
                    ["custrecord_r_f_start_date","on",startDateString], 
                    "AND", 
                    ["custrecord_r_f_end_date","on",endDateString]
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internal Id"}),
                    search.createColumn({name: "custrecord_r_f_prefix", label: "Prefix"}),
                    search.createColumn({name: "custrecord_r_f_minimum_digit", label: "Minimum Digit"}),
                    search.createColumn({name: "custrecord_r_f_start_date", label: "Start Date"}),
                    search.createColumn({name: "custrecord_r_f_end_date", label: "End Date"}),
                    search.createColumn({name: "custrecord_r_f_last_running", label: "Last Running"}),
                    search.createColumn({name: "custrecord_r_f_last_number", label: "Last Number"})
                ]
                });
                var results = customrecord_runnumber_fundSearchObj.run().getRange({ start: 0, end: 1 });
                if (results && results.length > 0) {
                    var lastRun = results[0].getValue('custrecord_r_f_last_running');
                    var lastNumb = results[0].getValue('custrecord_r_f_last_number');
                    var minDigit = results[0].getValue('custrecord_r_f_minimum_digit');
                    var idRunning = results[0].getValue('internalid');
                    log.debug("Last Running", lastRun);
                    log.debug('lastNumb', lastNumb)
                    var newNumber = Number(lastNumb) + 1;  
                    var paddedNumber = newNumber.toString().padStart(minDigit, '0');

                    var newRunning = firstFormat + paddedNumber;

                    var recNumber = record.load({
                        type : 'customrecord_runnumber_fund',
                        id : idRunning
                    })
                    recNumber.setValue({
                        fieldId : 'custrecord_r_f_last_running',
                        value : newRunning
                    })
                    recNumber.setValue({
                        fieldId : 'custrecord_r_f_last_number',
                        value : newNumber
                    })
                    var saveRec = recNumber.save();
                    if(saveRec){
                        recordTRans.setValue({
                            fieldId : 'custrecord_fund_docnumb',
                            value : newRunning
                        })
                    }
                }else{
                    var lastNumber = '0001'
                    var lastRunningNumber = firstFormat + lastNumber
                    var createRunnumber = record.create({
                        type : 'customrecord_runnumber_fund'
                    });
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_prefix',
                        value : prefix
                    })
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_minimum_digit',
                        value : '4'
                    })
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_start_date',
                        value : startDate
                    })
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_end_date',
                        value : endDate
                    })
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_last_running',
                        value : lastRunningNumber
                    })
                    createRunnumber.setValue({
                        fieldId : 'custrecord_r_f_last_number',
                        value : lastNumber
                    })
                    createRunnumber.save()
                    recordTRans.setValue({
                        fieldId : 'custrecord_fund_docnumb',
                        value : lastRunningNumber
                    })
                }
                recordTRans.save();
                
            }
        }catch(e){
                log.debug('error', e)
        }
    }
    return{
        afterSubmit
    }
});