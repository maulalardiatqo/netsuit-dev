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
                    log.debug('sublistExpense', sublistExpense);
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
                    log.debug('expenseCount', expenseCount);

                    if (expenseCount > 0) {
                        log.debug('masuk kondisi exp button');

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
                            

                            log.debug('check line', {
                                e,
                                approver,
                                approvalStatus,
                                approverFA,
                                approverStatusFA,
                                employeeId
                            });

                            if (
                                Number(approver) === Number(employeeId) &&
                                Number(approvalStatus) === 1
                            ) {
                                log.debug('masuk kondisi approve regular');
                                allowButton = true;
                                break;
                            }

                            if (
                                Number(approverFA) === Number(employeeId) &&
                                Number(approverStatusFA) === 1
                            ) {
                                log.debug('masuk kondisi approve FA');
                                allowButton = true;
                                break;
                            }
                        }
                    }
                }

                log.debug('allowButton', allowButton)
                if (!allowButton) {
                    
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
            if (context.type === context.UserEventType.EDIT){
                const currentUser = runtime.getCurrentUser();
                const employeeId = toInt(currentUser.id);
                

                const rec    = context.newRecord;
                const typeRec = rec.type
                log.debug('typeRec', typeRec)
                var sublistExpens
                var subListItem
                var valueBefore
                var cekTrigger
                var oldApprovalStatus
                var newApprovalStatus
                const recOld = context.oldRecord;
                const  cekIsHolder = rec.getValue('custbody_stc_approval_budget_holder');
                log.debug('cekIsHolder', cekIsHolder)
                if(typeRec == 'customrecord_tar'){
                    sublistExpens = 'recmachcustrecord_tar_e_id'
                    valueBefore = recOld.getValue('custrecord_tar_approval_by_budget_holder');
                    cekTrigger = rec.getValue('custrecord_tar_approval_by_budget_holder');
                    oldApprovalStatus = toInt(recOld.getValue('custrecord_tar_status'));
                    newApprovalStatus = toInt(rec.getValue('custrecord_tar_status'));
                }

                const valueBeforeFA = recOld.getValue('custbody_stc_apprvl_by_fa');
                const cekTriggerFA = rec.getValue('custbody_stc_apprvl_by_fa');

                const oldValFA = toInt(valueBeforeFA);
                const newValFA = toInt(cekTriggerFA)

                const oldVal = toInt(valueBefore);
                const newVal = toInt(cekTrigger);

                

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
                    var approvalField;
                    var approvalStatusField;
                    var childSearch
                    var recChild
                    if (sublistId == 'recmachcustrecord_tar_e_id') {
                        approvalField = 'custrecord_tare_approver';
                        approvalStatusField = 'custrecord_tare_approval_status';
                        childSearch = search.create({
                            type: 'customrecord_tar_expenses',
                            filters: [['custrecord_tar_e_id', 'anyof', recLoad.id]],
                            columns: [
                                'internalid',
                                approvalField,
                                approvalStatusField
                            ]
                        });
                        recChild = 'customrecord_tar_expenses'

                    }
                       
                    const results = childSearch.run().getRange({ start: 0, end: 1000 });
                    log.debug('updateLinesForUser - child count', results.length);

                    for (let i = 0; i < results.length; i++) {
                        const result = results[i];
                        const internalId = result.getValue('internalid');
                        const approver = parseInt(result.getValue(approvalField));

                        if (approver === employeeId) {
                            record.submitFields({
                                type: recChild,
                                id: internalId,
                                values: {
                                    [approvalStatusField]: statusValue
                                }
                            });
                            log.debug(`Update ${sublistId}`, `Child ${internalId} set status -> ${statusValue}`);
                        }
                    }
                };


                /**
                 * Jika header approvalstatus berubah jadi 3 (Reject)
                 * maka update semua line milik employeeId ke 3
                 */
                if (oldApprovalStatus !== 3 && newApprovalStatus === 3) {
                    log.debug('Reject', 'Approval status berubah jadi 3 (Reject), update line');
                    updateLinesForUser(sublistExpens, 3);

                    recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Selesai Reject', 'Line milik user diset ke 3');
                    return;
                }

                if (newVal !== oldVal && employeeId === newVal)
                    {
                        log.debug('Masuk eksekusi approve');

                        updateLinesForUser(sublistExpens, 2);

                        const isAllApproved = () => {
                            let approverLines = 0;
                            let notApproved   = 0;

                            const scan = (sublistId) => {
                                var approvalField;
                                var approvalStatatusField;
                                var childSearch

                                if (sublistId == 'recmachcustrecord_tar_e_id') {
                                    approvalField = 'custrecord_tare_approver';
                                    approvalStatatusField = 'custrecord_tare_approval_status';

                                    childSearch = search.create({
                                        type: 'customrecord_tar_expenses',
                                        filters: [['custrecord_tar_e_id', 'anyof', recLoad.id]],
                                        columns: [approvalField, approvalStatatusField]
                                    });
                                }

                                const results = childSearch.run().getRange({ start: 0, end: 1000 });
                                log.debug('scan - child count', results.length);

                                for (let i = 0; i < results.length; i++) {
                                    const approver = parseInt(results[i].getValue(approvalField));
                                    if (approver > 0) {
                                        approverLines++;
                                        const statusLineNow = parseInt(results[i].getValue(approvalStatatusField));
                                        if (statusLineNow !== 2) notApproved++;
                                    }
                                }
                                
                            };

                        scan(sublistExpens);

                        log.debug('Approval scan result', { approverLines, notApproved });
                        if (approverLines === 0) return false;
                        return notApproved === 0;
                    };

                    if (isAllApproved()) {
                        var aprroverByBgtHolderField
                        if(typeRec == 'customrecord_tar'){
                            aprroverByBgtHolderField = 'custrecord_tar_approved_by_budget_holder'
                        }
                        recLoad.setValue({ fieldId: aprroverByBgtHolderField, value: true });
                        log.debug('Header', 'Semua line approved -> approvalstatus = 2');
                    } else {
                        log.debug('Header', 'Masih ada line belum approved');
                    }

                    recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Selesai Approve', 'Record tersimpan');
                }
                if (oldApprovalStatus === 3 && newApprovalStatus === 1) {
                    log.debug('Reset', 'Approval status berubah dari 3 ke 1, reset semua line jadi 1');
                    var lastAppFieldNgtHolder
                    var approverFieldBgtHolder
                    var aprroverByBgtHolderField
                    if(typeRec == 'customrecord_tar'){
                        lastAppFieldNgtHolder = 'custrecord_tar_approve_budget_holder'
                        approverFieldBgtHolder = 'custrecord_tar_approval_by_budget_holder'
                        aprroverByBgtHolderField = 'custrecord_tar_approved_by_budget_holder'
                    }
                    recLoad.setValue({
                            fieldId : lastAppFieldNgtHolder,
                            value : '',
                            ignoreMandatoryFields : true
                        })
                        recLoad.setValue({
                            fieldId : approverFieldBgtHolder,
                            value : '',
                            ignoreMandatoryFields : true
                        })
                        
                        recLoad.setValue({
                            fieldId : aprroverByBgtHolderField,
                            value : false,
                            ignoreMandatoryFields : true
                        })
                    const resetLines = (sublistId, statusValue) => {
                        var approvalField;
                        var approvalStatusField;
                        var childSearch
                        var recChild
                        if (sublistId == 'recmachcustrecord_tar_e_id') {
                            approvalField = 'custrecord_tare_approver';
                            approvalStatusField = 'custrecord_tare_approval_status';
                            childSearch = search.create({
                                type: 'customrecord_tar_expenses',
                                filters: [['custrecord_tar_e_id', 'anyof', recLoad.id]],
                                columns: ['internalid', approvalStatatusField]
                            });
                            recChild = 'customrecord_tar_expenses'
                        }

                        const results = childSearch.run().getRange({ start: 0, end: 1000 });
                        log.debug('resetLines - child count', results.length);
                        for (let i = 0; i < results.length; i++) {
                            const internalId = results[i].getValue('internalid');
                            record.submitFields({
                                type: recChild,
                                id: internalId,
                                values: {
                                    [approvalStatusField]: statusValue
                                }
                            });

                            log.debug(`Reset ${sublistId}`, `Child ${internalId} diset ke ${statusValue}`);
                        }
                        
                    };


                    // resetLines('item', 1);
                    resetLines(sublistExpens, 1);

                    recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Selesai Reset', 'Semua line approval status diset ke 1');
                    return;
                }
            }
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {
                const newRec = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                    isDynamic: true
                });
                var typeRec = context.newRecord.type
                var sublistExpens
                if(typeRec == 'customrecord_tar'){
                    sublistExpens = 'recmachcustrecord_tar_e_id'
                }
                newRec.setValue({
                    fieldId : "custbody_stc_approved_by_finance",
                    value : false
                })
                // ==== LOOP SUBLIST ITEM ====
                const lineCountItem = newRec.getLineCount({ sublistId: 'item' });
                if(lineCountItem > 0){
                    for (let i = 0; i < lineCountItem; i++) {
                        let itemId = newRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        let sofId = newRec.getSublistValue({ sublistId: 'item', fieldId: 'cseg_stc_sof', line: i });
                        let grossamt = newRec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });

                        let account;
                        if (itemId) {
                            let itemSearchObj = search.create({
                                type: "item",
                                filters: [["internalid", "anyof", itemId]],
                                columns: [
                                    search.createColumn({ name: "type" }),
                                    search.createColumn({ name: "assetaccount" }),
                                    search.createColumn({ name: "expenseaccount" })
                                ]
                            });
                            let results = itemSearchObj.run().getRange({ start: 0, end: 1 });
                            if (results.length > 0) {
                                let type = results[0].getValue({ name: "type" });
                                let assetAccount = results[0].getValue({ name: "assetaccount" });
                                let expenseAccount = results[0].getValue({ name: "expenseaccount" });

                                account = (type === 'InvtPart') ? assetAccount : expenseAccount;
                            }
                        }

                        if (sofId) {
                            let cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
                            if (cekEmp) {
                                newRec.setSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_stc_approver_linetrx",
                                    line: i,
                                    value: cekEmp
                                });
                            }
                            newRec.setSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_stc_approval_status_line",
                                line: i,
                                value: "1"
                            });
                        }
                    }
                }
                

                // ==== LOOP SUBLIST EXPENSE ====
                const lineCountExp = newRec.getLineCount({ sublistId: sublistExpens });
                for (let i = 0; i < lineCountExp; i++) {
                    var accontField
                    var sofField
                    var amountField
                    var approverField
                    var statusField
                    if(typeRec == 'customrecord_tar'){
                        accontField = 'custrecord_tare_account';
                        sofField = 'custrecord_tare_source_of_funding'
                        amountField = 'custrecord_tare_amount'
                        approverField = 'custrecord_tare_approver'
                        statusField = 'custrecord_tare_approval_status'
                    }
                    let account = newRec.getSublistValue({ sublistId: sublistExpens, fieldId: accontField, line: i });
                    let sofId = newRec.getSublistValue({ sublistId: sublistExpens, fieldId: sofField, line: i });
                    let grossamt = newRec.getSublistValue({ sublistId: sublistExpens, fieldId: amountField, line: i });

                    if (sofId) {
                        let cekEmp = getBudgetHolderApproval(sofId, account, grossamt);
                        if (cekEmp) {
                            newRec.setSublistValue({
                                sublistId: sublistExpens,
                                fieldId: approverField,
                                line: i,
                                value: cekEmp
                            });
                        }
                        newRec.setSublistValue({
                            sublistId: sublistExpens,
                            fieldId: statusField,
                            line: i,
                            value: "1"
                        });
                    }
                }

                // simpan perubahan
                newRec.save({ ignoreMandatoryFields: true });
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