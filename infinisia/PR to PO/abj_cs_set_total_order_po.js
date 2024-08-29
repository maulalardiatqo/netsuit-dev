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
            if(sublistFieldName == 'quantity'){
                var currentRecordObj = context.currentRecord;
                var quantity = currentRecordObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                });
                var packSize = currentRecordObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "units",
                });
                console.log('leadTimeKirim', leadTimeKirim)
                if(leadTimeKirim){
                    var valueRumus = 0
                    var avgBusdev = currentRecordObj.getCurrentSublistValue({
                        sublistId: "recmachcustrecord_iss_pr_parent",
                        fieldId: "custrecord_iss_avg_busdev",
                    });
                    valueRumus = Number(leadTimeKirim) * Number(avgBusdev)
                    console.log('valueRumus', valueRumus);
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_pr_total_order",
                        value: valueRumus,
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