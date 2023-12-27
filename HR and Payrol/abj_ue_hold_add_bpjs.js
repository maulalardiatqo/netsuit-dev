/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
    function beforeSubmit(context) {
        if( context.type === context.UserEventType.CREATE){
            var newRecord = context.newRecord;
            var recordType = newRecord.type;
    
            var bpjsSearch = search.create({
                type: recordType, 
                filters: []
            });
            var existingBpjsRecords = bpjsSearch.run().getRange({ start: 0, end: 1 });
    
            if (existingBpjsRecords && existingBpjsRecords.length > 0) {
                var errorMessage = 'BPJS record already exists. Only one BPJS record is allowed';
                throw error.create({
                    name: 'CUSTOM_ERROR',
                    message: errorMessage,
                    notifyOff: true
                });
            }
        }
        if( context.type === context.UserEventType.DELETE){
            var newRecord = context.newRecord;
            var recordId = newRecord.id;
            log.debug("recordId", recordId)
            if (recordId == 1) {
                throw error.create({
                    name: 'INVALID_RECORD_DELETION',
                    message: 'this record cannot be delet.'
                });
            }
        }
       
    }
    return{
        beforeSubmit : beforeSubmit
    }
});