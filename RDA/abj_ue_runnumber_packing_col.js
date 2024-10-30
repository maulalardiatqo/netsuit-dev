/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
    
                var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var dateTrans = recordTRans.getValue('trandate');
                var date = new Date(dateTrans);
                var yearFull = date.getFullYear();
                log.debug('yearFull', yearFull)
                var year = date.getFullYear().toString().slice(-2);
                log.debug('year', year)
                var TransType = recordTRans.getValue('type');
                log.debug('TransType', TransType)
                var textSub
                if(TransType == 'custom108'){
                    textSub = 'PL'
                }else{
                    textSub = 'SJP'
                }
                var formatRunning = textSub + year;
                log.debug('formatRunning', formatRunning)

                var customrecord_runnumber_packingSearchObj = search.create({
                    type: "customrecord_runnumber_packing",
                    filters:
                    [
                        ["custrecord_trans_type","is",TransType], 
                        "AND", 
                        ["custrecord_year","is",yearFull]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custrecord_trans_type", label: "Transaction Type"}),
                        search.createColumn({name: "custrecord_prefix", label: "Prefix"}),
                        search.createColumn({name: "custrecord_initial_number", label: "Initial Number"}),
                        search.createColumn({name: "custrecord_suffix", label: "Suffix"}),
                        search.createColumn({name: "custrecord_last_run_numb", label: "Last Running Number"}),
                        search.createColumn({name: "custrecord_sample_format", label: "Sample Format"})
                    ]
                });
                var searchResults = customrecord_runnumber_packingSearchObj.run().getRange({ start: 0, end: 1 });
                if (searchResults.length > 0) {
                    var idSearch = searchResults[0].getValue("internalid");
                    var transTypeSearch = searchResults[0].getValue("custrecord_trans_type");
                    var lastRunSearch = searchResults[0].getValue("custrecord_last_run_numb");
                    var extractedNumber = lastRunSearch.replace(formatRunning, '');
                    log.debug('extractedNumber', extractedNumber);
                    
                    var newNumber = (parseInt(extractedNumber, 10) + 1).toString().padStart(extractedNumber.length, '0');
                    log.debug('newNumber', newNumber);
                    
                    var newRunnumber = formatRunning + newNumber;
                    log.debug('newRunnumber', newRunnumber); 
                    
                    // save record runnumber
                    var recordBP = record.load({
                        type: 'customrecord_runnumber_packing',
                        id: idSearch,
                        isDynamic: true
                    });
                    recordBP.setValue({
                        fieldId: 'custrecord_last_run_numb',
                        value: newRunnumber,
                        ignoreFieldChange: true
                    });
                    recordBP.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    // set and save in transacrtion
                    recordTRans.setValue({
                        fieldId : 'tranid',
                        value : newRunnumber,
                        ignoreFieldChange: true
                    });
                    var saveRecordTrans = recordTRans.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRecordTrans', saveRecordTrans);
                }else{
                    var createRecord = record.create({
                        type: 'customrecord_runnumber_packing',
                        isDynamic: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_trans_type',
                        value: TransType, 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_year',
                        value: yearFull, 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_last_run_numb',
                        value: formatRunning + '0000001', 
                        ignoreFieldChange: true
                    });
                    var saveRun = createRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRun', saveRun);
                    if(saveRun){
                        log.debug('formatRunning in saveRun', formatRunning)
                        recordTRans.setValue({
                            fieldId : 'tranid',
                            value : formatRunning + '0000001',
                            ignoreFieldChange: true
                        });
                        var savetrans = recordTRans.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        log.debug('saveTrans', savetrans);
                    }
                }

            }
        }catch(e){
            log.debug('err', e)
        }
    }
    
    return {
        afterSubmit: afterSubmit,
    };
});