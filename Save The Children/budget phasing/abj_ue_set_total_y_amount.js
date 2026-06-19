/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

    const afterSubmit = (scriptContext) => {
        const triggerContexts = ['create', 'edit', 'copy'];
        
        if (!triggerContexts.includes(scriptContext.type)) return;

        try {
            const newRecord = scriptContext.newRecord;
            
            const objRecord = record.load({
                type: newRecord.type,
                id: newRecord.id,
                isDynamic: true
            });

            const sublistId = 'recmachcustrecord_stc_prj_budg_link';
            const lineCount = objRecord.getLineCount({ sublistId: sublistId });

            if (lineCount <= 0) return;

            for (let i = 0; i < lineCount; i++) {
                objRecord.selectLine({ sublistId: sublistId, line: i });

                for (let year = 1; year <= 5; year++) {
                    let yearTotal = 0;
                    const startPeriod = ((year - 1) * 12) + 1;
                    const endPeriod = year * 12;

                    for (let period = startPeriod; period <= endPeriod; period++) {
                        const periodValue = Number(objRecord.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: `custrecord_prj_budg_line_period_${period}`
                        })) || 0;

                        yearTotal += periodValue;
                    }

                    objRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: `custrecord_stc_budg_phase_totaly${year}`,
                        value: yearTotal,
                        ignoreFieldChange: true
                    });
                }

                objRecord.commitLine({ sublistId: sublistId });
            }

            objRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

        } catch (e) {
            log.error('Error on afterSubmit', e.toString());
        }
    };

    return { afterSubmit };
});