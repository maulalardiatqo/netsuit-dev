/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/log'], function(record, log) {
    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            log.debug('trigerred')
            var newRecord = context.newRecord;
       
            var arLocked = newRecord.getValue('closed');

            log.debug('arLocked', arLocked)
            if (arLocked == true) {
                throw new Error('End date harus lebih besar dari start date.');
            }
        }
        
       

    }

    function someCustomCondition() {
        // Tambahkan kondisi sesuai kebutuhan bisnis
        return true;
    }

    return {
        beforeSubmit: beforeSubmit
    };
});