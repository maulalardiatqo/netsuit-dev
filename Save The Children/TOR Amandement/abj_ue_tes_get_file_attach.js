/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
    function afterSubmit(context){
        if(context.type == context.UserEventType.EDIT){
            const newRec = context.newRecord;
            var rec = record.load({
                type: newRec.type,
                id: newRec.id
            });

            var lineCount = rec.getLineCount({ sublistId: 'mediaitem' });
            log.debug('lineCount', lineCount)
            for (var i = 0; i < lineCount; i++) {
                var fileId = rec.getSublistValue({
                    sublistId: 'mediaitem',
                    fieldId: 'mediaitem',
                    line: i
                });
                log.debug('File ID line ' + i, fileId);
            }
        }
    }
    return {
        afterSubmit : afterSubmit
    }

});