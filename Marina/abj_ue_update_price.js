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
                function roundToNearestHundred(num) {
                    return Math.ceil(num / 100) * 100;
                }
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    var rec = context.newRecord;
    
                    var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                    });
                    var itemCount = recordTRans.getLineCount({ sublistId: 'item' });
                    if(itemCount > 0){
                        for(var i = 0; i < itemCount; i++){
                            var itemId = recordTRans.getSublistValue({ 
                                sublistId: 'item', 
                                fieldId : 'item', 
                                line : i
                            })
                            log.debug('itemId', itemId)
                            var rate = recordTRans.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'rate',
                                line : i
                            })
                            if(itemId){
                                var allIdItem = []
                                var itemreceiptSearchObj = search.create({
                                    type: "itemreceipt",
                                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                                    filters:
                                    [
                                        ["type","anyof","ItemRcpt"], 
                                        "AND", 
                                        ["item","anyof",itemId]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "internalid", label: "Internal ID"})
                                    ]
                                });
                                var searchResultCount = itemreceiptSearchObj.runPaged().count;
                                log.debug("itemreceiptSearchObj result count",searchResultCount);
                                itemreceiptSearchObj.run().each(function(result){
                                    var itemSearch = result.getValue({
                                        name: "internalid"
                                    });
                                    allIdItem.push(itemSearch)
                                    return true;
                                });
                                log.debug('allIdItem', allIdItem)
                                var highestItemId = Math.max(...allIdItem);
                                log.debug('highestItemId', highestItemId)
                                if (rec.id == highestItemId) {
                                    log.debug('itemId adalah yang tertinggi');
                                    var recItem = record.load({
                                        type: "inventoryitem",
                                        id: itemId,
                                        isDynamic: false
                                    });
                                    recItem.setValue({
                                        fieldId: 'custitem_ajb_pph_last_purchase',
                                        value: rate,
                                        ignoreFieldChange: true
                                    })
                                    var countLinePrice = recItem.getLineCount({ sublistId : 'recmachcustrecord_msa_priceqty_item_id' })
                                    if(countLinePrice > 0){
                                        for(var j = 0; j < countLinePrice; j++){
                                            var profitProsent = recItem.getSublistValue({
                                                sublistId : "recmachcustrecord_msa_priceqty_item_id",
                                                fieldId : "custrecord_msa_gpq_profit_percent",
                                                line : j
                                            });
                                            var harga = Number(rate) + ((Number(profitProsent)/100) * Number(rate))
                                            var hargaRound = roundToNearestHundred(harga)
                                            recItem.setSublistValue({
                                                sublistId:'recmachcustrecord_msa_priceqty_item_id',
                                                fieldId:'custrecord_msa_gpq_harga',
                                                line:j,
                                                value:hargaRound
                                            })
                                        }
                                        var saveRec = recItem.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        });
                                        log.debug('saveRec', saveRec)
                                }
                               
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
        afterSubmit: afterSubmit,
    };
});