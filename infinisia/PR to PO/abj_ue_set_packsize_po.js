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
                    log.debug('masuk')
                    var rec = context.newRecord;
                    var dataRec = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    })
                    var cForm =  dataRec.getValue('customform');
                    log.debug('cForm', cForm)
                    if(cForm != 138){
                        var dataLineCount = dataRec.getLineCount({
                            sublistId : "item"
                        });
                        log.debug('dataLineCount', dataLineCount)
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
                                var internalidPR = dataRec.getSublistValue({
                                    sublistId : "item",
                                    fieldId : "custcol_abj_pr_number",
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
                                log.debug('packSize', packSize)
                                if(packSize != ""){
                                    dataRec.setSublistValue({
                                        sublistId:'item',
                                        fieldId:'units',
                                        line:i,
                                        value:packSize
                                    });
                                }
                                
                            }
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