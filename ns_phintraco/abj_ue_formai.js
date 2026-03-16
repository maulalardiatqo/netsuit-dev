/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/log'], (record, runtime, search, log) => {

    const beforeLoad = (context) => {
        try {
            const form = context.form;
            const rec = context.newRecord;
            const recId = rec.id;
            const currentUser = runtime.getCurrentUser();
            const isAdmin = currentUser.role == 3; // Role Administrator
            
            form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js";

            if (context.type === context.UserEventType.VIEW) {
                const approvalStatus = rec.getValue('approvalstatus'); 
                const idWeb = rec.getValue('custbody_id_web');
                const creatorPo = rec.getValue('custbody_abj_creator');
                const isAfterRecall = rec.getValue('custbody_after_recall');
                const isRevision = rec.getValue('custbody_is_revision');

                // Logic isAttach & isApprover
                let isAttach = search.create({
                    type: 'customrecord_attachment',
                    filters: [['custrecord_a_id', 'anyof', recId]]
                }).runPaged().count > 0;

                let isApprover = search.create({
                    type: 'customrecord_abj_approval',
                    filters: [['custrecord_abj_a_id', 'anyof', recId]]
                }).runPaged().count > 0;

                // --- LOGIC BUTTONS ---

                // 1. Submit For Approval (Kondisi Awal)
                if (approvalStatus == '1' && isApprover && isAttach && !idWeb && creatorPo) {
                    form.addButton({
                        id: 'custpage_button_submit_app',
                        label: "Submit For Approval",
                        functionName: "submitApp()"
                    });
                    // Hanya remove Edit jika bukan Admin
                    if (!isAdmin) form.removeButton('edit');
                }

                // 2. Recall (Status Pending & Ada ID Web)
                if (approvalStatus == '1' && idWeb && !isAfterRecall) {
                    form.addButton({
                        id: 'custpage_button_recall',
                        label: "Recall",
                        functionName: "recall()"
                    });
                    if (!isAdmin) form.removeButton('edit');
                }

                // 3. Reject Condition
                if (approvalStatus == '3' && idWeb) {
                }

                // 4. Approved Condition & Revision
                if (approvalStatus == '2' && idWeb) {
                    if (isRevision) {
                        form.addButton({
                            id: 'custpage_button_resubmit_rev',
                            label: "Submit Revision",
                            functionName: "resubmitRevission()"
                        });
                        if (!isAdmin) form.removeButton('edit');
                    }
                }
            }

            if (context.type === context.UserEventType.EDIT) {
                const isEverApprove = rec.getValue('custbody_ever_approve');
                if (isEverApprove) {
                    let field = form.getField({ id: 'custbody_ever_approve' });
                    if (field) field.updateDisplayType({ displayType: 'disabled' });
                }
            }
        } catch (e) {
            log.error('Error beforeLoad', e);
        }
    };

    const beforeSubmit = (context) => {
        try {
            if (context.type === context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const oldRec = context.oldRecord;
                const newApp = newRec.getValue('approvalstatus');
                const oldApp = oldRec.getValue('approvalstatus');
                const isEverApprove = newRec.getValue('custbody_ever_approve');

                if (!isEverApprove && oldApp == '1' && newApp == '2') {
                    newRec.setValue({ fieldId: 'custbody_ever_approve', value: true });
                }

                if (oldApp == '2') {
                    newRec.setValue({ fieldId: 'custbody_is_revision', value: true });
                }

                if (newRec.getValue('custbody_after_recall') == true) {
                    newRec.setValue({ fieldId: 'custbody_after_recall', value: false });
                }
            }

            if (context.type === context.UserEventType.COPY) {
                const rec = context.newRecord;
                const fields = ['custbody_id_web', 'custbody_abj_revision_code'];
                fields.forEach(f => rec.setValue({ fieldId: f, value: '' }));
                
                rec.setValue({ fieldId: 'custbody_after_recall', value: false });
                rec.setValue({ fieldId: 'custbody_is_revision', value: false });
                rec.setValue({ fieldId: 'custbody_ever_approve', value: false });
            }
        } catch (e) {
            log.error('Error beforeSubmit', e);
        }
    };

    return { beforeLoad, beforeSubmit };
});