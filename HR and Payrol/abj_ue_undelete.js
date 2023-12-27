/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error'], function(record, log, error) {

    function beforeSubmit(context) {
        if( context.type === context.UserEventType.DELETE){
            var newRecord = context.newRecord;
            var recordId = newRecord.id;
            log.debug("recordId", recordId)
            if (recordId == 2 || recordId == 3 || recordId == 4) {
                throw error.create({
                    name: 'INVALID_RECORD_DELETION',
                    message: 'this record cannot be delet.'
                });
            }
        }
        
    }

    return {
        beforeSubmit: beforeSubmit
    };

});
