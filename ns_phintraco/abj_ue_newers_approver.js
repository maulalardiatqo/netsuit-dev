/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'], (record, search, runtime, serverWidget) => {

    const beforeLoad = (context) => {
        try {
            const { form, newRecord, type } = context;
            const recId = newRecord.id;

            if (type === context.UserEventType.VIEW) {
                const appStatus = newRecord.getValue('approvalstatus'); 
                const idWeb = newRecord.getValue('custbody_id_web');
                const isAfterRecall = newRecord.getValue('custbody_after_recall');
                const readyResubmit = newRecord.getValue('custbody_abj_ready_resubmit');
                const isEverApprove = newRecord.getValue('custbody_ever_approve');
                const isAfterRevision = newRecord.getValue('custbody_abj_revision');
                const isAfterEdit = newRecord.getValue('custbody_after_edit_save');
                log.debug('condition', {isEverApprove : isEverApprove, isAfterRecall : isAfterRecall, readyResubmit : readyResubmit, isAfterRevision : isAfterRevision})
                const currentRole = runtime.getCurrentUser().role;
                const roleAdmin = 3;

                let hasAttach = checkAttachment(recId);
                let hasApprover = checkApprover(recId);

                if ((!idWeb && appStatus == '1' && hasAttach && hasApprover)) {
                    form.addButton({
                        id: 'custpage_btn_submit_app',
                        label: 'Submit For Approval',
                        functionName: 'submitApp()'
                    });
                }
                log.debug('isAfterRecall', isAfterRecall)
                if (idWeb && appStatus == '1' && !isAfterRecall) {
                    if (currentRole != roleAdmin) {
                        form.removeButton('edit');
                        form.addButton({
                            id: 'custpage_btn_recall',
                            label: 'Recall',
                            functionName: 'recall()'
                        });
                    }
                    
                }

                // --- 3. RESUBMIT APPROVAL (Setelah Reject atau Recall + Save) ---
                log.debug('readyResubmit', readyResubmit)
                if (readyResubmit && (appStatus == '3' || (appStatus == '1' && isAfterRecall) || (appStatus == '1' && currentRole == roleAdmin))) {
                    form.addButton({
                        id: 'custpage_btn_resubmit_app',
                        label: 'Resubmit For Approval',
                        functionName: 'resubmitApproval()'
                    });
                }

                // --- 4. SUBMIT REVISION (Setelah Approved + Save) ---
                // Syarat: Status 2 (Approved), Ada ID Web, dan SUDAH melalui proses Edit & Save (readyResubmit)
                if (appStatus == '2' && idWeb && readyResubmit) {
                    form.addButton({
                        id: 'custpage_btn_revision',
                        label: 'Submit Revision',
                        functionName: 'resubmitRevission()'
                    });
                }

                form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js";
            }
            if(type === context.UserEventType.EDIT){
                const isEverApprove = newRecord.getValue('custbody_ever_approve');
                if(isEverApprove){
                    let fieldCreator = context.form.getField({
                        id: 'custbody_abj_creator'
                    });

                    // Pastikan field ditemukan sebelum melakukan update
                    if (fieldCreator) {
                        fieldCreator.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        
                        log.debug('UI Change', 'Field custbody_abj_creator has been disabled.');
                    }
                }
            }
            if (type === context.UserEventType.COPY) {
                const fieldsToReset = ['custbody_id_web', 'custbody_after_recall', 'custbody_ever_approve', 'custbody_abj_revision_code', 'custbody_abj_ready_resubmit', 'custbody_abj_revision', 'custbody_after_edit_save'];
                fieldsToReset.forEach(f => newRecord.setValue(f, (f === 'custbody_id_web' || f === 'custbody_abj_revision_code') ? '' : false));
            }

        } catch (e) {
            log.error('Error beforeLoad', e);
        }
    };

    const afterSubmit = (context) => {
        try {
            if (context.type === context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const appStatus = newRec.getValue('approvalstatus');
                const isAfterRecall = newRec.getValue('custbody_after_recall');
                const idWeb = newRec.getValue('custbody_id_web');
                const isEverApprove = newRec.getValue('custbody_ever_approve');
                const roleAdmin = 3;
                const currentRole = runtime.getCurrentUser().role;

                let updateValues = {};

                if (idWeb && (appStatus == '3' || appStatus == '2' || (appStatus == '1' && isAfterRecall) || (appStatus == '1' && currentRole == roleAdmin) )) {
                    log.debug('masuk kondisi ready resubmit')
                    updateValues['custbody_abj_ready_resubmit'] = true;
                }
                if (appStatus == '2' && !newRec.getValue('custbody_ever_approve')) {
                    updateValues['custbody_ever_approve'] = true;
                }
                
                if (Object.keys(updateValues).length > 0) {
                    record.submitFields({
                        type: newRec.type,
                        id: newRec.id,
                        values: updateValues
                    });
                }
            }
        } catch (e) {
            log.error('Error afterSubmit', e);
        }
    };
    function checkAttachment(recId) {
        return search.create({
            type: 'customrecord_attachment',
            filters: [['custrecord_a_id', 'anyof', recId]]
        }).runPaged().count > 0;
    }

    function checkApprover(recId) {
        return search.create({
            type: 'customrecord_abj_approval',
            filters: [['custrecord_abj_a_id', 'anyof', recId]]
        }).runPaged().count > 0;
    }

    return { beforeLoad, afterSubmit };
});