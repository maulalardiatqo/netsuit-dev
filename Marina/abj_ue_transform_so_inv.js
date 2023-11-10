/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/task"], function(
    record,
    search,
    task,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var recordItm = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var customer = recordItm.getValue("entity");
                var date = recordItm.getValue("trandate");
                var postingPeriod = recordItm.getValue("postingperiod");
                var soField = recordItm.getValue("createdfrom");
                var lineitemFulfill = recordItm.getLineCount({
                    sublistId: 'item'
                });
                
                var idItemFulFill = [];
                if(lineitemFulfill > 0){
                    for(var index = 0; index < lineitemFulfill; index++){
                        var item = recordItm.getSublistValue({
                            sublistId : "item",
                            fieldId : "item",
                            line : index
                        });
                        idItemFulFill.push({
                            item : item
                        })
                    }
                    
                }
                log.debug('lineitemFulfill', lineitemFulfill);
                
                log.debug('soField', soField);
                if(soField){
                    var soRec = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: soField,
                        toType: record.Type.INVOICE,
                        isDynamic: true,
                    });
                    var location = soRec.getValue("location");
                    var soDate = soRec.getValue("saleseffectivedate");
                    var subsidiari = soRec.getValue("subsidiary");
                    soRec.setValue({
                        fieldId: 'trandate',
                        value: date,
                        ignoreFieldChange: true
                    });
                    soRec.setValue({
                        fieldId: 'entity',
                        value: customer,
                        ignoreFieldChange: true
                    });
                    soRec.setValue({
                        fieldId: 'location',
                        value: location,
                        ignoreFieldChange: true
                    });
                    soRec.setValue({
                        fieldId: 'postingperiod',
                        value: postingPeriod,
                        ignoreFieldChange: true
                    });
                    soRec.setValue({
                        fieldId: 'saleseffectivedate',
                        value: soDate,
                        ignoreFieldChange: true
                    });
                    soRec.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiari,
                        ignoreFieldChange: true
                    });
                    // var lineTotal = soRec.getLineCount({
                    //     sublistId: 'item'
                    // });
                    // if(lineTotal > 0){
                    //     for(var i = 0; i < lineTotal; i++){
                    //         var itemsSO = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "item",
                    //             line : i
                    //         });
                    //         log.debug('itemSo', itemsSO);
                    //         var amount = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "amount",
                    //             line : i
                    //         });
                    //         var qty = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "quantity",
                    //             line : i
                    //         });
                    //         var rate = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "rate",
                    //             line : i
                    //         });
                    //         var basePrice = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "price",
                    //             line : i
                    //         });
                    //         var grossAmt = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "grossamt",
                    //             line : i
                    //         });
                    //         var qtyAvailable = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "quantityavailable",
                    //             line : i
                    //         });
                    //         var taxtCode = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "taxcode",
                    //             line : i
                    //         });
                    //         var taxtAmt = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "tax1amt",
                    //             line : i
                    //         });
                    //         var taxtRate = soRec.getSublistValue({
                    //             sublistId : "item",
                    //             fieldId : "taxrate1",
                    //             line : i
                    //         });

                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'item',
                    //             value: item
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'amount',
                    //             value: amount
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'quantity',
                    //             value: qty
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'rate',
                    //             value: rate
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'price',
                    //             value: basePrice
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'grossamt',
                    //             value: grossAmt
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'quantityavailable',
                    //             value: qtyAvailable
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'taxcode',
                    //             value: taxtCode
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'tax1amt',
                    //             value: taxtAmt
                    //         });
                    //         soRec.setCurrentSublistValue({
                    //             sublistId: 'item',
                    //             fieldId: 'taxrate1',
                    //             value: taxtRate
                    //         });
                    //     }
                    //     soRec.commitLine('item');
                    // }
                    var saveInv = soRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveInv', saveInv);
                    log.debug('lineTotal', lineTotal);

                }
                
               
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
 });