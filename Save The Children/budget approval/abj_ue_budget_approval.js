/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
  function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW){
            try {
                const currentUser = runtime.getCurrentUser();
                const employeeId = currentUser.id;

                const rec = context.newRecord;
                let allowButton = false;

                // === Cek sublist Item ===
                const itemCount = rec.getLineCount({ sublistId: 'item' });
                for (let i = 0; i < itemCount; i++) {
                    const approver = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_stc_approver_linetrx',
                        line: i
                    });
                    const approvalStatus = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_stc_approval_status_line',
                        line: i
                    });

                    if (Number(approver) === Number(employeeId) &&
                        Number(approvalStatus) === 1) {
                        allowButton = true;
                        break;
                    }
                }
                if (!allowButton) {
                    const expCount = rec.getLineCount({ sublistId: 'expense' });
                    for (let j = 0; j < expCount; j++) {
                        const approver = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_stc_approver_linetrx',
                            line: j
                        });
                        const approvalStatus = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_stc_approval_status_line',
                            line: j
                        });
                        log.debug('approvalStatus', approvalStatus)
                        if (Number(approver) === Number(employeeId) &&
                            Number(approvalStatus) === 1) {
                            allowButton = true;
                            break;
                        }
                    }
                }
                log.debug('allowButton', allowButton)
                if (!allowButton) {
                    var cekApproval = rec.getValue('approvalstatus');
                    log.debug('cekApproval')
                    
                        context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_button.js';
                        log.debug('Client Script Loaded', 'Button will be hidden');

                    
                } else {
                    log.debug('Client Script Not Loaded', 'User is approver and status=1, button allowed');
                }

            } catch (e) {
                log.error('Error in beforeLoad', e);
            }
        }
        
    }

    const toInt = (v) => {
        const n = parseInt(v, 10);
        return isNaN(n) ? 0 : n;
    };

    function afterSubmit(context) {
        try {
            if (context.type !== context.UserEventType.EDIT) return;

            const currentUser = runtime.getCurrentUser();
            const employeeId = toInt(currentUser.id);

            const rec    = context.newRecord;
            const recOld = context.oldRecord;

            const valueBefore = recOld.getValue('custbody_stc_approval_by');
            const cekTrigger  = rec.getValue('custbody_stc_approval_by');

            const oldVal = toInt(valueBefore);
            const newVal = toInt(cekTrigger);

            const oldApprovalStatus = toInt(recOld.getValue('approvalstatus'));
            const newApprovalStatus = toInt(rec.getValue('approvalstatus'));

            log.debug('before/after', { 
                oldVal, newVal, 
                employeeId, 
                oldApprovalStatus, newApprovalStatus 
            });

            const recLoad = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: false
            });

            const updateLinesForUser = (sublistId, statusValue) => {
                const count = recLoad.getLineCount({ sublistId });
                for (let i = 0; i < count; i++) {
                    const approver = toInt(recLoad.getSublistValue({
                        sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i
                    }));
                    if (approver === employeeId) {
                        recLoad.setSublistValue({
                            sublistId,
                            fieldId: 'custcol_stc_approval_status_line',
                            line: i,
                            value: statusValue
                        });
                        log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                    }
                }
            };

            /**
             * Jika header approvalstatus berubah jadi 3 (Reject)
             * maka update semua line milik employeeId ke 3
             */
            if (oldApprovalStatus !== 3 && newApprovalStatus === 3) {
                log.debug('Reject', 'Approval status berubah jadi 3 (Reject), update line');
                updateLinesForUser('item', 3);
                updateLinesForUser('expense', 3);

                recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.debug('Selesai Reject', 'Line milik user diset ke 3');
                return;
            }

            /**
             * Jika custbody_stc_approval_by berubah → logic approve
             */
            if (newVal !== oldVal && employeeId === newVal) {
                log.debug('Masuk eksekusi approve');

                // ---- Update line milik current user ke status 2 ----
                updateLinesForUser('item', 2);
                updateLinesForUser('expense', 2);

                // ---- Cek apakah semua line sudah approved ----
                const isAllApproved = () => {
                    let approverLines = 0;
                    let notApproved   = 0;

                    const scan = (sublistId) => {
                        const count = recLoad.getLineCount({ sublistId });
                        for (let i = 0; i < count; i++) {
                            const approver = toInt(recLoad.getSublistValue({
                                sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i
                            }));
                            if (approver > 0) {
                                approverLines++;
                                const statusLineNow = toInt(recLoad.getSublistValue({
                                    sublistId, fieldId: 'custcol_stc_approval_status_line', line: i
                                }));
                                if (statusLineNow !== 2) notApproved++;
                            }
                        }
                    };

                    scan('item');
                    scan('expense');

                    log.debug('Approval scan result', { approverLines, notApproved });
                    if (approverLines === 0) return false;
                    return notApproved === 0;
                };

                if (isAllApproved()) {
                    recLoad.setValue({ fieldId: 'custbody_stc_approval_budget_holder', value: true });
                    log.debug('Header', 'Semua line approved -> approvalstatus = 2');
                } else {
                    log.debug('Header', 'Masih ada line belum approved');
                }

                recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.debug('Selesai Approve', 'Record tersimpan');
            }
            if (oldApprovalStatus === 3 && newApprovalStatus === 1) {
                log.debug('Reset', 'Approval status berubah dari 3 ke 1, reset semua line jadi 1');
                recLoad.setValue({
                        fieldId : 'custbody_stc_last_approve_at',
                        value : '',
                        ignoreMandatoryFields : true
                    })
                    
                    recLoad.setValue({
                        fieldId : 'custbody_stc_approval_budget_holder',
                        value : false,
                        ignoreMandatoryFields : true
                    })
                const resetLines = (sublistId, statusValue) => {
                    const count = recLoad.getLineCount({ sublistId });
                    for (let i = 0; i < count; i++) {
                        recLoad.setSublistValue({
                            sublistId,
                            fieldId: 'custcol_stc_approval_status_line',
                            line: i,
                            value: statusValue
                        });
                        
                        log.debug(`Reset ${sublistId}`, `Line ${i} diset ke ${statusValue}`);
                    }
                    
                };

                resetLines('item', 1);
                resetLines('expense', 1);

                recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.debug('Selesai Reset', 'Semua line approval status diset ke 1');
                return;
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }
    return{
        afterSubmit : afterSubmit,
        beforeLoad : beforeLoad
    }
});