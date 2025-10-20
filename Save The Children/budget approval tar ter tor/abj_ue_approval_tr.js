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
                var sublistExpense
                if(recType == 'customrecord_tar'){
                    sublistExpense = 'recmachcustrecord_tar_e_id'
                }
                let allowButton = false;
                const itemCount = rec.getLineCount({ sublistId: 'item' });
                if(itemCount > 0){
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
                        const approverFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_fa',
                            line: i
                        });
                        const approverSatatusFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_apprvl_sts_fa',
                            line: i
                        });
                        if (Number(approver) === Number(employeeId) &&
                            Number(approvalStatus) === 1) {
                            allowButton = true;
                            break;
                        }
                        if(Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1){
                            log.debug('masuk kondisi approve FA')
                            allowButton = true;
                            break;
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
                    }

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
                
                // field and sublistCondition
                var sublistName
                var apprStatusHeader
                var headerAppBudgetHolder
                var checkBoxheaderApprovedBy
                var approverLine
                var apprStatusLine
                var lastAppAt
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

                const updateLinesForUser = (sublistName, statusValue) => {
                    log.debug('sublistName', sublistName)
                    const count = newRecLoad.getLineCount({ sublistId: sublistName });
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
                };
                // approve condition
                if(approverNew != approverOld && employeeId == approverNew){
                    updateLinesForUser(sublistName, 2);
                    const isAllApproved = () => {
                        let approverLines = 0;
                        let notApproved   = 0;

                        const scan = (sublistName) => {
                            const count = newRecLoad.getLineCount({ sublistId: sublistName });
                            for (let i = 0; i < count; i++) {
                                const approver = toInt(newRecLoad.getSublistValue({
                                    sublistId : sublistName,
                                    fieldId: approverLine, 
                                    line: i
                                }));
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
                        };

                        scan(sublistName);

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
                }
                newRecLoad.save();
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