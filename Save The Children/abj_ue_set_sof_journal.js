/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], (record) => {

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.EDIT) return;

        try {
            const rec = record.load({
                type: context.newRecord.type,
                id: context.newRecord.id,
                isDynamic: false
            });
            var cekRecId = rec.id
            if(cekRecId == 310){
                const lineCount = rec.getLineCount({ sublistId: 'line' });

                for (let i = 0; i < lineCount; i++) {
                    const lineNum = rec.getSublistValue({
                        sublistId: 'line',
                        fieldId: 'line',
                        line: i
                    });
                    log.debug('lineNum', lineNum)
                    if (lineNum === 3) {
                        rec.setSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_sof',
                            line: i,
                            value: 5 // update dengan nilai "5"
                        });
                    }
                }

                rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
            }

           
        } catch (e) {
            log.error('Error update journal', e);
        }
    };

    return { afterSubmit };

});
