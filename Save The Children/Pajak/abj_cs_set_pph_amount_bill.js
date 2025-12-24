/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    function validateLine(context){
        var currentRecordObj = context.currentRecord;
        var sublistName = context.sublistId;
        if(sublistName == 'item' || sublistName == 'expense'){
            var amountTax = currentRecordObj.getCurrentSublistValue({
                sublistId : sublistName,
                fieldId : 'custcol_4601_witaxamount'
            });
            if(amountTax){
                amountTax = parseFloat(amountTax) || 0;
                currentRecordObj.setCurrentSublistValue({
                    sublistId : sublistName,
                    fieldId : 'custcol_stc_pph_amount',
                    value : Math.abs(amountTax)
                })
            }
        }
        return true
    }
    function fieldChanged(context){
        var currentRecordObj = context.currentRecord;
         var fieldName = context.fieldId;
         if(fieldName == 'custbody_stc_npwp_vendor'){
            var cekNpwp = currentRecordObj.getValue('custbody_stc_npwp_vendor');
            if(cekNpwp){
                var idTku = cekNpwp + '000000';
                if(idTku){
                    currentRecordObj.setValue({
                        fieldId : 'custbody_stc_id_tku_penerima_penghasil',
                        value : idTku
                    });
                }
            }
         }
    }
    return{
        validateLine : validateLine,
        fieldChanged : fieldChanged
    }
});