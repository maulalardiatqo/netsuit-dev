/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

    const beforeLoad = (context) => {
        try {
            // Check if the script is triggered on the UI
            if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
                const form = context.form;
                log.debug('trigerred')
                const totalValueField = form.getField({ id: 'totalvalue' });
                log.debug('totalValueField', totalValueField)
                if (totalValueField) {
                    totalValueField.updateDisplayType({ displayType: 'hidden' });
                } else {
                    log.debug('Field Not Found', 'The field with ID "totalvalue" does not exist on the form.');
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    return {
        beforeLoad
    };
});