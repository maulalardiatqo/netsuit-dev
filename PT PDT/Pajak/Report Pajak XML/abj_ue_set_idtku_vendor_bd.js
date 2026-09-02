/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {
    
    function beforeSubmit(context) {
        try {
            if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){
                const newRecord = context.newRecord;

                const vatNumber = newRecord.getValue({ fieldId: 'vatregnumber' });
                log.debug('vatNumber', vatNumber);
                if (vatNumber) {
                    const modifiedValue = vatNumber + '000000';
                    log.debug('modifiedValue', modifiedValue)
                    newRecord.setValue({
                        fieldId: 'custentity_id_tku_penerima_penghasilan',
                        value: modifiedValue
                    });

                    log.debug('Set Modified VAT Number', modifiedValue);
                }
            }
            
        } catch (e) {
            log.error('Error in beforeSubmit', e.message);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
