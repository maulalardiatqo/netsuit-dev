/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description 
 */
define(['N/log', 'N/record'], (log, record) => {

    const afterSubmit = (scriptContext) => {
        const triggerContexts = ['create'];
        log.debug('context exc', scriptContext.type);
        
        if (!triggerContexts.includes(scriptContext.type)) return;

        try {
            const newRecord = scriptContext.newRecord;
            var recId = newRecord.id
            log.debug('recId', recId)
            var recLoad = record.load({
                type : "customrecord_stc_prj_budg_line",
                id : recId,
                isDynamic : true
            })
            let grandTotal = 0; 

            for (let year = 1; year <= 5; year++) {

                let yearTotal = 0;
                const startPeriod = ((year - 1) * 12) + 1;
                const endPeriod = year * 12;
                log.debug('year',{startPeriod : startPeriod, endPeriod : endPeriod})
                for (let period = startPeriod; period <= endPeriod; period++) {

                    const periodValue = Number(recLoad.getValue({
                        fieldId: `custrecord_prj_budg_line_period_${period}`
                    })) || 0;
                    log.debug('periodValue', {periodValue : periodValue, period : period})
                    yearTotal += periodValue;
                }
                log.debug('data year and mount set', {year : year, yearTotal : yearTotal})
                recLoad.setValue({
                    fieldId: `custrecord_stc_budg_phase_totaly${year}`,
                    value: yearTotal
                });

                grandTotal += yearTotal;
            }
            
            log.debug('grandTotal', grandTotal);
            
            recLoad.setValue({
                fieldId: 'custrecord_stc_total_amount_budget_phase',
                value: grandTotal
            });
            recLoad.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });


        } catch (e) {
            log.error('Error on afterSubmit', e.toString());
        }
    };

    return { afterSubmit };
});