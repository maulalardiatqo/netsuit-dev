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
                isDynamic: false 
            });

            const sublistId = 'recmachcustrecord_stc_prj_budg_link';
            const lineCount = objRecord.getLineCount({ sublistId: sublistId });

            if (lineCount <= 0) return;
            var totalAll = 0
            for (let i = 0; i < lineCount; i++) {
                
                let grandTotal = 0; 

                for (let year = 1; year <= 5; year++) {
                    let yearTotal = 0;
                    const startPeriod = ((year - 1) * 12) + 1;
                    const endPeriod = year * 12;
                    for (let period = startPeriod; period <= endPeriod; period++) {
                        const periodValue = Number(objRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: `custrecord_prj_budg_line_period_${period}`,
                            line: i
                        })) || 0;

                        yearTotal += periodValue;
                    }
                    
                    objRecord.setSublistValue({
                        sublistId: sublistId,
                        fieldId: `custrecord_stc_budg_phase_totaly${year}`,
                        line: i,
                        value: yearTotal
                    });

                    grandTotal += yearTotal;
                }
                log.debug('grandTotal', grandTotal)
                objRecord.setSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_stc_total_amount_budget_phase',
                    line: i,
                    value: grandTotal
                });
                totalAll = Number(totalAll) + Number(grandTotal)

            }
            objRecord.setValue({
                fieldId : "custrecord_stc_total_draft_prj_budg",
                value : totalAll
            })
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