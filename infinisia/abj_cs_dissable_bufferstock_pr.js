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
                    var cekOsPO = currentRecordObj.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_abj_no_so",
                    })
                    console.log('cekOsPO', cekOsPO)
                    if(cekOsPO){
                        currentRecordObj.getCurrentSublistField({
                            sublistId: 'item',
                            fieldId: 'custcol9',
                        }).isDisabled = true;
                    }else{
                        currentRecordObj.getCurrentSublistField({
                            sublistId: 'item',
                            fieldId: 'custcol9',
                        }).isDisabled = false;
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