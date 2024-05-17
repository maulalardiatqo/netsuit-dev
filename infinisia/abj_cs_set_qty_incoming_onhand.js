/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_abj_sales_rep_line'){
                var currentRecordObj = context.currentRecord;
                var formId = currentRecordObj.getValue('customform');
                if(formId == 138){
                    console.log('masuk change')
                    var itemId = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                    })
                    var salesRep = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_abj_sales_rep_line",
                    })
                    console.log('itemId', itemId);
                    console.log('salesRep', salesRep)
                    if(itemId && salesRep){
                        var purchaseorderSearchObj = search.create({
                            type: "purchaseorder",
                            filters:
                            [
                                ["type","anyof","PurchOrd"], 
                                "AND", 
                                ["customform","anyof","104"], 
                                "AND",
                                ["status","anyof","PurchOrd:E","PurchOrd:B"], 
                                "AND", 
                                ["mainline","is","F"], 
                                "AND", 
                                ["taxline","is","F"], 
                                "AND", 
                                ["cogs","is","F"], 
                                "AND", 
                                ["formulatext: {item}","isnotempty",""], 
                                "AND", 
                                ["item","anyof",itemId], 
                                "AND", 
                                ["salesrep","anyof",salesRep], 
                                "AND", 
                                ["formulatext: {custcol_abj_sales_rep_line}","isnotempty",""]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "item",
                                    summary: "GROUP",
                                    label: "Item"
                                }),
                                search.createColumn({
                                    name: "custcol_abj_sales_rep_line",
                                    summary: "GROUP",
                                    label: "Sales Rep"
                                }),
                                search.createColumn({
                                    name: "quantity",
                                    summary: "SUM",
                                    label: "Quantity"
                                }),
                                search.createColumn({
                                    name: "quantityshiprecv",
                                    summary: "SUM",
                                    label: "Quantity Fulfilled/Received"
                                }),
                                search.createColumn({
                                    name: "formulanumeric",
                                    summary: "SUM",
                                    formula: "{quantity}-{quantityshiprecv}",
                                    label: "Formula (Numeric)"
                                })
                            ]
                        });
                        var incoimngStock
                        var searchResultCount = purchaseorderSearchObj.runPaged().count;
                        log.debug("purchaseorderSearchObj result count",searchResultCount);
                        purchaseorderSearchObj.run().each(function(result){
                            var qtyIncomingStock = result.getValue({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "{quantity}-{quantityshiprecv}",
                            })
                            if(qtyIncomingStock){
                                incoimngStock = qtyIncomingStock
                            }
                            return true;
                        });
                        console.log('incomingStock', incoimngStock)
                        if(incoimngStock){
                            currentRecordObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol5",
                                value: incoimngStock,
                            });
                        }
                        var onHand
                        var inventorynumberSearchObj = search.create({
                            type: "inventorynumber",
                            filters:
                            [
                                ["item.type","anyof","InvtPart"], 
                                "AND", 
                                ["item","anyof",itemId], 
                                "AND", 
                                ["custitemnumber1","anyof",salesRep]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "item",
                                    summary: "GROUP",
                                    label: "Item"
                                }),
                                search.createColumn({
                                    name: "quantityonhand",
                                    summary: "SUM",
                                    label: "On Hand"
                                }),
                                search.createColumn({
                                    name: "quantityonorder",
                                    join: "item",
                                    summary: "SUM",
                                    label: "On Order"
                                }),
                                search.createColumn({
                                    name: "custitemnumber1",
                                    summary: "GROUP",
                                    label: "Sales Rep"
                                })
                            ]
                        });
                        var searchResultCount = inventorynumberSearchObj.runPaged().count;
                        log.debug("inventorynumberSearchObj result count",searchResultCount);
                        inventorynumberSearchObj.run().each(function(result){
                            var qtyOnhand = result.getValue({
                                name: "quantityonhand",
                                summary: "SUM",
                            })
                            if(qtyOnhand){
                                onHand = qtyOnhand
                            }
                        return true;
                        });
                        if(onHand){
                            currentRecordObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_abj_onhand",
                                value: onHand,
                            });
                        }
                    }
                }

            }
            
            
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});