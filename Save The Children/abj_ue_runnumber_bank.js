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
            log.debug('context.type', context.type)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.PAYBILLS) {
                log.debug('triggerred')
                function formatDateToDDMMYYYY(dateStr) {
                    var date = new Date(dateStr);

                    var day = String(date.getUTCDate()).padStart(2, '0');       
                    var month = String(date.getUTCMonth() + 1).padStart(2, '0'); 
                    var year = date.getUTCFullYear();              

                    return `${day}/${month}/${year}`;
                }
                function getMonthRange(date) {
                    if (!(date instanceof Date)) {
                        date = new Date(date);
                    }

                    var startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 7, 0, 0));
                    var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0);
                    log.debug('data date', {
                        startDate : startDate,
                        endDate : endDate
                        
                    })
                    return {
                        startDate: startDate, 
                        endDate: endDate      
                    };
                }

                function getYearMonthCode(date) {
                    if (!(date instanceof Date)) {
                        date = new Date(date);
                    }

                    var year = date.getUTCFullYear().toString().slice(-2);
                    var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');

                    return year + month; 
                }
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var TransType = recordLoad.getValue("ntype");
                log.debug('transType', TransType)
                if(TransType){
                    var searchSetup = search.load({
                        id : "customsearch_setup_bank"
                    });
                    searchSetup.filters.push(search.createFilter({name: "custrecord_transaction_type", operator: search.Operator.ANYOF, values: TransType}));
                    var searchSetupSet = searchSetup.run();
                    var result = searchSetupSet.getRange(0, 1);
                    log.debug('result', result.length)
                    if(result.length > 0){
                        var searchRec = result[0];
                        var category = searchRec.getValue({
                            name: "custrecord_category_bank"
                        })
                        var firstCode = searchRec.getValue({
                            name: "custrecord_prefix_code"
                        })
                        var digit = searchRec.getValue({
                            name: "custrecord_jumlah_digit"
                        })
                        log.debug('data setup', {category : category, firstCode : firstCode, digit : digit})
                        var costCenter = recordLoad.getValue("department");
                        log.debug('costCenter', costCenter)
                        var codeCostCenter = recordLoad.getText('custbody_stc_prefix_numbering')
                        log.debug('codeCostCenter', codeCostCenter)
                        var idCost = recordLoad.getValue('custbody_stc_prefix_numbering')
                        log.debug('idCost', idCost)
                        // var customrecord_stc_mapping_cost_centerSearchObj = search.create({
                        //     type: "customrecord_stc_mapping_cost_center",
                        //     filters:
                        //     [
                        //         ["custrecord_stc_cost_center","anyof",costCenter]
                        //     ],
                        //     columns:
                        //     [
                        //         search.createColumn({name: "name", label: "Name"}),
                        //         search.createColumn({name: "custrecord_stc_cost_center", label: "Cost Center"}),
                        //         search.createColumn({name: "internalid", label: "Internal ID"})
   
                        //     ]
                        // });
                        // var searchResultCountCost = customrecord_stc_mapping_cost_centerSearchObj.runPaged().count;
                        // log.debug("customrecord_stc_mapping_cost_centerSearchObj result count",searchResultCountCost);
                        // customrecord_stc_mapping_cost_centerSearchObj.run().each(function(result){
                        //     idCost = result.getValue({
                        //         name: "internalid"
                        //     })
                        //     return true;
                        // });
                        // log.debug('category', category)
                        // log.debug('codeCostCenter', codeCostCenter)
                        var trandDate = recordLoad.getValue("trandate");
                        log.debug('trandDate', trandDate)
                        var { startDate, endDate } = getMonthRange(trandDate);
                        log.debug("startDate", startDate);
                        log.debug("endDate", endDate); 
                        var formatedDate = getYearMonthCode(trandDate);
                        log.debug('formatedDate', formatedDate)
                        var startDateFormated = formatDateToDDMMYYYY(startDate)
                        var endDateFormated = formatDateToDDMMYYYY(endDate)
                        log.debug('startDateFormated', startDateFormated)
                        log.debug('endDateFormated', endDateFormated)
                        // saved search
                        var lastNumber
                        var idCustRec
                        var customrecord_bank_numberingSearchObj = search.create({
                            type: "customrecord_bank_numbering",
                            filters:
                            [
                                ["custrecord_type_bank","anyof",category], 
                                "AND", 
                                ["custrecord_start_date","on",startDateFormated], 
                                "AND", 
                                ["custrecord_end_date","on",endDateFormated],
                                "AND",
                                ["custrecord_kode_bank","anyof",idCost]
                            ],
                            columns:
                            [
                                search.createColumn({name: "name", label: "Name"}),
                                search.createColumn({name: "scriptid", label: "Script ID"}),
                                search.createColumn({name: "custrecord_last_runnumber", label: "Last Running Number"}),
                                search.createColumn({name: "custrecord_start_date", label: "Start Date"}),
                                search.createColumn({name: "custrecord_end_date", label: "End Date"}),
                                search.createColumn({name: "custrecord_type_bank", label: "Type Bank"}),
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "custrecord_last_number", label: "Last Number"})
                            ]
                        });
                        var searchResultCount = customrecord_bank_numberingSearchObj.runPaged().count;
                        log.debug("customrecord_bank_numberingSearchObj result count",searchResultCount);
                        customrecord_bank_numberingSearchObj.run().each(function(dataRes){
                            idCustRec = dataRes.getValue({
                                name: "internalid"
                            })
                            lastNumber = dataRes.getValue({
                                name: "custrecord_last_number"
                            })
                            return true;
                        });
                        if(codeCostCenter){
                            log.debug('adaCodeCostCenter')
                        }else{
                            codeCostCenter = ""
                        }
                        var firstFormat = firstCode + codeCostCenter + formatedDate
                        var formatNumbering
                        log.debug('firstFormat', firstFormat)
                        log.debug('digit', digit)
                        if(searchResultCount > 0){
                            let newLastNumber = String(Number(lastNumber) + 1).padStart(digit, '0'); 
                            formatNumbering = firstFormat + "-" + newLastNumber
                            log.debug('formatNumbering update', formatNumbering)
                            var recCust = record.load({
                                type : "customrecord_bank_numbering",
                                id : idCustRec
                            })
                            recCust.setValue({
                                fieldId :"custrecord_last_runnumber",
                                value : formatNumbering,
                                ignoreFieldChange: true,
                            })
                            recCust.setValue({
                                fieldId :"custrecord_last_number",
                                value : newLastNumber,
                                ignoreFieldChange: true,
                            });
                            var saverecCust = recCust.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            })
                            log.debug('saverecCust', saverecCust)

                        }else{
                            let firstNumber = String(1).padStart(digit, '0');  
                            formatNumbering = firstFormat + "-" + firstNumber;
                            var createRec = record.create({
                                type : "customrecord_bank_numbering"
                            })
                            createRec.setValue({
                                fieldId :"custrecord_type_bank",
                                value : category,
                                ignoreFieldChange: true,
                            })
                            var d = new Date(startDate);

                            var safeDate = new Date(
                                d.getUTCFullYear(),
                                d.getUTCMonth(),
                                d.getUTCDate()
                            );
                            log.debug('safeDate', safeDate)
                            createRec.setValue({
                                fieldId :"custrecord_start_date",
                                value : safeDate,
                                ignoreFieldChange: true,
                            })
                             var dE = new Date(endDate);

                            var safeDateE = new Date(
                                dE.getUTCFullYear(),
                                dE.getUTCMonth(),
                                dE.getUTCDate()
                            );
                            createRec.setValue({
                                fieldId :"custrecord_end_date",
                                value : safeDateE,
                                ignoreFieldChange: true,
                            })
                            createRec.setValue({
                                fieldId :"custrecord_last_runnumber",
                                value : formatNumbering,
                                ignoreFieldChange: true,
                            })
                            createRec.setValue({
                                fieldId :"custrecord_last_number",
                                value : firstNumber,
                                ignoreFieldChange: true,
                            })
                            createRec.setValue({
                                fieldId :"custrecord_kode_bank",
                                value : idCost,
                                ignoreFieldChange: true,
                            })
                            var savecreateRec = createRec.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            });
                            log.debug('savecreateRec', savecreateRec)
                        }
                        log.debug('formatNumbering', formatNumbering)
                        recordLoad.setValue({
                            fieldId : "tranid",
                            value : formatNumbering,
                            ignoreFieldChange: true,
                        })
                        var saveRec = recordLoad.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        });
                        log.debug('saveRec', saveRec)
                    }
                }
               
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});