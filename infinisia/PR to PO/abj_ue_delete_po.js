/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.DELETE) {
            var dataRec = context.oldRecord;
            var dataRecID = context.oldRecord.id;
            var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
            var fromPRID = dataRec.getValue("custbody_convert_from_prid");
            if (isConvertPR && fromPRID) {
                var dataLineCount = dataRec.getLineCount({
                    sublistId : "item"
                });
                var dataFromPR = []
                if(dataLineCount > 0){
                    for(var i = 0; i < dataLineCount; i++){
                    var itemIdData = dataRec.getSublistValue({
                        sublistId : "item",
                        fieldId : "item",
                        line : i
                    });
                    var qtyData = dataRec.getSublistValue({
                        sublistId : "item",
                        fieldId : "quantity",
                        line : i
                    })
                    var internalidPR = dataRec.getSublistValue({
                        sublistId : "item",
                        fieldId : "custcol_abj_pr_number",
                        line : i
                    })
                    var lineId = dataRec.getSublistValue({
                        sublistId : "item",
                        fieldId : "custcol_msa_id_line_from_pr",
                        line : i
                    })
                    dataFromPR.push(
                        {
                            itemIdData : itemIdData,
                            qtyData : qtyData,
                            internalidPR : internalidPR,
                            lineId : lineId
                        }
                    )
                    }
                }
                fromPRID.forEach(function (internalid) {
                    var prData = record.load({
                        type: "purchaseorder",
                        id: internalid,
                        isDynamic: false,
                    });
                    prData.setValue({
                        fieldId: "custbody_po_converted",
                        value: dataRecID,
                        ignoreFieldChange: true,
                    });
                    var lineinPr = prData.getLineCount({
                        sublistId : "recmachcustrecord_iss_pr_parent"
                    });
                    log.debug('lineinPr', lineinPr)
                    if(lineinPr > 0){
                        for(var i = 0; i < lineinPr; i++){
                            var itemId = prData.getSublistValue({
                                sublistId : "recmachcustrecord_iss_pr_parent",
                                fieldId : "custrecord_iss_pr_item",
                                line : i
                            });
                            var line_id = prData.getSublistValue({
                                sublistId : "recmachcustrecord_iss_pr_parent",
                                fieldId : "id",
                                line : i
                            });
                            log.debug('line_id', line_id)
                            var currntQtyPO = prData.getSublistValue({
                                sublistId : "recmachcustrecord_iss_pr_parent",
                                fieldId : "custrecord_prsum_qtypo",
                                line : i
                            }) || 0;
                            
                            var matchingData = dataFromPR.find(function (data) {
                                return data.internalidPR === internalid && data.itemIdData === itemId && data.lineId == line_id;
                            });
                            log.debug('matchingData', matchingData)
                            if (matchingData) {
                                var qtyPo  = Number(currntQtyPO) - Number(matchingData.qtyData)
                                log.debug('qtyPo', qtyPo)
                                
                                prData.setSublistValue({
                                    sublistId: "recmachcustrecord_iss_pr_parent",
                                    fieldId: "custrecord_prsum_qtypo",
                                    line: i,
                                    value: qtyPo
                                });
                            }
                        }
                    }
                
                        prData.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    });
                });
            }
        }
        
     
    }
    function afterSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var dataRec = context.oldRecord;
            var dataNew = context.newRecord;
            var dataRecID = context.oldRecord.id;
            var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
            var fromPRID = dataRec.getValue("custbody_convert_from_prid");
            if (isConvertPR && fromPRID) {
                var dataLineCount = dataRec.getLineCount({
                    sublistId : "item"
                });
                var dataFromPR = []
                if(dataLineCount > 0){
                    for(var i = 0; i < dataLineCount; i++){
                        var isCount = false
                        var itemIdData = dataRec.getSublistValue({
                            sublistId : "item",
                            fieldId : "item",
                            line : i
                        });
                        var qtyDataOld = dataRec.getSublistValue({
                            sublistId : "item",
                            fieldId : "quantity",
                            line : i
                        })
                        log.debug('qtyDataOld', qtyDataOld)
                        var qtyDataNew = dataNew.getSublistValue({
                            sublistId : "item",
                            fieldId : "quantity",
                            line : i
                        });
                        log.debug('qtyDataNew', qtyDataNew)
                        var internalidPR = dataRec.getSublistValue({
                            sublistId : "item",
                            fieldId : "custcol_abj_pr_number",
                            line : i
                        })
                        var lineId = dataRec.getSublistValue({
                            sublistId : "item",
                            fieldId : "custcol_msa_id_line_from_pr",
                            line : i
                        })
                        if(qtyDataNew != qtyDataOld){
                            isCount = true
                        }
                        log.debug('internalidPR', internalidPR)
                        dataFromPR.push(
                            {
                                itemIdData : itemIdData,
                                qtyDataOld : qtyDataOld,
                                internalidPR : internalidPR,
                                qtyDataNew : qtyDataNew,
                                lineId : lineId,
                                isCount : isCount
                            }
                        )
                    }
                }
                log.debug('dataFromPR', dataFromPR)
                fromPRID.forEach(function (internalid) {
                    var prData = record.load({
                        type: "purchaseorder",
                        id: internalid,
                        isDynamic: false,
                    });
                    prData.setValue({
                        fieldId: "custbody_po_converted",
                        value: dataRecID,
                        ignoreFieldChange: true,
                    });
                    var lineinPr = prData.getLineCount({
                        sublistId : "recmachcustrecord_iss_pr_parent"
                    });
                    if(lineinPr > 0){
                    for(var i = 0; i < lineinPr; i++){
                        var itemId = prData.getSublistValue({
                            sublistId : "recmachcustrecord_iss_pr_parent",
                            fieldId : "custrecord_iss_pr_item",
                            line : i
                        });
                        var line_id = prData.getSublistValue({
                            sublistId : "recmachcustrecord_iss_pr_parent",
                            fieldId : "id",
                            line : i
                        });
                            var currntQtyPO = prData.getSublistValue({
                            sublistId : "recmachcustrecord_iss_pr_parent",
                            fieldId : "custrecord_prsum_qtypo",
                            line : i
                        }) || 0;
                        
                        var matchingData = dataFromPR.find(function (data) {
                            return data.internalidPR === internalid && data.itemIdData === itemId && data.lineId == line_id;
                        });
                        if (matchingData) {
                            if(matchingData.isCount){
                                log.debug('currntQtyPO', currntQtyPO)
                                log.debug('matchingData.qtyDataOld', matchingData.qtyDataOld)
                                
                                var qtyPoUpdate = Number(currntQtyPO) - Number(matchingData.qtyDataOld)
                                log.debug('qtyPoUpdate', qtyPoUpdate)
                                log.debug('matchingData.qtyDataNew', matchingData.qtyDataNew)
                                var qtyPo = Number(qtyPoUpdate) + Number(matchingData.qtyDataNew)
                                
                                log.debug('qtyPo', qtyPo)
                                prData.setSublistValue({
                                    sublistId: "recmachcustrecord_iss_pr_parent",
                                    fieldId: "custrecord_prsum_qtypo",
                                    line: i,
                                    value: qtyPo
                                });
                            }
                            
                        }
                    }
                    }
                
                    prData.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    });
                });
            }
        }
    }

  
    return {
      beforeSubmit: beforeSubmit,
      afterSubmit : afterSubmit
    };
  });
  