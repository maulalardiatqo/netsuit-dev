/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function saveRecord(context){
        var rec = context.currentRecord;
        var cekTypePO = rec.getValue('custbody_stc_po_type');
        console.log('cekTypePO', cekTypePO)
        if(cekTypePO == 2){
            var cektypeRecruitment = rec.getValue('custbody_stc_type_recruitement');
            var cekTotalTrans = rec.getValue('total');
                console.log('cekTotalTrans', cekTotalTrans);
            if(cektypeRecruitment == 1){
                if(Number(cekTotalTrans) < 25000000){
                    alert('The FAS amount must be greater than 25 million');
                    return false
                }
            }else{
                if(Number(cekTotalTrans) > 25000000){
                    alert('The PAF amount must be less than 25 million')
                }
            }
        }
        return true
    }
    return{
        saveRecord : saveRecord
    }
})
