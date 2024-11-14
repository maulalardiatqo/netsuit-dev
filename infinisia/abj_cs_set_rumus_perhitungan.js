/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    var flag = false
    function pageInit(context) {
        console.log('init masuk')
    }
    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        var record = context.currentRecord;
        var cFrom = record.getValue('customform');
        if (sublistName == 'recmachcustrecord_iss_pr_parent'){
            if(sublistFieldName == 'custrecord_iss_avg_busdev'){
                var currentRecordObj = context.currentRecord;
                var leadTimeKirim = currentRecordObj.getCurrentSublistValue({
                    sublistId: "recmachcustrecord_iss_pr_parent",
                    fieldId: "custrecord_iss_lead_time",
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
                        sublistId: "recmachcustrecord_iss_pr_parent",
                        fieldId: "custrecord_iss_rumus_perhitungan",
                        value: valueRumus,
                    });
                }

            } 
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'quantity'){
                console.log('cForm', cFrom);
                if(cFrom == '104'){
                    if(flag){
                        return false
                    }
                    var quantity = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "quantity"
                    });
                    var convRate = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_abj_ratepacksize"
                    });
                    console.log('convRate', convRate);
                    console.log('quantity', quantity);
                    var setOrder = Number(quantity) *  Number(convRate);
                    console.log('setOrder', setOrder);
                    flag = true
                    record.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_pr_total_order",
                        value: setOrder,
                    });
                    flag = false

                }
            }
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_pr_total_order'){
                console.log('cForm', cFrom);
                if(cFrom == '104'){
                    if(flag){
                        return false
                    }
                    var order = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_pr_total_order"
                    });
                    var convRate = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_abj_ratepacksize"
                    });
                    console.log('convRate', convRate);
                    console.log('order', order);
                    var setQty = Number(order) /  Number(convRate);
                    console.log('setQty', setQty);
                    flag = true
                    record.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: setQty,
                    });
                    flag = false

                }
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});