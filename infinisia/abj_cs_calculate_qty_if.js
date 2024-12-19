/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
        if (context.mode === 'edit') {
            console.log('editMode')
            const record = currentRecord.get();
            const lineCount = record.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const unitConversion = record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitconversion',
                    line: i
                });
                
                record.selectLine({ sublistId: 'item', line: i });

                console.log('unitConversion', unitConversion)
                record.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol15',
                    value: unitConversion
                });

                // Commit the line to save changes
                record.commitLine({ sublistId: 'item' });
            }
            
        }
    }
    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_pr_total_order'){
                var currentRecordObj = context.currentRecord;
                var totalOrder = currentRecordObj.getCurrentSublistValue({
                    sublistId : "item",
                    fieldId :"custcol_pr_total_order"
                });
                
                var units = currentRecordObj.getCurrentSublistText({
                    sublistId : "item",
                    fieldId :"custcol15"
                });
                console.log('totalOrder', totalOrder);
                console.log('units', units)
                if(totalOrder && units){
                    var setQty = Number(totalOrder) / Number(units);
                    console.log('setQty', setQty)
                    currentRecordObj.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        value : setQty
                    })
                }
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});