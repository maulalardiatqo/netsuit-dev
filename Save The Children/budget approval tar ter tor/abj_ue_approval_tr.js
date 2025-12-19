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
                const recType = rec.type
                log.debug('recType', recType);
                var recBefLoad = record.load({
                    type : recType,
                    id : rec.id
                })
                var cekIsAPpFA = recBefLoad.getValue('custrecord_tor_approved_by_finance')
                var sublistExpense
                var sublistItem
                var approverField
                var approvalStatusField
                var isItem = true
                if(recType == 'customrecord_tar'){
                    sublistExpense = 'recmachcustrecord_tar_e_id'
                    isItem = false
                }
                if(recType == 'customrecord_ter'){
                    sublistItem = 'recmachcustrecord_terd_id'
                    sublistExpense = 'recmachcustrecord_tar_id_ter'
                    approverField = 'custrecord_terd_approver'
                    approvalStatusField = 'custrecord_terd_approval_status'
                    isItem = true
                }
                if(recType == 'customrecord_tor'){
                    sublistItem = 'recmachcustrecord_tori_id'
                    approverField = 'custrecord_tori_approver'
                    approvalStatusField = 'custrecord_tori_approval_status'
                    isItem = true
                }
                let allowButton = false;
                if(isItem){
                    const itemCount = recBefLoad.getLineCount({ sublistId: sublistItem });
                    log.debug('itemCount', itemCount)
                    if(itemCount > 0){
                        for (let i = 0; i < itemCount; i++) {
                            const approver = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: approverField,
                                line: i
                            });
                            const approvalStatus = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: approvalStatusField,
                                line: i
                            });
                            const approverFA = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: 'custrecord_tori_approver_fa',
                                line: i
                            });
                            const approverSatatusFA = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: 'custrecord_tori_approval_status_fa',
                                line: i
                            });
                            log.debug('approverFA', approverFA)
                            log.debug('approverSatatusFA', approverSatatusFA)
                            log.debug('i', i)
                            if(recType == 'customrecord_tor'){
                                if(Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1){
                                    log.debug('masuk kondisi approve FA')
                                    allowButton = true;
                                    break;
                                }
                                if(cekIsAPpFA){
                                    if (Number(approver) === Number(employeeId) &&
                                        Number(approvalStatus) === 1) {
                                            log.debug('masuk allow')
                                        allowButton = true;
                                        break;
                                    }
                                }
                                
                            }else{
                                if (Number(approver) === Number(employeeId) &&
                                    Number(approvalStatus) === 1) {
                                    allowButton = true;
                                    break;
                                }
                            }
                           
                            
                        }
                    }
                }
                
                
                if (!allowButton) {
                    var childSearch
                    if (recType === 'customrecord_tar') {
                        childSearch = search.create({
                            type: 'customrecord_tar_expenses',
                            filters: [['custrecord_tar_e_id', 'anyof', rec.id]], 
                            columns: [
                                'custrecord_tare_approver',
                                'custrecord_tare_approval_status',
                            ]
                        });
                        const results = childSearch.run().getRange({ start: 0, end: 1000 });
                        const expenseCount = results.length;

                        if (expenseCount > 0) {

                            for (var e = 0; e < expenseCount; e++) {
                                var approverField;
                                var approvalStatusField;
                                var approvalFaField;
                                var approvalStatusFAField;
                                if (recType === 'customrecord_tar') {
                                    approverField = 'custrecord_tare_approver';
                                    approvalStatusField = 'custrecord_tare_approval_status';
                                }

                                const row = results[e];
                                const approver = row.getValue(approverField);
                                const approvalStatus = row.getValue(approvalStatusField);
                                if(approvalFaField){
                                    var approverFA = row.getValue(approvalFaField);
                                }
                                if(approvalStatusFAField){
                                    var approverStatusFA = row.getValue(approvalStatusFAField);
                                }
                                

                                // log.debug('check line', {
                                //     e,
                                //     approver,
                                //     approvalStatus,
                                //     approverFA,
                                //     approverStatusFA,
                                //     employeeId
                                // });

                                if (
                                    Number(approver) === Number(employeeId) &&
                                    Number(approvalStatus) === 1
                                ) {
                                    // log.debug('masuk kondisi approve regular');
                                    allowButton = true;
                                    break;
                                }

                                if (
                                    Number(approverFA) === Number(employeeId) &&
                                    Number(approverStatusFA) === 1
                                ) {
                                    // log.debug('masuk kondisi approve FA');
                                    allowButton = true;
                                    break;
                                }
                            }
                        }
                    }
                    if(recType === 'customrecord_ter'){
                        log.debug('exp')
                        const expCount = recBefLoad.getLineCount({ sublistId: 'recmachcustrecord_tar_id_ter' });
                        log.debug('expCount', expCount)
                        for (let j = 0; j < expCount; j++) {
                            const approver = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tare_approver',
                                line: j
                            });
                            const approvalStatus = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tare_approval_status',
                                line: j
                            });
                            log.debug('approvalStatus', approvalStatus)
                            if (Number(approver) === Number(employeeId) &&
                                Number(approvalStatus) === 1) {
                                    log.debug('kondisi approver')
                                allowButton = true;
                                break;
                            }
                        }
                    }

                    
                }

                log.debug('allowButton', allowButton)
                if (!allowButton) {
                    
                    context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_button.js';
                    // log.debug('Client Script Loaded', 'Button will be hidden');

                    
                } else {
                    // log.debug('Client Script Not Loaded', 'User is approver and status=1, button allowed');
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
            if(context.type === context.UserEventType.EDIT){
                const rec = context.newRecord;
                const currentUser = runtime.getCurrentUser();
                const employeeId = currentUser.id;
                var recId = rec.id
                var recType = rec.type
                const recOld = context.oldRecord;
                var newRecLoad = record.load({
                    type : rec.type,
                    id : rec.id,
                    isDynamic : false
                });
                if(recType == 'customrecord_tor'){
                    log.debug('masuk TOR')
                    const updateLinesForUserTOR = (sublistId, statusValue) => {
                        const count = newRecLoad.getLineCount({ sublistId });
                        for (let i = 0; i < count; i++) {
                            const approver = toInt(newRecLoad.getSublistValue({
                                sublistId, fieldId: 'custrecord_tori_approver', line: i
                            }));
                            if (approver === employeeId) {
                                newRecLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custrecord_tori_approval_status',
                                    line: i,
                                    value: statusValue
                                });
                                log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                            }
                        }
                    };
                    const updateLinesForUserFATOR = (sublistId, statusValue) => {
                        const count = newRecLoad.getLineCount({ sublistId });
                        log.debug('count', count)
                        for (let i = 0; i < count; i++) {
                            const approver = toInt(newRecLoad.getSublistValue({
                                sublistId, fieldId: 'custrecord_tori_approver_fa', line: i
                            }));
                            log.debug('approver', approver)
                            log.debug('employeeId', employeeId)
                            if (approver === employeeId) {
                                log.debug('masuk kondisi app = emp')
                                newRecLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custrecord_tori_approval_status_fa',
                                    line: i,
                                    value: statusValue
                                });
                                log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                            }
                        }
                    };

                    const valueBefore = recOld.getValue('custrecord_tor_approval_by_budget_h');
                    const cekTrigger  = newRecLoad.getValue('custrecord_tor_approval_by_budget_h');

                    const valueBeforeFA = recOld.getValue('custrecord_tor_approval_by_finance');
                    const cekTriggerFA = newRecLoad.getValue('custrecord_tor_approval_by_finance');

                    const oldValFA = toInt(valueBeforeFA);
                    const newValFA = toInt(cekTriggerFA)

                    const oldVal = toInt(valueBefore);
                    const newVal = toInt(cekTrigger);

                    const oldApprovalStatus = toInt(recOld.getValue('custrecord_tor_status'));
                    const newApprovalStatus = toInt(newRecLoad.getValue('custrecord_tor_status'));
                    const cekIsHO = rec.getValue('custrecord_tor_approved_by_budget_h');
                    log.debug('before/after', { 
                        oldVal, newVal, 
                        employeeId, 
                        oldApprovalStatus, newApprovalStatus 
                    });
                    log.debug('before/after', { 
                        oldValFA, newValFA, 
                        employeeId, 
                        oldApprovalStatus, newApprovalStatus 
                    });
                    if (oldApprovalStatus !== 3 && newApprovalStatus === 3) {
                        updateLinesForUserTOR('recmachcustrecord_tori_id', 3)
                        updateLinesForUserFATOR('recmachcustrecord_tori_id', 3)
                        newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug('Selesai Reject', 'Line milik user diset ke 3');
                        return;
                    }
                    if(newValFA !== oldValFA && employeeId === newValFA && cekIsHO === true){
                        updateLinesForUserFATOR('recmachcustrecord_tori_id', 2)
                        const isAllApprovedFA = () => {
                            let approverLines = 0;
                            let notApproved   = 0;

                            const scanFA = (sublistId) => {
                                const count = newRecLoad.getLineCount({ sublistId });
                                for (let i = 0; i < count; i++) {
                                    const approver = toInt(newRecLoad.getSublistValue({
                                        sublistId, fieldId: 'custrecord_tori_approver_fa', line: i
                                    }));
                                    if (approver > 0) {
                                        approverLines++;
                                        const statusLineNow = toInt(newRecLoad.getSublistValue({
                                            sublistId, fieldId: 'custrecord_tori_approval_status_fa', line: i
                                        }));
                                        if (statusLineNow !== 2) notApproved++;
                                    }
                                }
                            };

                            scanFA('recmachcustrecord_tori_id');

                            log.debug('Approval scan FA result', { approverLines, notApproved });
                            if (approverLines === 0) return false;
                            return notApproved === 0;
                        };

                        if (isAllApprovedFA()) {
                            newRecLoad.setValue({ fieldId: 'custrecord_tor_approved_by_finance', value: true });
                            log.debug('Header', 'Semua line approved -> approvalstatusFA = 2');
                        } else {
                            log.debug('Header', 'Masih ada line belum approved FA');
                        }

                        newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug('Selesai Approve FA', 'Record tersimpan');
                    }
                    if(newVal !== oldVal && employeeId === newVal){
                        log.debug('masuk approv budget')
                        updateLinesForUserTOR('recmachcustrecord_tori_id', 2);
                        const isAllApproved = () => {
                            let approverLines = 0;
                            let notApproved   = 0;

                            const scan = (sublistId) => {
                                const count = newRecLoad.getLineCount({ sublistId });
                                for (let i = 0; i < count; i++) {
                                    const approver = toInt(newRecLoad.getSublistValue({
                                        sublistId, fieldId: 'custrecord_tori_approver', line: i
                                    }));
                                    if (approver > 0) {
                                        approverLines++;
                                        const statusLineNow = toInt(newRecLoad.getSublistValue({
                                            sublistId, fieldId: 'custrecord_tori_approval_status', line: i
                                        }));
                                        if (statusLineNow !== 2) notApproved++;
                                    }
                                }
                            };

                            scan('recmachcustrecord_tori_id');

                            log.debug('Approval scan result', { approverLines, notApproved });
                            if (approverLines === 0) return false;
                            return notApproved === 0;
                        };

                        if (isAllApproved()) {
                            newRecLoad.setValue({ fieldId: 'custrecord_tor_approved_by_budget_h', value: true });
                            log.debug('Header', 'Semua line approved -> approvalstatus = 2');
                        } else {
                            log.debug('Header', 'Masih ada line belum approved');
                        }

                        newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug('Selesai Approve', 'Record tersimpan');
                    }
                    if (oldApprovalStatus === 3 && newApprovalStatus === 1) {
                        log.debug('Reset', 'Approval status berubah dari 3 ke 1, reset semua line jadi 1');
                            newRecLoad.setValue({
                                fieldId : 'custrecord_tor_approval_by_budget_h',
                                value : '',
                                ignoreMandatoryFields : true
                            })
                            newRecLoad.setValue({
                                fieldId : 'custrecord_tor_approval_by_finance',
                                value : '',
                                ignoreMandatoryFields : true
                            })
                            
                            newRecLoad.setValue({
                                fieldId : 'custrecord_tor_approved_by_budget_h',
                                value : false,
                                ignoreMandatoryFields : true
                            })
                            newRecLoad.setValue({
                                fieldId : 'custrecord_tor_approved_by_finance',
                                value : false,
                                ignoreMandatoryFields : true
                            })
                        const resetLines = (sublistId, statusValue) => {
                            const count = newRecLoad.getLineCount({ sublistId });
                            for (let i = 0; i < count; i++) {
                                newRecLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custrecord_tori_approval_status',
                                    line: i,
                                    value: statusValue
                                });
                                newRecLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custrecord_tori_approval_status_fa',
                                    line: i,
                                    value: statusValue
                                });
                                
                                log.debug(`Reset ${sublistId}`, `Line ${i} diset ke ${statusValue}`);
                            }
                            
                        };

                        resetLines('recmachcustrecord_tori_id', 1);

                        newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug('Selesai Reset', 'Semua line approval status diset ke 1');
                        return;
                    }

                }else{
                      // field and sublistCondition
                        var sublistName
                        var apprStatusHeader
                        var headerAppBudgetHolder
                        var checkBoxheaderApprovedBy
                        var approverLine
                        var apprStatusLine
                        var lastAppAt
                        var sublistExp
                        if(recType == 'customrecord_tar'){
                            sublistName = "recmachcustrecord_tar_e_id";
                            apprStatusHeader = "custrecord_tar_status";
                            headerAppBudgetHolder = "custrecord_tar_approval_by_budget_holder";
                            checkBoxheaderApprovedBy = "custrecord_tar_approved_by_budget_holder";
                            approverLine = "custrecord_tare_approver";
                            apprStatusLine = "custrecord_tare_approval_status"
                            lastAppAt = "custrecord_tar_approve_budget_holder"
                        }else if(recType == 'customrecord_ter'){
                            sublistName = "recmachcustrecord_terd_id";
                            sublistExp = 'recmachcustrecord_tar_id_ter'
                            apprStatusHeader = "custrecord_ter_status";
                            headerAppBudgetHolder = "custrecord_ter_approval_by_budget_holder";
                            checkBoxheaderApprovedBy = "custrecord_ter_approved_by_budget_h";
                            approverLine = "custrecord_terd_approver";
                            apprStatusLine = "custrecord_terd_approval_status"
                            lastAppAt = "custrecord_ter_last_approve_budget"
                        }

                        var approverOld = recOld.getValue(headerAppBudgetHolder)
                        var approverNew = newRecLoad.getValue(headerAppBudgetHolder)

                        var newApprovalStatus = newRecLoad.getValue(apprStatusHeader)
                        var oldApprovalStatus = recOld.getValue(apprStatusHeader)
                         const updateLinesForUserFA = (sublistId, statusValue) => {
                            const count = newRecLoad.getLineCount({ sublistId });
                            log.debug('count', count)
                            for (let i = 0; i < count; i++) {
                                const approver = toInt(newRecLoad.getSublistValue({
                                    sublistId, fieldId: 'custrecord_tar_approver_fa', line: i
                                }));
                                log.debug('approver', approver)
                                log.debug('employeeId', employeeId)
                                if (approver === employeeId) {
                                    log.debug('masuk kondisi app = emp')
                                    newRecLoad.setSublistValue({
                                        sublistId,
                                        fieldId: 'custrecord_tar_apprvl_sts_fa',
                                        line: i,
                                        value: statusValue
                                    });
                                    log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                                }
                            }
                        };
                        const updateLinesForUser = (sublistName, statusValue) => {
                            log.debug('sublistName', sublistName)
                            if(sublistName == 'recmachcustrecord_tar_id_ter'){
                                approverLine = 'custrecord_tare_approver'
                                apprStatusLine = 'custrecord_tare_approval_status'
                            }
                            const count = newRecLoad.getLineCount({ sublistId: sublistName });
                            if(count > 0){
                                for (let i = 0; i < count; i++) {
                                    const approver = toInt(newRecLoad.getSublistValue({
                                        sublistId : sublistName, 
                                        fieldId: approverLine, 
                                        line: i
                                    }));
                                    if (approver === employeeId) {
                                        newRecLoad.setSublistValue({
                                            sublistId : sublistName, 
                                            fieldId: apprStatusLine,
                                            line: i,
                                            value: statusValue
                                        });
                                        log.debug(`Update ${sublistName}`, `Line ${i} set status -> ${statusValue}`);
                                    }
                                }
                            }
                            
                        };
                        // approve condition
                        if(approverNew != approverOld && employeeId == approverNew){
                            log.debug('approve condition')
                            updateLinesForUser(sublistName, 2);
                            if(sublistExp){
                                updateLinesForUser(sublistExp, 2)
                            }
                            const isAllApproved = () => {
                                let approverLines = 0;
                                let notApproved   = 0;

                                const scan = (sublistName) => {
                                    log.debug('sublistName', sublistName)
                                    if(sublistName == 'recmachcustrecord_tar_id_ter'){
                                        approverLine = 'custrecord_tare_approver'
                                        apprStatusLine = 'custrecord_tare_approval_status'
                                    }
                                    const count = newRecLoad.getLineCount({ sublistId: sublistName });
                                    if(count > 0){
                                        for (let i = 0; i < count; i++) {
                                            const approver = toInt(newRecLoad.getSublistValue({
                                                sublistId : sublistName,
                                                fieldId: approverLine, 
                                                line: i
                                            }));
                                            log.debug('approver', approver)
                                            if (approver > 0) {
                                                approverLines++;
                                                const statusLineNow = toInt(newRecLoad.getSublistValue({
                                                    sublistId : sublistName,
                                                    fieldId: apprStatusLine, 
                                                    line: i
                                                }));
                                                if (statusLineNow !== 2) notApproved++;
                                            }
                                        }
                                    }
                                    
                                };

                                scan(sublistName);
                                var cekLineExp = newRecLoad.getLineCount({
                                    sublistId : sublistExp
                                })
                                log.debug('cekLineExp', cekLineExp)
                                if(cekLineExp > 0){
                                    log.debug('masuk kondisi cekLineExp')
                                    scan(sublistExp);
                                }

                                log.debug('Approval scan result', { approverLines, notApproved });
                                if (approverLines === 0) return false;
                                return notApproved === 0;
                            };

                            if (isAllApproved()) {
                                newRecLoad.setValue({ fieldId: checkBoxheaderApprovedBy, value: true });
                                log.debug('Header', 'Semua line approved -> approvalstatus = 2');
                            } else {
                                log.debug('Header', 'Masih ada line belum approved');
                            }

                            newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                            log.debug('Selesai Approve', 'Record tersimpan');
                        }

                        // reject Condition
                        if(oldApprovalStatus != 3 && newApprovalStatus == 3){
                            updateLinesForUser(sublistName, 3);
                            updateLinesForUser(sublistExp, 3)
                            if(recType == 'customrecord_ter'){
                                updateLinesForUserFA(sublistName, 3)
                                updateLinesForUserFA(sublistExp, 3)
                            }
                            return;
                        }

                        // reset condition
                        if(oldApprovalStatus == 3 && newApprovalStatus == 1){
                            newRecLoad.setValue({
                                fieldId : headerAppBudgetHolder,
                                value : ""
                            })
                            newRecLoad.setValue({
                                fieldId : lastAppAt,
                                value : ""
                            });
                            const resetLines = (sublistName, statusValue) => {
                                if(sublistName == 'recmachcustrecord_tar_id_ter'){
                                    apprStatusLine = 'custrecord_tare_approval_status'
                                }
                                const count = recLoad.getLineCount({ sublistId : sublistName });
                                for (let i = 0; i < count; i++) {
                                    recLoad.setSublistValue({
                                        sublistId : sublistName,
                                        fieldId: apprStatusLine,
                                        line: i,
                                        value: statusValue
                                    });
                                }
                                
                            };
                            resetLines(sublistName, 1);
                            resetLines(sublistExp, 1);
                        }
                        if(recType == 'customrecord_ter'){
                            const valueBeforeFA = recOld.getValue('custrecord_ter_approved_by_finance');
                            const cekTriggerFA = newRecLoad.getValue('custrecord_ter_approved_by_finance');

                            const oldValFA = toInt(valueBeforeFA);
                            const newValFA = toInt(cekTriggerFA)
                            const cekIsHO = newRecLoad.getValue('custrecord_ter_approved_by_budget_h');

                            if(newValFA !== oldValFA && employeeId === newValFA && cekIsHO === true){
                                updateLinesForUserFA(sublistName, 2)
                                updateLinesForUserFA(sublistExp, 2)
                                const isAllApprovedFA = () => {
                                    let approverLines = 0;
                                    let notApproved   = 0;

                                    const scanFA = (sublistId) => {
                                        const count = newRecLoad.getLineCount({ sublistId });
                                        for (let i = 0; i < count; i++) {
                                            const approver = toInt(newRecLoad.getSublistValue({
                                                sublistId, fieldId: 'custrecord_tori_approver_fa', line: i
                                            }));
                                            if (approver > 0) {
                                                approverLines++;
                                                const statusLineNow = toInt(newRecLoad.getSublistValue({
                                                    sublistId, fieldId: 'custrecord_tori_approval_status_fa', line: i
                                                }));
                                                if (statusLineNow !== 2) notApproved++;
                                            }
                                        }
                                    };

                                    scanFA(sublistName);
                                    scanFA(sublistExp);

                                    log.debug('Approval scan FA result', { approverLines, notApproved });
                                    if (approverLines === 0) return false;
                                    return notApproved === 0;
                                };

                                if (isAllApprovedFA()) {
                                    newRecLoad.setValue({ fieldId: 'custrecord_ter_approved_by_finance', value: true });
                                    log.debug('Header', 'Semua line approved -> approvalstatusFA = 2');
                                } else {
                                    log.debug('Header', 'Masih ada line belum approved FA');
                                }

                                newRecLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                log.debug('Selesai Approve FA', 'Record tersimpan');
                            }
                        }
                        

                }
              
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