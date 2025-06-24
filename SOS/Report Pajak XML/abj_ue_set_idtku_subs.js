/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {
    
    function beforeSubmit(context) {
        try {
            if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){
                const newRecord = context.newRecord;
                const vatNumberField = newRecord.getField({ fieldId: 'federalidnumber' });
                log.debug('vatNumberField', vatNumberField)
                const rec = record.load({
                    type: newRecord.type,
                    id: newRecord.id,
                    isDynamic: false
                });
                const vatNumber = rec.getValue({ fieldId: 'federalidnumber' });
                log.debug('vatNumber (from load)', vatNumber);
                if (vatNumber) {
                    const modifiedValue = vatNumber + '000000';
                    log.debug('modifiedValue', modifiedValue)
                    newRecord.setValue({
                        fieldId: 'custrecord_sos_id_tku_penjual',
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
