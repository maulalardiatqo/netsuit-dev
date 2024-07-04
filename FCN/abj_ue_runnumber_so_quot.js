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
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var TransType = recordLoad.getValue("type");
                log.debug('transType', TransType)
                var dateTrans = recordLoad.getValue("trandate");
                var date = new Date(dateTrans);

                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();
                log.debug("month", month);
                log.debug("Year", year);
                var dayFormatted = day < 10 ? "0" + day : day;
               
                var monthFormatted = month < 10 ? "0" + month : month;
                var lastTwoDigits = year.toString().slice(-2);
                var formattedDate = dayFormatted + "/" + monthFormatted + "/" + year;

                var cForm = recordLoad.getValue('customform');
                var cekTitle = recordLoad.getValue('title');
                var titleSo = recordLoad.getValue("custbody_abj_sales_order_title");
                var subsidiary = recordLoad.getValue("subsidiary");
                var subsidiaryName
                if(subsidiary){
                    subsidiaryName = record.load({type: "subsidiary", id: subsidiary}).getValue("name");
                }
                var textSub;
                var firstFormat;

                if (TransType == "estimate") {
                    textSub = "EST"
                }else if(TransType  == "salesord"){
                    textSub = "ORDER"
                }
                firstFormat = subsidiaryName + " " + textSub + lastTwoDigits + monthFormatted;
                var formatForCustRecord = lastTwoDigits + monthFormatted
                var startDate = new Date(year, month - 1, 1);
                startDate.setHours(0, 0, 0, 0);
                log.debug("startDate", startDate);
        
                var endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                log.debug("endDate", endDate);
                log.debug('formattedDate', formattedDate);
                log.debug('TransType', TransType)
                var searchRunNumb = search.create({
                    type: "customrecord_transactopn_number",
                    columns: ["internalid", "custrecord_abj_transaction_type","custrecord_abj_prefix", "custrecord_abj_minimum_digit", "custrecord_abj_initial_number", "custrecord_abj_suffix", "custrecord_abj_last_running_number", "custrecord_abj_start_date", "custrecord_abj_end_date" ],
                    filters: [
                        {
                            name: "custrecord_abj_transaction_type",
                            operator: "is",
                            values: TransType,
                        },
                        {
                            name: "custrecord_abj_start_date",
                            operator: "onorbefore",
                            values: formattedDate,
                        },
                        {
                            name: "custrecord_abj_end_date",
                            operator: "onorafter",
                            values: formattedDate,
                        },
                    ],
                });
                var searchRunNumbSet = searchRunNumb.run();
                searchRunNumb = searchRunNumbSet.getRange({
                    start: 0,
                    end: 1,
                });

                if(searchRunNumb.length > 0){
                    var runNumbRec = searchRunNumb[0];
                    var transactionType = runNumbRec.getValue({
                        name: "custrecord_abj_transaction_type",
                    });
                    var lastRun = runNumbRec.getValue({
                        name: "custrecord_abj_last_running_number",
                    });
                    var minimumDigit = runNumbRec.getValue({
                        name: "custrecord_msa_pon_minimum_digit",
                    });
                    var internalid = runNumbRec.getValue({
                        name: "internalid",
                    });
                    log.debug('lastRun', lastRun)
                    var setSavedSearchRunNumber = Number(lastRun) + 1
                    log.debug("setSavedSearchRunNumber", setSavedSearchRunNumber)
                    var formatSavedSearchNumber 
                    if (TransType == "estimate") {
                        if(cForm == 143 || cForm == 150){
                            log.debug('correct form');
                            if(cekTitle && cekTitle != ''){
                                formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber + " - " + cekTitle
                            }else{
                                formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber
                            }
                        }else{
                            formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber
                        }
                    }else if(TransType == "salesord"){
                        log.debug('titleSo', titleSo)
                        if(cForm == 151 || cForm == 105){
                            log.debug('correct form');
                            if(titleSo && titleSo != ''){
                                formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber + " - " + titleSo
                            }else{
                                formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber
                            }
                        }else{
                            formatSavedSearchNumber = subsidiaryName + " " + textSub + setSavedSearchRunNumber
                        }
                    }
                    log.debug("formatSavedSearchNumber", formatSavedSearchNumber)

                    var loadCustRecord = record.load({
                        type: "customrecord_transactopn_number",
                        id: internalid,
                        isDynamic: true,
                    });
                    loadCustRecord.setValue({
                        fieldId: "custrecord_abj_last_running_number",
                        value: setSavedSearchRunNumber,
                        ignoreFieldChange: true,
                    });
                    loadCustRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    recordLoad.setValue({
                        fieldId: "tranid",
                        value: formatSavedSearchNumber,
                        ignoreFieldChange: true,
                    });
                    var savetrans = recordLoad.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug("saveTrans", savetrans);
                    
                }else{
                    if (TransType == "estimate") {
                        var formatRunningNumber
                        if(cForm == 143 || cForm == 150){
                            log.debug('correct form');
                            if(cekTitle && cekTitle != ''){
                                formatRunningNumber = firstFormat  + '001' + "-" + cekTitle;
                            }else{
                                formatRunningNumber = firstFormat  + '001';
                            }
                        }else{
                            formatRunningNumber = firstFormat  + '001'
                        }
                    }else if(TransType == "salesord"){
                        log.debug("masuk sini")
                        if(cForm == 151 || cForm == 105){
                            log.debug('correct form');
                            if(titleSo && titleSo != ''){
                                formatRunningNumber = firstFormat  + '001' + "-" + titleSo;
                            }else{
                                formatRunningNumber = firstFormat  + '001';
                            }
                        }else{
                            formatRunningNumber = firstFormat  + '001'
                        }
                    }

                    var createRecord = record.create({
                        type: "customrecord_transactopn_number",
                        isDynamic: true,
                    });
                    createRecord.setValue({
                        fieldId: "custrecord_abj_last_running_number",
                        value: formatForCustRecord + "001",
                        ignoreFieldChange: true,
                    });
                    createRecord.setValue({
                        fieldId: "custrecord_abj_transaction_type",
                        value: TransType,
                        ignoreFieldChange: true,
                    });
                    createRecord.setValue({
                        fieldId: "custrecord_abj_minimum_digit",
                        value: 4,
                        ignoreFieldChange: true,
                    });
                    createRecord.setValue({
                        fieldId: "custrecord_abj_start_date",
                        value: startDate,
                        ignoreFieldChange: true,
                    });
                    createRecord.setValue({
                        fieldId: "custrecord_abj_end_date",
                        value: endDate,
                        ignoreFieldChange: true,
                    });
                    var saveRun = createRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveRun', saveRun)
                    if (saveRun) {
                        log.debug("formatRunningNumber before save", formatRunningNumber);
                        recordLoad.setValue({
                            fieldId: "tranid",
                            value: formatRunningNumber,
                            ignoreFieldChange: true,
                        });
                        var savetrans = recordLoad.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        });
                        log.debug("saveTrans", savetrans);
                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});