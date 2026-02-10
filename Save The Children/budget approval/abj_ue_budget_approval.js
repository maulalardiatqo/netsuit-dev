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
                const itemCount = rec.getLineCount({ sublistId: 'item' });
                if(itemCount > 0){
                    for (let i = 0; i < itemCount; i++) {
                        const approver = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_linetrx',
                            line: i
                        });
                        var appSubtitue
                        if(approver){
                            log.debug('approver', approver)
                            var empLook = search.lookupFields({
                                type: "employee",
                                id: approver,
                                columns: ["custentity_stc_subtitute_apprvl"],
                            });
                            var firstCek = empLook.custentity_stc_subtitute_apprvl
                            log.debug('firstCek', firstCek)
                            if(firstCek.length > 0){
                                appSubtitue = [0].value;
                                log.debug('appSubtitue', appSubtitue)
                            }
                            
                        }
                        const approvalStatus = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approval_status_line',
                            line: i
                        });
                        var appFASubtitue
                        const approverFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_fa',
                            line: i
                        });
                        if(approverFA){
                            log.debug('approverFA', approverFA)
                            var appFALook = search.lookupFields({
                                type: "employee",
                                id: approverFA,
                                columns: ["custentity_stc_subtitute_apprvl"],
                            });
                            var firstCekFa = appFALook.custentity_stc_subtitute_apprvl
                            if(firstCekFa.length > 0){
                                appFASubtitue = [0].value;
                                log.debug('appFASubtitue', appFASubtitue)
                            }
                            
                        }
                        const approverSatatusFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_apprvl_sts_fa',
                            line: i
                        });
                        log.debug('beforCondition cek', {
                            employeeId : employeeId, appSubtitue : Number(appSubtitue), approvalStatus : approvalStatus
                        })
                        if ((Number(approver) === Number(employeeId) &&
                            Number(approvalStatus) === 1) || (Number(appSubtitue) === Number(employeeId) && Number(approvalStatus) === 1)) {
                                log.debug('masuk kondisi allowButton')
                            allowButton = true;
                            break;
                        }
                        if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) ||(Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                            log.debug('masuk kondisi approve FA')
                            allowButton = true;
                            break;
                        }
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
                        var appSubtitue
                        if(approver){
                            log.debug('approver', approver)
                            var empLook = search.lookupFields({
                                type: "employee",
                                id: approver,
                                columns: ["custentity_stc_subtitute_apprvl"],
                            });
                            var firstCek = empLook.custentity_stc_subtitute_apprvl
                            log.debug('firstCek', firstCek)
                            if(firstCek.length > 0){
                                log.debug('masuk kondisi first cek')
                                appSubtitue = firstCek[0].value;
                                log.debug('appSubtitue', appSubtitue)
                            }
                            
                        }
                        const approvalStatus = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_stc_approval_status_line',
                            line: j
                        });
                        const approverFA = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_stc_approver_fa',
                            line: j
                        });
                        var appFASubtitue
                        if(approverFA){
                            log.debug('approver', approver)
                            var appFALook = search.lookupFields({
                                type: "employee",
                                id: approverFA,
                                columns: ["custentity_stc_subtitute_apprvl"],
                            });
                            var firscekFA = appFALook.custentity_stc_subtitute_apprvl
                            if(firscekFA){
                                appFASubtitue = [0].value;
                                log.debug('appFASubtitue', appFASubtitue)
                            }
                            
                        }
                        const approverSatatusFA = rec.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_stc_apprvl_sts_fa',
                            line: j
                        });
                        log.debug('approvalStatus', approvalStatus)
                        if ((Number(approver) === Number(employeeId) &&
                            Number(approvalStatus) === 1) || (Number(appSubtitue) === Number(employeeId) && Number(approvalStatus) === 1)) {
                                log.debug('kondisi approver')
                            allowButton = true;
                            break;
                        }
                        if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) || (Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                            log.debug('masuk kondisi2')
                            allowButton = true;
                            break;
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
        function getSubtitue(empId) {
                log.debug('empId param get substitute', empId);

                var appSubtitue = null;

                var empLook = search.lookupFields({
                    type: 'employee',
                    id: empId,
                    columns: ['custentity_stc_subtitute_apprvl']
                });

                var firstCek = empLook.custentity_stc_subtitute_apprvl;
                log.debug('firstCek', firstCek);

                if (firstCek && firstCek.length > 0) {
                    appSubtitue = firstCek[0].value; // ✅ INI KUNCINYA
                    log.debug('appSubtitue', appSubtitue);
                }

                log.debug('return appSubtitue', appSubtitue);
                return appSubtitue;
            }
        function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, cretaedBy) {
                function runSearch(useAccount) {
                    var filters = [];
                    filters.push(["custrecord_stc_sof", "is", paramSof]);

                    if (useAccount && paramAccount) {
                        filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);
                    }

                    filters.push("AND", ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount]);
                    filters.push("AND", ["isinactive", "is", "F"]);

                    var searchObj = search.create({
                        type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                        filters: filters,
                        columns: [
                            search.createColumn({ name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC }),
                            search.createColumn({ name: "custrecord_stc_bdgt_hldr_approval" })
                        ]
                    });

                    var results = searchObj.run().getRange({ start: 0, end: 100 }); 
                    
                    if (results && results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            var approverId = results[i].getValue("custrecord_stc_bdgt_hldr_approval");
                            
                            if (approverId != cretaedBy) {
                                return approverId;
                            }
                            log.debug('Skip Self Approval', 'Approver ' + approverId + ' is the creator. Skipping to next tier.');
                        }
                    }
                    
                    return null;
                }

            var approval = runSearch(true);
            if (!approval) {
                approval = runSearch(false);
            }

            return approval;
        }
        function getFinanceMatric(sofId, amount, cretaedBy){
            var approvalFinance = null;
        
            var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
                type: "customrecord_stc_apprvl_mtrix_finance",
                filters: [
                    ["custrecord_stc_sof_mtrx_finance", "anyof", sofId],
                    "AND", 
                    ["custrecord_finance_max_amnt", "greaterthanorequalto", amount]
                    , "AND",
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_finance_max_amnt",
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({ name: "custrecord_stc_apprvl_finance", label: "Approval Finance" })
                ]
            });

            var results = customrecord_stc_apprvl_mtrix_financeSearchObj.run().getRange({
                start: 0,
                end: 100 
            });

            if (results && results.length > 0) {
                for (var i = 0; i < results.length; i++) {
                    var potentialApprover = results[i].getValue("custrecord_stc_apprvl_finance");
                    
                    if (potentialApprover != cretaedBy) {
                        approvalFinance = potentialApprover;
                        break; 
                    }
                    
                }
            }
            
            return approvalFinance;
        }
        try {
            if (context.type === context.UserEventType.EDIT){
                const currentUser = runtime.getCurrentUser();
                const employeeId = toInt(currentUser.id);
                

                const rec  = context.newRecord;
                const typeRec = rec.type
                log.debug('typeRec', typeRec)
                const recOld = context.oldRecord;
                const  cekIsHolder = rec.getValue('custbody_stc_approval_budget_holder');
                log.debug('cekIsHolder', cekIsHolder)
                const valueBefore = recOld.getValue('custbody_stc_approval_by');
                const cekTrigger  = rec.getValue('custbody_stc_approval_by');

                const valueBeforeFA = recOld.getValue('custbody_stc_apprvl_by_fa');
                const cekTriggerFA = rec.getValue('custbody_stc_apprvl_by_fa');
                const cretaedBy = rec.getValue('custbody_stc_create_by');

                const oldValFA = toInt(valueBeforeFA);
                const newValFA = toInt(cekTriggerFA);

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
                    log.debug('sublistId', sublistId)
                    log.debug('statusValue', statusValue)
                    const count = recLoad.getLineCount({ sublistId });
                    for (let i = 0; i < count; i++) {
                        const approver = toInt(recLoad.getSublistValue({
                            sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i
                        }));
                        log.debug('approver', approver)
                        var subtitue = getSubtitue(approver);
                        log.debug('subtitue', subtitue)
                        if(subtitue){
                            if(subtitue == employeeId){
                                log.debug('subtitue is employee will set')
                                recLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custcol_stc_approval_status_line',
                                    line: i,
                                    value: statusValue
                                });
                                log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                            }
                        }
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
                const updateLinesForUserFA = (sublistId, statusValue) => {
                    const count = recLoad.getLineCount({ sublistId });
                    for (let i = 0; i < count; i++) {
                        const approver = toInt(recLoad.getSublistValue({
                            sublistId, fieldId: 'custcol_stc_approver_fa', line: i
                        }));
                        log.debug('approver', approver)
                        var subtitue = getSubtitue(approver);
                        log.debug('subtitue', subtitue)
                        if(subtitue){
                            if(subtitue == employeeId){
                                log.debug('subtitue is employee will set')
                                recLoad.setSublistValue({
                                    sublistId,
                                    fieldId: 'custcol_stc_apprvl_sts_fa',
                                    line: i,
                                    value: statusValue
                                });
                                log.debug(`Update ${sublistId}`, `Line ${i} set status -> ${statusValue}`);
                            }
                        }
                        if (approver === employeeId) {
                            recLoad.setSublistValue({
                                sublistId,
                                fieldId: 'custcol_stc_apprvl_sts_fa',
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
                    updateLinesForUserFA('item', 3);
                    updateLinesForUserFA('expense', 3);

                    recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Selesai Reject', 'Line milik user diset ke 3');
                    return;
                }

                /**
                 * Jika custbody_stc_approval_by berubah → logic approve
                 */
                if (newValFA !== oldValFA && employeeId === newValFA && (
                        (typeRec === 'purchaserequisition' && cekIsHolder === false) ||
                        (typeRec !== 'purchaserequisition' && cekIsHolder === true)
                    )) {
                    log.debug('Masuk eksekusi approve FA');

                    updateLinesForUserFA('item', 2);
                    updateLinesForUserFA('expense', 2);

                    const isAllApprovedFA = () => {
                        let approverLines = 0;
                        let notApproved   = 0;

                        const scanFA = (sublistId) => {
                            const count = recLoad.getLineCount({ sublistId });
                            for (let i = 0; i < count; i++) {
                                const approver = toInt(recLoad.getSublistValue({
                                    sublistId, fieldId: 'custcol_stc_approver_fa', line: i
                                }));
                                if (approver > 0) {
                                    approverLines++;
                                    const statusLineNow = toInt(recLoad.getSublistValue({
                                        sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i
                                    }));
                                    if (statusLineNow !== 2) notApproved++;
                                }
                            }
                        };

                        scanFA('item');
                        scanFA('expense');

                        log.debug('Approval scan FA result', { approverLines, notApproved });
                        if (approverLines === 0) return false;
                        return notApproved === 0;
                    };

                    if (isAllApprovedFA()) {
                        recLoad.setValue({ fieldId: 'custbody_stc_approved_by_finance', value: true });
                        log.debug('Header', 'Semua line approved -> approvalstatusFA = 2');
                    } else {
                        log.debug('Header', 'Masih ada line belum approved FA');
                    }

                    recLoad.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Selesai Approve FA', 'Record tersimpan');
                }
                if (newVal !== oldVal && employeeId === newVal && (
                    (typeRec === 'purchaserequisition' && cekIsHolder === false) ||
                    (typeRec !== 'purchaserequisition' && cekIsHolder === false)
                )) {
                    log.debug('Masuk eksekusi approve');

                    updateLinesForUser('item', 2);
                    updateLinesForUser('expense', 2);

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
                         recLoad.setValue({
                            fieldId : 'custbody_stc_approved_by_finance',
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
                            recLoad.setSublistValue({
                                sublistId,
                                fieldId: 'custcol_stc_apprvl_sts_fa',
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
            }
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {
                
                log.debug('triggered')
                const newRec = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                    isDynamic: false
                });
                const cretaedBy = newRec.getValue('custbody_stc_create_by');
                var cekType = context.newRecord.type
                log.debug('cekType', cekType)
                newRec.setValue({
                    fieldId : "custbody_stc_approved_by_finance",
                    value : false
                })
                // ==== LOOP SUBLIST ITEM ====
                const lineCountItem = newRec.getLineCount({ sublistId: 'item' });
                if(lineCountItem > 0){
                    log.debug('lineCountItem', lineCountItem)
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
                            let cekEmp = getBudgetHolderApproval(sofId, account, grossamt, cretaedBy);
                            log.debug('cekEmp', cekEmp)
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
                            if(cekType == 'vendbill' || cekType == 'purchreq' ||  cekType == 'purchaseorder'){
                                var emp = getFinanceMatric(sofId, grossamt, cretaedBy)
                                log.debug('emp', emp)
                                if(emp){
                                    newRec.setSublistValue({
                                        sublistId : "item",
                                        fieldId : "custcol_stc_approver_fa",
                                        line: i,
                                        value : emp
                                    })
                                    newRec.setSublistValue({
                                        sublistId: "item",
                                        fieldId: "custcol_stc_apprvl_sts_fa",
                                        line: i,
                                        value: "1"
                                    })
                                }
                            }
                        }
                    }
                }
                

                // ==== LOOP SUBLIST EXPENSE ====
                const lineCountExp = newRec.getLineCount({ sublistId: 'expense' });
                log.debug('lineCountExp', lineCountExp)
                if(lineCountExp > 0){
                    for (let i = 0; i < lineCountExp; i++) {
                        let account = newRec.getSublistValue({ sublistId: 'expense', fieldId: 'account', line: i });
                        let sofId = newRec.getSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_sof', line: i });
                        let grossamt = newRec.getSublistValue({ sublistId: 'expense', fieldId: 'grossamt', line: i });

                        if (sofId) {
                            let cekEmp = getBudgetHolderApproval(sofId, account, grossamt, cretaedBy);
                            if(cekType == 'vendbill' || cekType == 'purchreq' ||  cekType == 'purchaseorder' || cekType == 'expensereport'){
                                let empFinance = getFinanceMatric(sofId, grossamt, cretaedBy)
                                log.debug('empFinance', empFinance)
                                if(empFinance){
                                    newRec.setSublistValue({
                                        sublistId : "expense",
                                        fieldId : "custcol_stc_approver_fa",
                                        line: i,
                                        value : empFinance
                                    })
                                    newRec.setSublistValue({
                                        sublistId: "expense",
                                        fieldId: "custcol_stc_apprvl_sts_fa",
                                        line: i,
                                        value: "1"
                                    })  
                                }
                            }
                           
                            log.debug('cekEmp', cekEmp)
                            if (cekEmp) {
                                newRec.setSublistValue({
                                    sublistId: "expense",
                                    fieldId: "custcol_stc_approver_linetrx",
                                    line: i,
                                    value: cekEmp
                                });
                            }
                            newRec.setSublistValue({
                                sublistId: "expense",
                                fieldId: "custcol_stc_approval_status_line",
                                line: i,
                                value: "1"
                            });
                        }
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