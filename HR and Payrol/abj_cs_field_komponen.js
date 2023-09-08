/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord',], function (currentRecord,) {
    function pageInit(context) {
        console.log('masuk');
        var currentRecordObj = currentRecord.get();
        var pph21Field = currentRecordObj.getField({
            fieldId: 'custpage_pph21'
        });
        currentRecordObj.setValue({
            fieldId : 'custpage_pph21',
            value : true
        })
    }

    function fieldChanged(context) {
        if(context.fieldId == 'custpage_pph21'){
            console.log('change');

            var currentRecordObj = currentRecord.get();
            var pph21Field = currentRecordObj.getField({
                fieldId: 'custpage_pph21'
            });
            var tipeA1Field = currentRecordObj.getField({
                fieldId: 'custpage_tipe_a1'
            });
            var valuepph21 = currentRecordObj.getValue('custpage_pph21');
            console.log(valuepph21);
            if(valuepph21){
                tipeA1Field.isDisplay = true;
            }else{
                tipeA1Field.isDisplay = false;
            }
        }
        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
