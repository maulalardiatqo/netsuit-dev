/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
    function afterSubmit(context) {
        try{
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE ) {
                var dataNew = context.oldRecord;
                var idPR = dataNew.getValue('id');
                log.debug('idPR', idPR)
                var customForm = dataNew.getValue('customform');
                log.debug('customForm', customForm);
                if(customForm == 138){
                    var dataLineCount = dataNew.getLineCount({
                        sublistId : "item"
                    });
                    if(dataLineCount > 0){
                        for(var i = 0; i < dataLineCount; i++){
                            var itemPr = dataNew.getSublistValue({
                                sublistId : "item",
                                fieldId : "item",
                                line : i
                            });
                            var packSizePR = dataNew.getSublistValue({
                                sublistId : "item",
                                fieldId : "custcol_abj_pack_size_order",
                                line : i
                            });
                            var keyPR = itemPr + "-" + packSizePR
                            var soId = dataNew.getSublistValue({
                                sublistId : "item",
                                fieldId : "custcol_abj_no_so",
                                line : i
                            });
                            log.debug('keyPR', keyPR)
                            if(soId){
                                var recSo = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: soId,
                                    isDynamic: false
                                });
                                var soLineCount = recSo.getLineCount({
                                    sublistId: "item"
                                });
                                if(soLineCount > 0){
                                    for(var j = 0; j < dataLineCount; j++){
                                        var itemSo = recSo.getSublistValue({
                                            sublistId : "item",
                                            fieldId : "item",
                                            line : i
                                        });
                                        var packSizeSo = recSo.getSublistValue({
                                            sublistId : "item",
                                            fieldId : "units",
                                            line : i
                                        });
                                        var keySO = itemSo + "-" + packSizeSo
                                        log.debug('keySO', keySO)
                                        if(keyPR == keySO){
                                            recSo.setSublistValue({
                                                sublistId: "item",
                                                fieldId: "custcol_abj_iss_pr_id",
                                                line: i,
                                                value: idPR
                                            });
                                        }
                                    }
                                    
                                }
                                var saveSo = recSo.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true,
                                });
                                log.debug('saveSo', saveSo)
                            }
                        }
                    }
                }
                
            }
        }catch(e){
            log.debug('error', e)
        }
        
    }
    return {
        afterSubmit : afterSubmit
      };
    });