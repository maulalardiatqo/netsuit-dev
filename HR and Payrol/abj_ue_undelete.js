/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error'], function(record, log, error) {

    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        var recordId = newRecord.id;

        if (recordId == 2) {
            throw error.create({
                name: 'INVALID_RECORD_DELETION',
                message: 'this record cannot be delet.'
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };

});
