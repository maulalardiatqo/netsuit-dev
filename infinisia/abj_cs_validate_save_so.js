/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/record', 'N/search'], function (message, record, search) {

    function saveRecord(context) {
        try {
            var currentRecord = context.currentRecord;
            
            var isHaveFile = currentRecord.getValue('custbody_abj_file_attach');
            console.log('isHaveFile', isHaveFile)
            if(isHaveFile == false){
                alert('harap lampirkan dokumen PO Customer terlebih dahulu');
                return false
            }else{
                return true
            }
        } catch (error) {
            console.error('Error validating attached file:', error);
            return false;
        }
    }

    return {
        saveRecord: saveRecord
    };
});
