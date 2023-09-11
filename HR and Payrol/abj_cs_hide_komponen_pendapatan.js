/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord',], function (currentRecord,) {
    function pageInit(context) {
        console.log('masuk');
        var currentRecordObj = currentRecord.get();
        var lamaPeriod = currentRecordObj.getField({
            fieldId : 'custrecord_tipe_pajak'
        });
        lamaPeriod.isDisplay = false;

    }

    function fieldChanged(context) {
        var currentRecordObj = currentRecord.get();
        var lamaPeriod = currentRecordObj.getField({
            fieldId : 'custrecord_tipe_pajak'
        });
        lamaPeriod.isDisplay = false;
        if(context.fieldId == 'custrecord_is_pph_21'){
            console.log('change');
            var pph21 = currentRecordObj.getValue('custrecord_is_pph_21');
            if(pph21 == true){
                lamaPeriod.isDisplay = true;
            }else{
                lamaPeriod.isDisplay = false;
            }
        }
        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
