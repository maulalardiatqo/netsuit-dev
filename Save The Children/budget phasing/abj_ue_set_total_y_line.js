/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description Script for Budget Line Calculations and Sourcing Custom Segments from Project Task
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => { // Tambahkan N/search

    const afterSubmit = (scriptContext) => {
        const triggerContexts = ['create'];
        log.debug('context exc', scriptContext.type);
        
        if (!triggerContexts.includes(scriptContext.type)) return;

        try {
            const newRecord = scriptContext.newRecord;
            const recId = newRecord.id;
            log.debug('recId', recId);
            
            // Load record utama
            let recLoad = record.load({
                type: "customrecord_stc_prj_budg_line",
                id: recId,
                isDynamic: true
            });

            // =========================================================
            // 1. LOGIC PERHITUNGAN BUDGET
            // =========================================================
            let grandTotal = 0; 

            for (let year = 1; year <= 5; year++) {
                let yearTotal = 0;
                const startPeriod = ((year - 1) * 12) + 1;
                const endPeriod = year * 12;
                
                for (let period = startPeriod; period <= endPeriod; period++) {
                    const periodValue = Number(recLoad.getValue({
                        fieldId: `custrecord_prj_budg_line_period_${period}`
                    })) || 0;
                    yearTotal += periodValue;
                }
                
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

            // =========================================================
            // 2. LOGIC SOURCING CUSTOM SEGMENT DARI PROJECT TASK
            // =========================================================
            const taskId = newRecord.getValue({ fieldId: 'custrecord_stc_prj_budg_line_task' });
            
            if (taskId) {
                // Panggil helper function dengan passing object recLoad dan taskId
                setSegmentFromTask(recLoad, taskId);
            }

            // =========================================================
            // 3. SAVE RECORD
            // =========================================================
            recLoad.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

        } catch (e) {
            log.error('Error on afterSubmit', e.toString());
        }
    };

    /**
     * Helper function untuk mengambil value dari Project Task dan set ke Budget Line
     * @param {record.Record} recLoad - Object record budget line yang sedang di-load
     * @param {string|number} taskId - ID dari record Project Task
     */
    const setSegmentFromTask = (recLoad, taskId) => {
        try {
            // Gunakan lookupFields (Lebih efisien daripada record.load)
            const taskData = search.lookupFields({
                type: search.Type.PROJECT_TASK, // atau 'projecttask'
                id: taskId,
                columns: ['cseg_stc_drc_segmen', 'cseg_stc_segmentdea']
            });

            log.debug('taskData lookup result', taskData);

            // Validasi & Set Value cseg_stc_drc_segmen
            if (taskData.cseg_stc_drc_segmen && taskData.cseg_stc_drc_segmen.length > 0) {
                recLoad.setValue({
                    fieldId: 'cseg_stc_drc_segmen',
                    value: taskData.cseg_stc_drc_segmen[0].value
                });
            }

            // Validasi & Set Value cseg_stc_segmentdea
            if (taskData.cseg_stc_segmentdea && taskData.cseg_stc_segmentdea.length > 0) {
                recLoad.setValue({
                    fieldId: 'cseg_stc_segmentdea',
                    value: taskData.cseg_stc_segmentdea[0].value
                });
            }

        } catch (error) {
            log.error('Error in setSegmentFromTask', error.toString());
        }
    };

    return { afterSubmit };
});