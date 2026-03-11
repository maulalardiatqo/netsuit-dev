/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    const beforeSubmit = (scriptContext) => {
        const { newRecord, type } = scriptContext;
        
        if (type !== scriptContext.UserEventType.CREATE && type !== scriptContext.UserEventType.EDIT) return;

        try {
            const lineCount = newRecord.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const unitConv = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitconversion',
                    line: i
                });

                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_unitconversion_fulfill',
                    line: i,
                    value: unitConv
                });
            }
        } catch (e) {
            log.error('Error Syncing Unit Conversion', e);
        }
    };

    return { beforeSubmit };
});