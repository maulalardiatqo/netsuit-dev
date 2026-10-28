/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search'], (record, log, search) => {

    const afterSubmit = (scriptContext) => {
        const triggerContexts = ['create', 'edit', 'copy'];
        
        if (!triggerContexts.includes(scriptContext.type)) return;

        try {
            const newRecord = scriptContext.newRecord;
            
            log.debug('newRecord.id', newRecord.id)
            let taskSegmentData = {};
            if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                const budgLineSearchObj = search.create({
                    type: "customrecord_stc_prj_budg_line",
                    filters: [
                       ["custrecord_stc_prj_budg_link", "anyof", newRecord.id] 
                    ],
                    columns: [
                       search.createColumn({name: "internalid", label: "Internal ID"}),
                       search.createColumn({
                          name: "cseg_stc_segmentdea",
                          join: "CUSTRECORD_STC_PRJ_BUDG_LINE_TASK",
                          label: "DEA Segment"
                       }),
                       search.createColumn({
                          name: "cseg_stc_drc_segmen",
                          join: "CUSTRECORD_STC_PRJ_BUDG_LINE_TASK",
                          label: "DRC Segment"
                       })
                    ]
                });

                // Mapping hasil search ke dalam Object untuk mempermudah lookup
                budgLineSearchObj.run().each(function(result){
                    let internalId = result.getValue({ name: "internalid" });
                    let deaSegment = result.getValue({ 
                        name: "cseg_stc_segmentdea", 
                        join: "CUSTRECORD_STC_PRJ_BUDG_LINE_TASK" 
                    });
                    let drcSegment = result.getValue({ 
                        name: "cseg_stc_drc_segmen", 
                        join: "CUSTRECORD_STC_PRJ_BUDG_LINE_TASK" 
                    });

                    if (internalId) {
                        taskSegmentData[internalId] = {
                            dea: deaSegment,
                            drc: drcSegment
                        };
                    }
                    return true; 
                });
                
                log.debug('Mapped Segment Data', JSON.stringify(taskSegmentData));
            }

            // 2. Load Record Utama
            const objRecord = record.load({
                type: newRecord.type,
                id: newRecord.id,
                isDynamic: false 
            });

            const sublistId = 'recmachcustrecord_stc_prj_budg_link';
            const lineCount = objRecord.getLineCount({ sublistId: sublistId });

            if (lineCount <= 0) return;
            
            var totalAll = 0;
            
            // 3. Looping Sublist
            for (let i = 0; i < lineCount; i++) {
                
                // === START: Logika baru untuk mapping Segment pada mode Edit ===
                if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                    // Ambil internal id dari line sublist (ID dari record anak)
                    let lineInternalId = objRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'id',
                        line: i
                    });

                    // Cek apakah lineID tersebut ada di hasil search
                    if (lineInternalId && taskSegmentData[lineInternalId]) {
                        let segData = taskSegmentData[lineInternalId];

                        if (segData.dea) {
                            objRecord.setSublistValue({
                                sublistId: sublistId,
                                fieldId: 'cseg_stc_segmentdea',
                                line: i,
                                value: segData.dea
                            });
                        }
                        
                        if (segData.drc) {
                            objRecord.setSublistValue({
                                sublistId: sublistId,
                                fieldId: 'cseg_stc_drc_segmen',
                                line: i,
                                value: segData.drc
                            });
                        }
                    }
                }
                // === END: Logika baru ===


                // === START: Logika perhitungan existing ===
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
                
                objRecord.setSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_stc_total_amount_budget_phase',
                    line: i,
                    value: grandTotal
                });
                
                totalAll = Number(totalAll) + Number(grandTotal);
                // === END: Logika perhitungan existing ===
            }

            objRecord.setValue({
                fieldId : "custrecord_stc_total_draft_prj_budg",
                value : totalAll
            });

            objRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true 
            });
            
            log.debug('Success', 'Record Saved Successfully in afterSubmit');

        } catch (e) {
            log.error('Error on afterSubmit', e.toString());
        }
    };

    return { afterSubmit };
});