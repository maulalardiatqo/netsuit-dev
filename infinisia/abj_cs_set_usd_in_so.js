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
            var currentRecordObj = context.currentRecord;
            var kursUsd = currentRecordObj.getValue('custbody_abj_kurs_usd');
            if(kursUsd){
                if(sublistFieldName == 'custcol_abj_so_price_per_kg'){
                    var priceperkgidr = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_abj_so_price_per_kg",
                    })
                    var priceperkgusd = Number(priceperkgidr) / Number(kursUsd);
                    console.log('priceperkgusd', priceperkgusd);
                    if(priceperkgusd){
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_price_kg_usd",
                            value: priceperkgusd,
                        });
                    }
                }
                if(sublistFieldName == 'rate'){
                    var rateidr = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                    })
                    var rateUsd = Number(rateidr) / Number(kursUsd);
                    console.log('rateUsd', rateUsd);
                    if(rateUsd){
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_price_totalpackaging_usd",
                            value: rateUsd,
                        });
                    }
                    var qty = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                    })
                    var unitsRate = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "unitconversionrate",
                    })
                    var totalQty = Number(qty) * Number(unitsRate);
                    var amtUsd = Number(rateUsd) * Number(totalQty);
                    console.log('qty', qty);
                    console.log('unitsRate', unitsRate)
                    console.log('totalQty', totalQty);
                    if(amtUsd){
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_amount_usd",
                            value: amtUsd,
                        });
                    }
                    
                }
                if(sublistFieldName == 'amount'){
                    console.log('amount change')
                    var amountidr = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                    })
                    console.log('amountidr', amountidr)
                    var amountUsd = Number(amountidr) / Number(kursUsd);
                    console.log('amountUsd', amountUsd);
                    if(amountUsd){
                        
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_amount_usd",
                            value: amountUsd,
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