/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'], (record, serverWidget) => {
    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const form = context.form;

                const prepaymentAccountField = form.getField({ id: 'prepaymentaccount' });
                log.debug('prepaymentAccountField', prepaymentAccountField)

                if (prepaymentAccountField) {
                    log.debug('masuk kondisi')
                    prepaymentAccountField.updateDisplayType({
                        displayType: 'NORMAL'
                    });
                }
            }
        } catch (error) {
            log.error('Error in beforeLoad', error.message);
        }
    };

    return { beforeLoad };
});
