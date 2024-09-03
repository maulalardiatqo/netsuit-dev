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
            if(sublistFieldName == 'units'){
                var currentRecordObj = context.currentRecord;
                var totalOrder = currentRecordObj.getCurrentSublistValue({
                    sublistId : "item",
                    fieldId :"custcol_pr_total_order"
                });
                console.log('totalOrder', totalOrder)
                var units = currentRecordObj.getCurrentSublistText({
                    sublistId : "item",
                    fieldId :"units"
                });
                console.log('units', units)
                if(units && totalOrder){
                    console.log('masuk kondisi')
                    var ratePackSize = 0
                    console.log('cek unit', units)
                    var unitstypeSearchObj = search.create({
                        type: "unitstype",
                        filters:
                        [
                            ["unitname","is",units]
                        ],
                        columns:
                        [
                            search.createColumn({name: "conversionrate", label: "Rate"})
                        ]
                    });
                    var searchResultCount = unitstypeSearchObj.runPaged().count;
                    console.log("unitstypeSearchObj result count",searchResultCount);
                    unitstypeSearchObj.run().each(function(result){
                        var rate = result.getValue({
                            name: "conversionrate"
                        });
                        if(rate){
                            ratePackSize = rate
                        }
                        return true;
                    });
                    var qtyToSet = Number(totalOrder) / Number(ratePackSize);
                    console.log('qtyToSet', qtyToSet);
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: qtyToSet || 0,
                    });
                }
            }
            if(sublistFieldName == 'custcol_abj_so_price_per_kg'){
                var currentRecordObj = context.currentRecord;
                var pricePerKG = currentRecordObj.getCurrentSublistValue({
                    sublistId : "item",
                    fieldId : "custcol_abj_so_price_per_kg"
                });
                console.log('pricePerKG', pricePerKG)
                var unitRate = currentRecordObj.getCurrentSublistValue({
                    sublistId : "item",
                    fieldId : "unitconversionrate"
                })
                console.log('unitRate', unitRate)
                var newRate = Number(unitRate) * Number(pricePerKG)
                console.log('newRate', newRate)
                if(pricePerKG){
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        value: newRate,
                    });
                }
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});