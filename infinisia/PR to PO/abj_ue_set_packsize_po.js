/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/config"], function(
    record,
    search,
    config
    ) {
        function afterSubmit(context) {
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                    var rec = context.newRecord;
                    var dataRec = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    })
                    var idRec = rec.id
                    var cForm =  dataRec.getValue('customform');
                    log.debug('cForm', cForm)
                    if(cForm != 138){
                        var dataLineCount = dataRec.getLineCount({
                            sublistId : "item"
                        });
                        log.debug('dataLineCount', dataLineCount)
                        var allDataPr = []
                        if(dataLineCount > 0){
                            for(var i = 0; i < dataLineCount; i++){
                                var itemIdData = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "item",
                                    line : i
                                });
                                var lineId = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "custcol_msa_id_line_from_pr",
                                    line : i
                                })
                                log.debug('lineId', lineId)
                                var quantity = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "quantity",
                                    line : i
                                })
                                var internalidPR = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "custcol_abj_pr_number",
                                    line : i
                                });
                                var rate = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "rate",
                                    line : i
                                });
                                var taxCode = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "taxcode",
                                    line : i
                                });
                                log.debug('internalidPR', internalidPR)
                                var packSize = ""
                                if(internalidPR && lineId && itemIdData){
                                    var purchaseorderSearchObj = search.create({
                                        type: "purchaseorder",
                                        filters:
                                        [
                                            ["type","anyof","PurchOrd"], 
                                            "AND", 
                                            ["customform","anyof","138"], 
                                            "AND", 
                                            ["internalid","anyof",internalidPR], 
                                            "AND", 
                                            ["custrecord_iss_pr_parent.custrecord_iss_pr_item","anyof",itemIdData], 
                                            "AND", 
                                            ["mainline","is","T"], 
                                            "AND", 
                                            ["custrecord_iss_pr_parent.internalid","anyof",lineId]
                                        ],
                                        columns:
                                        [
                                            search.createColumn({
                                                name: "custrecord_iss_pr_item",
                                                join: "CUSTRECORD_ISS_PR_PARENT",
                                                label: "Item"
                                            }),
                                            search.createColumn({
                                                name: "custrecord_iss_pack_size",
                                                join: "CUSTRECORD_ISS_PR_PARENT",
                                                label: "Pack Size"
                                            }),
                                            search.createColumn({
                                                name: "internalid",
                                                join: "CUSTRECORD_ISS_PR_PARENT",
                                                label: "Internal ID"
                                            })
                                        ]
                                    });
                                    var searchResultCount = purchaseorderSearchObj.runPaged().count;
                                    log.debug("purchaseorderSearchObj result count",searchResultCount);
                                    purchaseorderSearchObj.run().each(function(result){
                                        var pckSIze = result.getValue({
                                            name: "custrecord_iss_pack_size",
                                            join: "CUSTRECORD_ISS_PR_PARENT",
                                        })
                                        if(pckSIze){
                                            packSize = pckSIze
                                        }
                                        return true;
                                    });
                                }
                                if(packSize != ""){
                                    dataRec.setSublistValue({
                                        sublistId:'item',
                                        fieldId:'units',
                                        line:i,
                                        value:packSize
                                    });
                                }
                               
                                dataRec.setSublistValue({
                                    sublistId:'item',
                                    fieldId:'rate',
                                    line:i,
                                    value:rate
                                });
                                dataRec.setSublistValue({
                                    sublistId:'item',
                                    fieldId:'taxcode',
                                    line:i,
                                    value:taxCode
                                });
                                // log.debug('quantity', quantity)
                                // dataRec.setSublistValue({
                                //     sublistId:'item',
                                //     fieldId:'quantity',
                                //     line:i,
                                //     value:quantity
                                // });
                                var prId = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "custcol_abj_pr_number",
                                    line : i
                                });
                                var lineIdPr = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "custcol_msa_id_line_from_pr",
                                    line : i
                                });
                                allDataPr.push({
                                    idRec : idRec,
                                    prId:prId,
                                    lineIdPr:lineIdPr,
                                    itemIdData: itemIdData,
                                    quantity : quantity
                                })
                                
                            }
                            allDataPr.forEach(function(prData) {
                                var prId = prData.prId;
                                var lineIdPr = prData.lineIdPr
                                var itemIdData = prData.itemIdData
                                var idRec = prData.idRec
                                var quantity = prData.quantity

                                var prData = record.load({
                                    type: "purchaseorder",
                                    id: prId,
                                    isDynamic: false,
                                });
                                prData.setValue({
                                    fieldId: "custbody_po_converted",
                                    value: idRec,
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
                                        log.debug('data cek', {itemId : itemId, itemIdData : itemIdData, lineIdPr : lineIdPr,line_id : line_id })
                                        if (itemId == itemIdData && lineIdPr == line_id) {
                                            var qtyPo  = Number(currntQtyPO) + Number(quantity)
                                            log.debug('masuk set qty from PO',{lineIdPr : lineIdPr,line_id : line_id, qtyPo: qtyPo })
                                            prData.setSublistValue({
                                                sublistId: "recmachcustrecord_iss_pr_parent",
                                                fieldId: "custrecord_prsum_qtypo",
                                                line: i,
                                                value: qtyPo
                                            });
                                        }
                                    }
                                }
                                var savePr = prData.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true,
                                });
                                log.debug('savePr', savePr)
                            })
                            var savePo = dataRec.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true,
                            });
                            log.debug('savePo', savePo)
                        }
                    }
                   
                }
            } catch (e) {
                log.debug('error', e)
            }
        }
        return {
            afterSubmit: afterSubmit,
        };
});