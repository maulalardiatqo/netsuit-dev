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
            if (context.type == context.UserEventType.CREATE) {
    
                var rec = context.newRecord;
    
                var recordTRans = record.load({
                type: rec.type,
                id: rec.id,
                });
                var dateTrans = recordTRans.getValue('trandate');
                log.debug('dateBill', dateTrans);
                var date = new Date(dateTrans);
    
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();
    
                var dayFormatted = day < 10 ? "0" + day : day;
                var monthFormatted = month < 10 ? "0" + month : month;
    
                var formattedDate = dayFormatted + "/" + monthFormatted + "/" + year;
                log.debug('formatdate',formattedDate);
                var lastTwoDigits = year.toString().slice(-2);
                log.debug('lastTwoDigit', lastTwoDigits);
    
                var TransType = recordTRans.getValue('type');
                log.debug('transtype', TransType);
                var textSub
                if(TransType == 'purchord'){
                    textSub= 'PO'
                }else if(TransType == 'journal'){
                    textSub = 'JE'
                }else if(TransType == 'vendpymt'){
                    textSub = 'PYMT'
                }else if(TransType == 'custinvc'){
                    textSub = 'INV'
                }else if(TransType == 'vendcred'){
                    textSub = 'VEND'
                }else if(TransType == 'custcred'){
                    textSub = 'CM'
                }else if(TransType == 'itemrcpt'){
                    textSub = 'IR'
                }else if(TransType == 'deposit'){
                    textSub = 'DEP'
                }else if( TransType == 'salesord'){
                    textSub = 'SO'
                }else if(TransType == 'itemship'){
                    textSub = 'IF'
                }else if(TransType == 'trnfrord'){
                    textSub = 'TO'
                }else if(TransType == 'estimate'){
                    textSub = 'EST'
                }else if(TransType == 'custdep'){
                    textSub = 'CD'
                }else if(TransType == 'check'){
                    textSub ='CHK'
                }
                var formatRunning = textSub + lastTwoDigits + monthFormatted
    
                var searchRunNumb =  search.create({
                    type: 'customrecord_po_numbering',
                    columns: ['internalid', 'custrecord_msa_pon_transactiontype', 'custrecord_msa_pon_prefix', 'custrecord_msa_pon_minimum_digit', 'custrecord_msa_pon_initial_number', 'custrecord_msa_pon_suffix', 'custrecord_msa_pon_last_run', 'custrecord_msa_pon_start_date', 'custrecord_msa_pon_end_date', 'custrecord_mas_pon_sample_format'],
                    filters: [{
                        name: 'custrecord_msa_pon_transactiontype',
                        operator: 'is',
                        values: TransType
                    },{
                        name: 'custrecord_msa_pon_start_date',
                        operator: 'onorbefore',
                        values: formattedDate
                    },{
                        name: 'custrecord_msa_pon_end_date',
                        operator: 'onorafter',
                        values: formattedDate
                    }]
                });
                var searchRunNumbSet = searchRunNumb.run()
                searchRunNumb = searchRunNumbSet.getRange({
                    start: 0,
                    end: 1
                });
                log.debug('searchRunNumb', searchRunNumb);
                log.debug('month', month);
    
                var startDate = new Date(year, month - 1, 1); 
                startDate.setHours(0, 0, 0, 0);
                log.debug('startDate', startDate);
    
                var endDate = new Date(year, month, 0); 
                endDate.setHours(23, 59, 59, 999);
                log.debug('endDate', endDate);
    
                if(searchRunNumb.length > 0){
                    var runNumbRec = searchRunNumb[0];
                    var transactionType = runNumbRec.getValue({
                        name: 'custrecord_msa_pon_transactiontype'
                    });
                    var lastRun = runNumbRec.getValue({
                        name : 'custrecord_msa_pon_last_run'
                    });
                    var minimumDigit = runNumbRec.getValue({
                        name : 'custrecord_msa_pon_minimum_digit'
                    });
                    var internalid = runNumbRec.getValue({
                        name : 'internalid'
                    });
                    log.debug('lastRun', lastRun);
                    log.debug('transactionType', transactionType);
    
                    var runningNumber = ''
                    if(lastRun){
                        if(lastRun === 0){
                            var newLastRun = lastRun + 1;
                            var newDigitPart = '0'.repeat(minimumDigit) + newLastRun.toString();
            
                            runningNumber = formatRunning + newDigitPart
                            log.debug('runningNumber', runningNumber);
                        }else{
                            var lastRunNumber = parseInt(lastRun.substring(formatRunning.length), 10);
                            var newLastRun = lastRunNumber + 1;
                            var newDigitPart = '0'.repeat(minimumDigit - newLastRun.toString().length) + newLastRun.toString();
                            runningNumber = formatRunning + newDigitPart;
                        }
                    }else{
                        var formattedRunningNumber = formatRunning + '0001';
                        var currentDigitCount = formattedRunningNumber.length;
                        var digitsToAdd = minimumDigit - currentDigitCount;
                        for (var i = 0; i < digitsToAdd; i++) {
                            formattedRunningNumber = '0' + formattedRunningNumber;
                        }
                        log.debug('formattedRunningNumber', formattedRunningNumber);
                        runningNumber = formattedRunningNumber;
                        log.debug('runningNumber', runningNumber)
                    }
                    
                    log.debug('runningNumber', runningNumber);
                    var recordBP = record.load({
                        type : 'customrecord_po_numbering',
                        id : internalid,
                        isDynamic : true
                    });
                    recordBP.setValue({
                        fieldId: 'custrecord_msa_pon_last_run',
                        value: runningNumber,
                        ignoreFieldChange: true
                    });
                    recordBP.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    
                    log.debug('runBefSet', runningNumber);
                    recordTRans.setValue({
                        fieldId : 'tranid',
                        value : runningNumber,
                        ignoreFieldChange: true
                    });
                    var saveRecordTrans = recordTRans.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRecordTrans', saveRecordTrans);
                }else{
                    var createRecord = record.create({
                        type: 'customrecord_po_numbering',
                        isDynamic: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_msa_pon_last_run',
                        value: formatRunning + '0001', 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_msa_pon_transactiontype',
                        value: TransType, 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_msa_pon_minimum_digit',
                        value: 4, 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_msa_pon_start_date',
                        value: startDate, 
                        ignoreFieldChange: true
                    });
                    createRecord.setValue({
                        fieldId: 'custrecord_msa_pon_end_date',
                        value: endDate, 
                        ignoreFieldChange: true
                    });
                    var saveRun = createRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    if(saveRun){
                        log.debug('masukSave');
                        recordTRans.setValue({
                            fieldId : 'tranid',
                            value : formatRunning + '0001',
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
    
        } catch (e) {
            err_messages = 'error in after submit ' + e.name + ': ' + e.message;
            log.debug(err_messages);
        }
    }
    
    return {
        afterSubmit: afterSubmit,
    };
    });