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
            if(sublistFieldName == 'custcol_abj_customer_line'){
                var currentRecordObj = context.currentRecord;
                var formId = currentRecordObj.getValue('customform');
                console.log('formId', formId)
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
                    var noSO = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_abj_no_so"
                    })
                    var customer = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_abj_customer_line"
                    })
                    console.log('customer', customer)

                    if(itemId && salesRep && customer){
                        if(noSO){
                            var salesorderSearchObj = search.create({
                                type: "salesorder",
                                filters:
                                [
                                    ["type","anyof","SalesOrd"], 
                                    "AND", 
                                    ["internalid","anyof",noSO], 
                                    "AND", 
                                    ["item","anyof",itemId]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "quantity", label: "Quantity"}),
                                    search.createColumn({name: "quantitypicked", label: "Quantity Picked"}),
                                    search.createColumn({name: "quantitypacked", label: "Quantity Packed"}),
                                    search.createColumn({name: "quantityshiprecv", label: "Quantity Fulfilled/Received"})
                                ]
                            });
                            var searchResultCount = salesorderSearchObj.runPaged().count;
                            var totalQty = 0
                            salesorderSearchObj.run().each(function(result){
                                var qty = result.getValue({
                                    name: "quantity"
                                }) || 0;
                                var picked = result.getValue({
                                    name: "quantitypicked"
                                }) || 0;
                                var packed =  result.getValue({
                                    name: "quantitypacked"
                                }) || 0;
                                var fulfilled =  result.getValue({
                                    name: "quantityshiprecv"
                                }) || 0;
                                totalQty = Number(qty)-Number(picked)
                                return true;
                            });
                            console.log('totalQty', totalQty);
                            currentRecordObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol6",
                                value: totalQty || 0,
                            });
                        }
                        var incoimngStock = 0
                        var research = true
                        if(noSO){
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
                                    ["formulatext: {custcol_abj_sales_rep_line}","isnotempty",""], 
                                    "AND", 
                                    ["item","anyof", itemId], 
                                    "AND", 
                                    ["custcol_abj_sales_rep_line","anyof",salesRep], 
                                    "AND", 
                                    ["custcol_abj_customer_line","anyof",customer], 
                                    "AND", 
                                    ["custcol_abj_no_so","anyof",noSO]
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
                                        name: "custcol_abj_customer_line",
                                        summary: "GROUP",
                                        label: "ABJ - Customer"
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
                           
                            var searchResultCount = purchaseorderSearchObj.runPaged().count;
                            purchaseorderSearchObj.run().each(function(result){
                                var qtyIncomingStock = result.getValue({
                                    name: "formulanumeric",
                                    summary: "SUM",
                                    formula: "{quantity}-{quantityshiprecv}",
                                })
                                console.log('qtyIncomingStock', qtyIncomingStock)
                                if(qtyIncomingStock){
                                    incoimngStock += Number(qtyIncomingStock)
                                    research = false
                                }
                                return true;
                            });
                        }
                        console.log('incomingStcok', incoimngStock)
                        console.log('research', research)
                        if(research == true){
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
                                    ["formulatext: {custcol_abj_sales_rep_line}","isnotempty",""], 
                                    "AND", 
                                    ["item","anyof", itemId], 
                                    "AND", 
                                    ["custcol_abj_sales_rep_line","anyof",salesRep], 
                                    "AND", 
                                    ["custcol_abj_customer_line","anyof",customer],
                                    "AND", 
                                    ["custcol_abj_no_so","anyof","@NONE@"]
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
                                        name: "custcol_abj_customer_line",
                                        summary: "GROUP",
                                        label: "ABJ - Customer"
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
                           
                            var searchResultCount = purchaseorderSearchObj.runPaged().count;
                            purchaseorderSearchObj.run().each(function(result){
                                var qtyIncomingStock = result.getValue({
                                    name: "formulanumeric",
                                    summary: "SUM",
                                    formula: "{quantity}-{quantityshiprecv}",
                                })
                                console.log('qtyIncomingStock', qtyIncomingStock)
                                if(qtyIncomingStock){
                                    incoimngStock += Number(qtyIncomingStock)
                                }
                                return true;
                            });
                        }  
                       
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol5",
                            value: incoimngStock || 0,
                        });
                        
                        var onHand = 0
                        var isReSearch = true
                        if(noSO){
                            var inventorynumberSearchObj = search.create({
                                type: "inventorynumber",
                                filters:
                                [
                                    ["item.type","anyof","InvtPart"], 
                                    "AND", 
                                    ["item","anyof",itemId], 
                                    "AND", 
                                    ["custitemnumber1","anyof",salesRep], 
                                    "AND", 
                                    ["custitemnumber_lot_customer","anyof",customer], 
                                    "AND", 
                                    ["custitemnumber_lot_so_number","anyof",noSO]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "inventorynumber",
                                        summary: "GROUP",
                                        label: "Number"
                                    }),
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
                                        name: "custitemnumber1",
                                        summary: "GROUP",
                                        label: "Sales Rep"
                                    }),
                                    search.createColumn({
                                        name: "custitemnumber_lot_customer",
                                        summary: "GROUP",
                                        label: "Customer"
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
                                console.log('qtyOnhand', qtyOnhand)
                                if(qtyOnhand){
                                    onHand += Number(qtyOnhand)
                                    isReSearch = false
                                }
                                return true;
                            });
                        }
                        console.log('isReSearch qty onHand', isReSearch);
                        if(isReSearch == true){
                            var inventorynumberSearchObj = search.create({
                                type: "inventorynumber",
                                filters:
                                [
                                    ["item.type","anyof","InvtPart"], 
                                    "AND", 
                                    ["item","anyof",itemId], 
                                    "AND", 
                                    ["custitemnumber1","anyof",salesRep], 
                                    "AND", 
                                    ["custitemnumber_lot_customer","anyof",customer],
                                    "AND", 
                                    ["custitemnumber_lot_so_number","anyof","@NONE@"]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "inventorynumber",
                                        summary: "GROUP",
                                        label: "Number"
                                    }),
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
                                        name: "custitemnumber1",
                                        summary: "GROUP",
                                        label: "Sales Rep"
                                    }),
                                    search.createColumn({
                                        name: "custitemnumber_lot_customer",
                                        summary: "GROUP",
                                        label: "Customer"
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
                                console.log('qtyOnhand', qtyOnhand)
                                if(qtyOnhand){
                                    onHand += Number(qtyOnhand)
                                }
                                return true;
                            });
                        }
                        console.log('onHand', onHand)
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_abj_onhand",
                            value: onHand || 0,
                        });
                        
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