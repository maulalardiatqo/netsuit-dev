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
                log.debug('masuk eksekusi')
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var itemCategoty = recordLoad.getValue("custitem_stc_item_category");
                if(itemCategoty){
                    var itemCode
                    var customrecord_stc_item_categorySearchObj = search.create({
                        type: "customrecord_stc_item_category",
                        filters:
                        [
                            ["internalid","anyof",itemCategoty]
                        ],
                        columns:
                        [
                            search.createColumn({name: "name", label: "Name"}),
                            search.createColumn({name: "scriptid", label: "Script ID"}),
                            search.createColumn({name: "custrecord_stc_category_code", label: "Category Code"})
                        ]
                    });
                    var searchResultCount = customrecord_stc_item_categorySearchObj.runPaged().count;
                    log.debug("customrecord_stc_item_categorySearchObj result count",searchResultCount);
                    customrecord_stc_item_categorySearchObj.run().each(function(result){
                        codeItem = result.getValue({
                            name: "custrecord_stc_category_code"
                        })
                        if(codeItem){
                            itemCode = codeItem
                        }
                        return true;
                    });
                    log.debug('itemCode', itemCode)
                    if(itemCode){
                        var lastNumbering
                        var codeCategory
                        var idCustRec
                        var customrecord_item_numberingSearchObj = search.create({
                            type: "customrecord_item_numbering",
                            filters:
                            [
                                ["custrecord_item_category","anyof",itemCategoty]
                            ],
                            columns:
                            [
                                search.createColumn({name: "custrecord_code_category", label: "Code Category"}),
                                search.createColumn({name: "custrecord_last_numbering_item", label: "Last Item Numbering"}),
                                search.createColumn({name: "internalid", label: "Internal ID"})

                            ]
                        });
                        var searchResultCount = customrecord_item_numberingSearchObj.runPaged().count;
                        log.debug("customrecord_item_numberingSearchObj result count",searchResultCount);
                        customrecord_item_numberingSearchObj.run().each(function(result){
                            lastNumbering = result.getValue({
                                name: "custrecord_last_numbering_item"
                            })
                            codeCategory = result.getValue({
                                name: "custrecord_code_category"
                            })
                            idCustRec = result.getValue({
                                name: "internalid"
                            })
                            return true;
                        });
                        var numberingSet
                        var newLastNumber
                        log.debug('lastNumbering', lastNumbering)
                        if(lastNumbering){
                            let newLastNumber = String(Number(lastNumbering) + 1).padStart(lastNumbering.length, '0');
                            numberingSet = itemCode + "-" + newLastNumber
                            log.debug('numberingSet', numberingSet)
                            var recUpdate = record.load({
                                type : "customrecord_item_numbering",
                                id : idCustRec
                            })
                            recUpdate.setValue({
                                fieldId : "custrecord_code_category",
                                value : itemCode,
                                ignoreFieldChange: true,
                            })
                            recUpdate.setValue({
                                fieldId : "custrecord_last_numbering_item",
                                value : newLastNumber,
                                ignoreFieldChange: true,
                            })
                            recUpdate.setValue({
                                fieldId : "custrecord_last_format_numbering",
                                value : numberingSet,
                                ignoreFieldChange: true,
                            })
                            var saverecUpdate = recUpdate.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            })
                            log.debug('saverecUpdate', saverecUpdate)

                        }else{
                            var newNumbering = itemCode + "-" + "0001"
                            newLastNumber = "0001"
                            numberingSet = newNumbering
                            var recCreate = record.create({
                                type : "customrecord_item_numbering",
                            })
                            recCreate.setValue({
                                fieldId : "custrecord_item_category",
                                value : itemCategoty,
                                ignoreFieldChange: true,
                            })
                            recCreate.setValue({
                                fieldId : "custrecord_code_category",
                                value : itemCode,
                                ignoreFieldChange: true,
                            })
                            recCreate.setValue({
                                fieldId : "custrecord_last_numbering_item",
                                value : newLastNumber,
                                ignoreFieldChange: true,
                            })
                            recCreate.setValue({
                                fieldId : "custrecord_last_format_numbering",
                                value : numberingSet,
                                ignoreFieldChange: true,
                            })
                            var saverecCreate = recCreate.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            })
                            log.debug('saverecCreate', saverecCreate)
                        }
                        recordLoad.setValue({
                            fieldId: "itemid",
                            value: numberingSet,
                            ignoreFieldChange: true,
                        });
                        var saveItem = recordLoad.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        });
                        log.debug("saveItem", saveItem);
                    }
                }
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});