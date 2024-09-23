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
        if (sublistName == 'inventory'){
            if(sublistFieldName == 'units'){
                var currentRecordObj = context.currentRecord;
                var totalOrder = currentRecordObj.getCurrentSublistValue({
                    sublistId : "inventory",
                    fieldId :"custcol_pr_total_order"
                });
                var units = currentRecordObj.getCurrentSublistText({
                    sublistId : "inventory",
                    fieldId :"units"
                });
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
                        sublistId: "inventory",
                        fieldId: "adjustqtyby",
                        value: qtyToSet || 0,
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