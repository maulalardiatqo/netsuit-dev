/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE) {
                var dataNew = context.newRecord;
                var idPR = dataNew.getValue('id');
                log.debug('idPR', idPR);
                var customForm = dataNew.getValue('customform');
                log.debug('customForm', customForm);
                if (customForm == 138) {
                    var dataLineCount = dataNew.getLineCount({
                        sublistId: "item"
                    });
                    if (dataLineCount > 0) {
                        for (var i = 0; i < dataLineCount; i++) {
                            var itemPr = dataNew.getSublistValue({
                                sublistId: "item",
                                fieldId: "item",
                                line: i
                            });
                            var packSizePR = dataNew.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_abj_pack_size_order",
                                line: i
                            });
                            var keyPR = itemPr + "-" + packSizePR;
                            var soId = dataNew.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_abj_no_so",
                                line: i
                            });
                            log.debug('keyPR', keyPR);
                            if (soId) {
                                var recSo = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: soId,
                                    isDynamic: false
                                });
                                var soLineCount = recSo.getLineCount({
                                    sublistId: "item"
                                });
                                var allLinesFilled = true;
                                if (soLineCount > 0) {
                                    for (var j = 0; j < soLineCount; j++) {
                                        var itemSo = recSo.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "item",
                                            line: j
                                        });
                                        var packSizeSo = recSo.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "units",
                                            line: j
                                        });
                                        var keySO = itemSo + "-" + packSizeSo;
                                        log.debug('keySO', keySO);
                                        if (keyPR == keySO) {
                                            recSo.setSublistValue({
                                                sublistId: "item",
                                                fieldId: "custcol_abj_iss_pr_id",
                                                line: j,
                                                value: idPR
                                            });
                                        }
                                        var issPrId = recSo.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_abj_iss_pr_id",
                                            line: j
                                        });
                                        if (!issPrId) {
                                            allLinesFilled = false;
                                        }
                                    }
                                    log.debug('allLinesFilled', allLinesFilled)
                                    if (allLinesFilled) {
                                        recSo.setValue({
                                            fieldId: 'custbody_abj_pr_created',
                                            value: true
                                        });
                                    }
                                    var saveSo = recSo.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true,
                                    });
                                    log.debug('saveSo', saveSo);

                                    
                                    
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            log.debug('error', e);
        }
    }
    function beforeSubmit(context) {
        try {
            if (context.type == context.UserEventType.DELETE) {
                log.debug('masuk delete')
                var dataRec = context.oldRecord;
                var dataRecID = context.oldRecord.id;
                log.debug('dataRecID', dataRecID)
                var customForm = dataRec.getValue('customform');
                log.debug('customForm', customForm)
                if(customForm == 138){
                    var dataLineCount = dataRec.getLineCount({
                        sublistId : "item"
                    });
                    if(dataLineCount > 0){
                        for(var i = 0; i < dataLineCount; i++){
                            var soId = dataRec.getSublistValue({
                                sublistId : "item",
                                fieldId : "custcol_abj_no_so",
                                line : i
                            });
                            log.debug('soId', soId)
                            if(soId){
                                var recSo = record.load({
                                    type: "salesorder",
                                    id: soId,
                                    isDynamic: false,
                                })
                                var lineSo = recSo.getLineCount({
                                    sublistId : "item"
                                });
                                log.debug('lineSo', lineSo)
                                if(lineSo > 0){
                                    for(var j = 0; j < dataLineCount; j++){
                                        var prId = recSo.getSublistValue({
                                            sublistId : "item",
                                            fieldId : "custcol_abj_iss_pr_id",
                                            line : j
                                        });
                                        log.debug('prId', prId)
                                        log.debug('dataRecID', dataRecID)
                                        if(prId == dataRecID){
                                            dataRec.setSublistValue({
                                                sublistId : "item",
                                                fieldId : "custcol_abj_iss_pr_id",
                                                value : '',
                                                line : j
                                            })
                                        }
                                        
                                    }
                                    
                                }
                                recSo.setValue({
                                    fieldId : 'custbody_abj_pr_created',
                                    value : false,
                                    ignoreFieldChange: true,
                                })
                                var saveSoDelete = recSo.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true,
                                });
                                log.debug('saveSoDelete', saveSoDelete);
                               
                            }
                            
                        }
                    }
                }
               
            }
        }catch(e){
            log.debug('error', e);
        }
        
    }

    return {
        afterSubmit: afterSubmit,
        beforeSubmit : beforeSubmit
    };
});
