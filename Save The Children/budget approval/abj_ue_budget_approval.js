/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/url", "N/https", "N/task"], function(
    record,
    search,
    serverWidget,
    runtime,
    url,
    https,
    task
    ) {
function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW){
            try {
                const currentUser = runtime.getCurrentUser();
                const employeeId = currentUser.id;
                const rec = context.newRecord;
                const typeRec = rec.type
                log.debug('typeRec', typeRec)
                const cekIsHolder = rec.getValue('custbody_stc_approval_budget_holder')
                let allowButton = false;
                const itemCount = rec.getLineCount({ sublistId: 'item' });
                if(itemCount > 0){
                    for (let i = 0; i < itemCount; i++) {
                        const approver = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_linetrx',
                            line: i
                        });
                        const approverText = rec.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_linetrx',
                            line: i
                        });

                        var appSubtitue;
                        // if (approver) {
                        //     log.debug('approver', approver);
                        //     var empLook = search.lookupFields({
                        //         type: "employee",
                        //         id: approver,
                        //         columns: ["custentity_stc_subtitute_apprvl", "custentity_stc_delgtion_date_from", "custentity_stc_delegation_date_to"],
                        //     });

                        //     var firstCek = empLook.custentity_stc_subtitute_apprvl;
                        //     var delegateFromStr = empLook.custentity_stc_delgtion_date_from; // "01/04/2026"
                        //     var delegateToStr = empLook.custentity_stc_delegation_date_to;     // "18/04/2026"

                        //     if (firstCek && firstCek.length > 0 && delegateFromStr && delegateToStr) {
                                
                        //         // 1. Ambil tanggal hari ini (tanpa jam agar perbandingan akurat)
                        //         var today = new Date();
                        //         today.setHours(0, 0, 0, 0);

                        //         // 2. Fungsi pembantu untuk convert string "DD/MM/YYYY" ke Date Object
                        //         var parseDate = function(str) {
                        //             var parts = str.split('/');
                        //             return new Date(parts[2], parts[1] - 1, parts[0]);
                        //         };

                        //         var dFrom = parseDate(delegateFromStr);
                        //         var dTo = parseDate(delegateToStr);

                        //         // 3. Cek apakah hari ini berada di dalam range (Inclusive)
                        //         if (today >= dFrom && today <= dTo) {
                        //             appSubtitue = firstCek[0].value;
                        //             log.debug('Status', 'Masuk Range Delegasi. Substitute Assigned.');
                        //         } else {
                        //             log.debug('Status', 'Di luar periode delegasi. Substitute Ignored.');
                        //         }
                        //     }
                            
                        //     log.debug('Final appSubtitue', appSubtitue);
                        // }
                        const approvalStatus = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approval_status_line',
                            line: i
                        });
                        log.debug('approvalStatus', approvalStatus)
                        var appFASubtitue
                        const approverFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_approver_fa',
                            line: i
                        });
                        // if(approverFA){
                        //     log.debug('approverFA', approverFA)
                        //     var appFALook = search.lookupFields({
                        //         type: "employee",
                        //         id: approverFA,
                        //         columns: ["custentity_stc_subtitute_apprvl"],
                        //     });
                        //     var firstCekFa = appFALook.custentity_stc_subtitute_apprvl
                        //     if(firstCekFa.length > 0){
                        //         appFASubtitue = firstCekFa[0].value;
                        //         log.debug('appFASubtitue', appFASubtitue)
                        //     }
                            
                        // }
                        const approverSatatusFA = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_stc_apprvl_sts_fa',
                            line: i
                        });
                        log.debug('cekLine', i)
                        log.debug('beforCondition cek', {
                            approverText : approverText, lineKe : i,
                            employeeId : employeeId, appSubtitue : Number(appSubtitue), approvalStatus : approvalStatus
                        })
                        if ((approver == employeeId && approvalStatus == 1 || appSubtitue == employeeId && approvalStatus == 1)) {
                            log.debug('approverText', approverText)
                                log.debug('masuk kondisi allowButton')
                            allowButton = true;
                            break;
                        }
                        if(typeRec != 'purchaseorder'){
                            if(cekIsHolder == true){
                                if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) ||(Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                                    log.debug('masuk kondisi approve FA')
                                    allowButton = true;
                                    break;
                                }
                            }
                        }else{
                            log.debug('masuk PO')
                            var typePo = rec.getValue('custbody_stc_po_type');
                            if(typePo == '1'){
                                if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) ||(Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                                    log.debug('masuk kondisi approve FA', approverSatatusFA)
                                    allowButton = true;
                                    break;
                                }
                            }else{
                                 if(cekIsHolder == true){
                                    if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) ||(Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                                        log.debug('masuk kondisi approve FA')
                                        allowButton = true;
                                        break;
                                    }
                            }
                        }
                             
                        }
                        appSubtitue = ''
                        appFASubtitue = ''
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
                        // if(approver){
                        //     log.debug('approver', approver)
                        //     var empLook = search.lookupFields({
                        //         type: "employee",
                        //         id: approver,
                        //         columns: ["custentity_stc_subtitute_apprvl"],
                        //     });
                        //     var firstCek = empLook.custentity_stc_subtitute_apprvl
                        //     log.debug('firstCek', firstCek)
                        //     if(firstCek.length > 0){
                        //         log.debug('masuk kondisi first cek')
                        //         appSubtitue = firstCek[0].value;
                        //         log.debug('appSubtitue', appSubtitue)
                        //     }
                            
                        // }
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
                        // if(approverFA){
                        //     log.debug('approver', approver)
                        //     var appFALook = search.lookupFields({
                        //         type: "employee",
                        //         id: approverFA,
                        //         columns: ["custentity_stc_subtitute_apprvl"],
                        //     });
                        //     var firscekFA = appFALook.custentity_stc_subtitute_apprvl
                        //     if(firscekFA.length > 0){
                        //         appFASubtitue = firscekFA[0].value;
                        //         log.debug('appFASubtitue', appFASubtitue)
                        //     }
                            
                        // }
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
                        if(cekIsHolder){
                            if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) || (Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){
                            log.debug('masuk kondisi2')
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
            appSubtitue = ''
            appFASubtitue=''
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
                    appSubtitue = firstCek[0].value; 
                    log.debug('appSubtitue', appSubtitue);
                }

                log.debug('return appSubtitue', appSubtitue);
                return appSubtitue;
            }
            const getBudgetHolderApproval = (paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode) => {
                const runSearch = (useAccount) => {
                    let filters = [
                        ["custrecord_stc_sof", "is", paramSof], "AND",
                        ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
                        ["isinactive", "is", "F"]
                    ];
                    if (useAccount && paramAccount) {
                        filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);
                    }

                    let searchObj = search.create({
                        type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                        filters: filters,
                        columns: [
                            search.createColumn({ name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC }),
                            search.createColumn({ name: "custrecord_stc_bdgt_hldr_approval" }),
                            search.createColumn({ name: "custrecord_stc_bh_cost_center" }),
                            search.createColumn({ name: "custrecord_stc_bh_project_code" })
                        ]
                    });

                    let results = searchObj.run().getRange({ start: 0, end: 100 });
                    if (results && results.length > 0) {
                        for (let i = 0; i < results.length; i++) {
                            let mtrxCC = results[i].getValue("custrecord_stc_bh_cost_center");
                            let mtrxPC = results[i].getValue("custrecord_stc_bh_project_code");
                            let approverId = results[i].getValue("custrecord_stc_bdgt_hldr_approval");

                            if (mtrxCC == costCenter && mtrxPC == projectCode) {
                                if (approverId != createdBy) return approverId;
                            }
                        }
                        for (let j = 0; j < results.length; j++) {
                            let mtrxCCG = results[j].getValue("custrecord_stc_bh_cost_center");
                            let mtrxPCG = results[j].getValue("custrecord_stc_bh_project_code");
                            let apprvId = results[j].getValue("custrecord_stc_bdgt_hldr_approval");
                            if (!mtrxCCG && !mtrxPCG) {
                                if (apprvId != createdBy) return apprvId;
                            }
                        }
                    }
                    return null;
                };

                let approval = runSearch(true);
                if (!approval) approval = runSearch(false);
                return approval;
            };

        const getFinanceMatric = (sofId, amount, createdBy, costCenter, projectCode) => {
            let customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
                type: "customrecord_stc_apprvl_mtrix_finance",
                filters: [
                    ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
                    ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_finance_max_amnt", sort: search.Sort.ASC }),
                    search.createColumn({ name: "custrecord_stc_apprvl_finance" }),
                    search.createColumn({ name: "custrecord_stc_fa_cost_center" }),
                    search.createColumn({ name: "custrecord_stc_fa_project_code" })
                ]
            });

            let results = customrecord_stc_apprvl_mtrix_financeSearchObj.run().getRange({ start: 0, end: 100 });
            if (results && results.length > 0) {
                for (let i = 0; i < results.length; i++) {
                    let mtrxCC = results[i].getValue("custrecord_stc_fa_cost_center");
                    let mtrxPC = results[i].getValue("custrecord_stc_fa_project_code");
                    let apprvFinance = results[i].getValue("custrecord_stc_apprvl_finance");
                    if (mtrxCC == costCenter && mtrxPC == projectCode) {
                        if (apprvFinance != createdBy) return apprvFinance;
                    }
                }
                for (let j = 0; j < results.length; j++) {
                    let mtrxCCG = results[j].getValue("custrecord_stc_fa_cost_center");
                    let mtrxPCG = results[j].getValue("custrecord_stc_fa_project_code");
                    let apprvFinanceG = results[j].getValue("custrecord_stc_apprvl_finance");
                    if (!mtrxCCG && !mtrxPCG) {
                        if (apprvFinanceG != createdBy) return apprvFinanceG;
                    }
                }
            }
            return null;
        };
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
                        const cekStatusLine = recLoad.getSublistValue({
                            sublistId, fieldId: 'custcol_stc_approval_status_line', line: i
                        });
                        log.debug('cek is approve', cekStatusLine)
                        if(cekStatusLine != '2' && statusValue != 3){
                            log.debug('masuk cekStatusLine = 2', approver)
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
                        
                    }
                };
                const updateLinesForUserFA = (sublistId, statusValue) => {
                    const count = recLoad.getLineCount({ sublistId });
                    for (let i = 0; i < count; i++) {
                        const approver = toInt(recLoad.getSublistValue({
                            sublistId, fieldId: 'custcol_stc_approver_fa', line: i
                        }));
                        const cekStatusApp = recLoad.getSublistValue({
                            sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i
                        });
                        log.debug('cekStatusApp', cekStatusApp)
                        if(cekStatusApp != '2' && statusValue != 3){
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
                        (typeRec === 'purchaseorder') || 
                        (typeRec === 'purchaserequisition' && cekIsHolder === false) ||
                        (typeRec !== 'purchaserequisition' && typeRec !== 'purchaseorder' && cekIsHolder === true)
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
                        if(typeRec == 'expensereport'){
                            recLoad.setValue({
                                fieldId : "approvalstatus",
                                value : "2"
                            })
                        }
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
            // if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {

            //     log.debug('triggered')

            //     const newRecord = context.newRecord;
            //     const recId = newRecord.id;
            //     const recType = newRecord.type;
            //     const rec = record.load({ type: recType, id: recId, isDynamic: true });
                
            //     const createdBy = rec.getValue('custbody_stc_create_by');
            //     const groupMap = {};
            //     rec.setValue({
            //         fieldId : "custbody_stc_approved_by_finance",
            //         value : false
            //     });
            //     const sublists = ['item', 'expense'];
            //     sublists.forEach((sublistId) => {
            //         const lineCount = rec.getLineCount({ sublistId: sublistId });
            //         for (let i = 0; i < lineCount; i++) {
            //             let sofId = rec.getSublistValue({ sublistId: sublistId, fieldId: 'cseg_stc_sof', line: i });
            //             if (!sofId) continue;

            //             let costCenter = rec.getSublistValue({ sublistId: sublistId, fieldId: 'department', line: i }) || '';
            //             let projectCode = rec.getSublistValue({ sublistId: sublistId, fieldId: 'class', line: i }) || '';
            //             let groupKey = `${sofId}_${costCenter}_${projectCode}`;
            //             let amountField = (sublistId === 'item') ? 
            //                 (['purchreq', 'purchord'].includes(recType) ? 'estimatedamount' : 'grossamt') : 
            //                 (['purchreq', 'purchord'].includes(recType) ? 'estimatedamount' : 'grossamt');
                        
            //             let amount = parseFloat(rec.getSublistValue({ sublistId: sublistId, fieldId: amountField, line: i })) || 0;
            //             let statusLine = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_approval_status_line', line: i });
            //             let statusFa = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i });

            //             if (!groupMap[groupKey]) {
            //                 groupMap[groupKey] = { 
            //                     sofId: sofId, total: 0, account: null, costCenter: costCenter, projectCode: projectCode, lines: [] 
            //                 };
            //             }
                        
            //             groupMap[groupKey].total += amount;
            //             groupMap[groupKey].lines.push({ sublist: sublistId, line: i, statusLine: statusLine, statusFa: statusFa });

            //             if (!groupMap[groupKey].account) {
            //                 if (sublistId === 'item') {
            //                     let itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            //                     if (itemId) {
            //                         let suiteletUrl = url.resolveScript({
            //                             scriptId: "customscript_abj_sl_get_item",
            //                             deploymentId: "customdeploy_abj_sl_get_item",
            //                             params: { custscript_item_id: itemId },
            //                             returnExternalUrl: true
            //                         });
            //                         let response = https.get({ url: suiteletUrl });
            //                         groupMap[groupKey].account = response.body || '';
            //                     }
            //                 } else {
            //                     groupMap[groupKey].account = rec.getSublistValue({ sublistId: 'expense', fieldId: (['exprept', 'purchreq'].includes(recType)) ? 'expenseaccount' : 'account', line: i });
            //                 }
            //             }
            //         }
            //     });
            //     for (let key in groupMap) {
            //         let data = groupMap[key];
            //         let bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode);
            //         let finApprover = null;
            //         log.debug('bhApprover', bhApprover)
            //         log.debug('recType',recType)
            //         if (['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport'].includes(recType)) {
            //             log.debug('masuk kondisi')
            //             finApprover = getFinanceMatric(data.sofId, data.total, createdBy, data.costCenter, data.projectCode);
            //         }
            //         log.debug('finApprover', finApprover)
            //         data.lines.forEach((item) => {
            //             let isLine2 = (item.statusLine == "2" || item.statusLine == 2);
            //             let isFa2 = (item.statusFa == "2" || item.statusFa == 2);

            //             if (!isLine2 || !isFa2) {
            //                 rec.selectLine({ sublistId: item.sublist, line: item.line });
            //                 if (!isLine2) {
            //                     rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approver_linetrx', value: bhApprover || '' });
            //                     rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approval_status_line', value: "1" });
            //                 }
            //                 if (!isFa2 && finApprover) {
            //                     rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approver_fa', value: finApprover });
            //                     rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_apprvl_sts_fa', value: "1" });
            //                 }
            //                 rec.commitLine({ sublistId: item.sublist });
            //             }
            //         });
            //     }

            //     rec.save({ ignoreMandatoryFields: true });
                
            // }
           
          //add by Kurnia 24 may 2026
          log.debug('script Kurnia','==START==')
           setBalancePartner(context)
          log.debug('script Kurnia','==END==')
        
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }

  function setBalancePartner(context) {
        var newRec = context.newRecord;
        log.debug('approval newRec', newRec.getValue('approvalstatus'))
        var oldRec = context.oldRecord;
        log.debug('context.type after submit', context.type)

        try {

            if (context.type === 'create' || context.type === 'edit') {
                var recId = context.newRecord.id;
                var recType = context.newRecord.type;

              if(recType != 'expensereport'){
                return;
              }

                var rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });

                var expType = rec.getValue('custbody_stc_expense_report_type')
                var employee = rec.getValue('entity')
                var apprStat = rec.getValue('approvalstatus')
                var apprStatOld = oldRec.getValue('approvalstatus')
                var setCurrency = rec.getValue('expensereportcurrency');
                var setCostCenter = rec.getValue('department')
                var setProjectCode = rec.getValue('class')
                var status = rec.getValue('status')
                log.debug('status', status)
                var statusRef = rec.getValue('statusRef') || ''
                log.debug('statusRef', statusRef)
                var statusref = rec.getValue('statusref') || ''
                log.debug('statusref', statusref)
                var approvalByBudgetHolder = rec.getValue('custbody_stc_approval_budget_holder')
                log.debug('approvalByBudgetHolder', approvalByBudgetHolder)
                var approvalByBudgetHolderOld = oldRec.getValue('custbody_stc_approval_budget_holder')
                log.debug('approvalByBudgetHolderOld', approvalByBudgetHolderOld)
                var approvalByFinance = rec.getValue('custbody_stc_approved_by_finance')
                log.debug('approvalByFinance', approvalByFinance)
              
                if (approvalByBudgetHolder == true) {
                    apprStat = 2
                } else {
                    apprStat = 1
                }

                if (approvalByBudgetHolderOld == true) {
                    apprStatOld = 2
                } else {
                    apprStatOld = 1
                }

                var customForm = rec.getValue('customform')
                if (Number(customForm) != 139) {
                    log.debug('customform', 'custom form is not for partner')
                    return
                }
                if (Number(expType) != 2) {
                    log.debug('expense type', ' exptype is not realization')
                    //add 26 May 2026 set installment dan spending update
                    if (approvalByFinance == true) {
                        try {
                            let scheduledTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_abj_set_ins_spend_ss',
                                deploymentId: 'customdeploy_abj_set_ins_spend_ss',
                                params: {
                                    custscript_param_emp_id: employee
                                }
                            });

                            let taskId = scheduledTask.submit();
                            log.audit('Scheduled Script Triggered', 'Task ID: ' + taskId);
                        } catch (e) {
                            log.error('Error triggering Scheduled Script', e);
                        }
                    }
                    return
                }
                var linkCa = rec.getValue('custbody_stc_link_expense_report_prtnr')

                //get segment
                const expensereportSearchObj = search.create({
                    type: "expensereport",
                    filters:
                        [
                            ["type", "anyof", "ExpRept"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["cogs", "is", "F"],
                            "AND",
                            ["customform", "anyof", "139"],
                            "AND",
                            ["internalid", "anyof", linkCa]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "amount", label: "Amount" }),
                            search.createColumn({ name: "line.cseg_stc_sof", label: "Source of Funding" }),
                            search.createColumn({ name: "line.cseg_stc_segmentdea", label: "DEA Segment" }),
                            search.createColumn({ name: "line.cseg_stc_drc_segmen", label: "DRC Segment" }),
                            search.createColumn({ name: "projecttask", label: "Project Task" }),
                            'entity', 'class', 'department'
                        ]
                });

                var dataCashAdvance = []

                var searchResult = expensereportSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });

                if (searchResult && searchResult.length > 0) {
                    var result = searchResult[0];
                    log.debug('result', result)

                    dataCashAdvance.push({
                        setCustomer: result.getValue('entity'),
                        setDeaActivity: result.getValue({ name: "projecttask" }),
                        setSof: result.getValue({ name: "line.cseg_stc_sof" }),
                        setDrc: result.getValue({ name: "line.cseg_stc_drc_segmen" }),
                        setDea: result.getValue({ name: "line.cseg_stc_segmentdea" }),
                        setClass: result.getValue({ name: "class" }),
                        setDept: result.getValue({ name: "department" })
                    })

                }
                log.debug('dataCashAdvance', dataCashAdvance)

                //check partner or employee
                var empRec = search.lookupFields({
                    type: 'employee',
                    id: employee,
                    columns: ['custentity_stc_employee_type', 'custentity_sos_adv_partner_balance']
                })

                var empType;
                if (empRec.custentity_stc_employee_type.length > 0) {
                    empType = empRec.custentity_stc_employee_type[0].value || ''
                }


                //cek remaining
                // var lookupEmp = search.lookupFields({
                //     type: 'employee',
                //     id: employee,
                //     columns: ['custentity_sos_adv_partner_balance']
                // })

                var remaining = empRec.custentity_sos_adv_partner_balance || 0
                remaining = parseFloat(remaining)
                log.debug('remaining', remaining)
                //

                var lineCount = rec.getLineCount({ sublistId: 'expense' })

                /////==============================================

                if (context.type == 'create') {
                    //just add line
                    if (expType == 2 && empType == 2) {
                        var totalAmountLine = 0

                        for (var i = 0; i < lineCount; i++) {
                            var amount = rec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount',
                                line: i
                            });
                            totalAmountLine += parseFloat(amount)
                        }

                        totalAmountLine = parseFloat(totalAmountLine)
                        var setAmount = totalAmountLine
                        if (totalAmountLine > remaining) {
                            setAmount = remaining
                        }

                        //add new line
                        rec.selectNewLine({ sublistId: 'expense' });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'category',
                            value: 10
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'currency',
                            value: setCurrency
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            value: -1 * parseFloat(setAmount)
                        });
                        //
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'customer',
                            value: dataCashAdvance[0].setCustomer
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'department',
                            value: dataCashAdvance[0].setDept
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'class',
                            value: dataCashAdvance[0].setClass
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'projecttask',
                            value: dataCashAdvance[0].setDeaActivity
                        });
                        if(dataCashAdvance[0].setSof){
                            rec.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'cseg_stc_sof',
                                value: dataCashAdvance[0].setSof
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'cseg_stc_drc_segmen',
                                value: dataCashAdvance[0].setDrc
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'cseg_stc_segmentdea',
                                value: dataCashAdvance[0].setDea
                            });
                        }
                        //
                        rec.commitLine({ sublistId: 'expense' });
                        log.debug('add', 'addnewline')
                    }

                }

                var setBalance = 0
                if (context.type == 'edit') {
                    if (expType == 2 && empType == 2) { //realization & partner emoloyee

                        var currentPartnerAmount = 0
                        var currentItemAmount = 0
                        var isLinePartner;
                        var linePartner;
                        for (var j = 0; j < lineCount; j++) {
                            var categ = rec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'category',
                                line: j
                            })
                            var amt = rec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount',
                                line: j
                            })
                            if (categ == 10) {
                                currentPartnerAmount += parseFloat(amt)
                                isLinePartner = true
                                linePartner = j
                            } else {
                                currentItemAmount += parseFloat(amt)
                            }
                        }
                        currentPartnerAmount = parseFloat(currentPartnerAmount)
                        currentItemAmount = parseFloat(currentItemAmount)
                        log.debug('currentPartnerAmount', currentPartnerAmount)
                        log.debug('currentItemAmount', currentItemAmount)

                        var oldPartnerAmount = 0
                        var oldItemAmount = 0
                        var oldLineCount = oldRec.getLineCount({ sublistId: 'expense' })
                        for (var k = 0; k < oldLineCount; k++) {
                            var categOld = oldRec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'category',
                                line: k
                            })
                            var amtOld = oldRec.getSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount',
                                line: k
                            })
                            if (categOld == 10) {
                                oldPartnerAmount += parseFloat(amtOld)
                            } else {
                                oldItemAmount += parseFloat(amtOld)
                            }
                        }
                        oldPartnerAmount = parseFloat(oldPartnerAmount)
                        oldItemAmount = parseFloat(oldItemAmount)
                        log.debug('oldPartnerAmount', oldPartnerAmount)
                        log.debug('oldItemAmount', oldItemAmount)


                        log.debug('apprStat', apprStat)
                        log.debug('apprStatOld', apprStatOld)
                        var isSetBalance;

                        if (apprStatOld == 1 && apprStat == 2) { //pending to approved
                            //cek apakah amountnya melebihi balance?
                            if (currentItemAmount == (-1 * currentPartnerAmount)) {
                                setBalance = remaining - (-1 * currentPartnerAmount)
                                isSetBalance = true

                            } else { //kalo ga sama
                                var setAmount = currentItemAmount
                                if (currentItemAmount > remaining) {
                                    setAmount = remaining
                                }

                                if (linePartner) {
                                    rec.selectLine({ sublistId: 'expense', line: linePartner });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'foreignamount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    rec.commitLine({ sublistId: 'expense' });
                                } else {
                                    rec.selectNewLine({ sublistId: 'expense' });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'category',
                                        value: 10
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'currency',
                                        value: setCurrency
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    //
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'customer',
                                        value: dataCashAdvance[0].setCustomer
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        value: dataCashAdvance[0].setDept
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        value: dataCashAdvance[0].setClass
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'projecttask',
                                        value: dataCashAdvance[0].setDeaActivity
                                    });
                                    if(dataCashAdvance[0].setSof){
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_sof',
                                            value: dataCashAdvance[0].setSof
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_drc_segmen',
                                            value: dataCashAdvance[0].setDrc
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_segmentdea',
                                            value: dataCashAdvance[0].setDea
                                        });
                                    }
                                    //
                                    rec.commitLine({ sublistId: 'expense' });
                                    log.debug('add', 'addnewline')
                                }

                                if (currentItemAmount <= remaining) {
                                    setBalance = remaining - parseFloat(currentItemAmount)
                                    isSetBalance = true
                                } else {
                                    //ke payment
                                }


                            }

                        }

                        if (apprStatOld == 2 && apprStat == 1) { //approved to pending
                            //kembalikan amountnya, karena dia balik pending
                            //cek, apakah sebelumnya melebihi balance?
                            if (oldItemAmount == (-1 * oldPartnerAmount)) {
                                setBalance = remaining + (-1 * oldPartnerAmount)
                                isSetBalance = true
                            } else {
                                //maka sebelumnya balance tidak dikembalikan, karena masuk payment
                            }
                        }

                        if (apprStatOld == 2 && apprStat == 2) {
                            if (currentItemAmount != oldItemAmount) {
                                var remainingNow;
                                if (oldItemAmount == (-1 * oldPartnerAmount)) {
                                    remainingNow = remaining + (-1 * oldPartnerAmount)
                                } else {
                                    remainingNow = remaining
                                }
                                remainingNow = parseFloat(remainingNow)

                                var setAmount = currentItemAmount
                                if (currentItemAmount > remainingNow) {
                                    setAmount = remainingNow
                                }

                                //ubah amount line partnernya dengan yang terbaru
                                if (isLinePartner) {
                                    rec.selectLine({ sublistId: 'expense', line: linePartner });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'foreignamount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    rec.commitLine({ sublistId: 'expense' });
                                } else {
                                    rec.selectNewLine({ sublistId: 'expense' });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'category',
                                        value: 10
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'currency',
                                        value: setCurrency
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    //
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'customer',
                                        value: dataCashAdvance[0].setCustomer
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        value: dataCashAdvance[0].setDept
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        value: dataCashAdvance[0].setClass
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'projecttask',
                                        value: dataCashAdvance[0].setDeaActivity
                                    });
                                    if(dataCashAdvance[0].setSof){
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_sof',
                                            value: dataCashAdvance[0].setSof
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_drc_segmen',
                                            value: dataCashAdvance[0].setDrc
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_segmentdea',
                                            value: dataCashAdvance[0].setDea
                                        });
                                    }
                                    //
                                    rec.commitLine({ sublistId: 'expense' });
                                    log.debug('add', 'addnewline')
                                }

                                if (currentItemAmount == setAmount) {
                                    setBalance = remainingNow - parseFloat(setAmount)
                                    isSetBalance = true
                                } else {
                                    setBalance = remainingNow
                                    isSetBalance = true
                                    //ke payment
                                }
                            } else {
                                //current = old, tidak ada perubahan
                                //jika linenya didelete
                                var setAmount = currentItemAmount
                                if (currentItemAmount > remaining) {
                                    setAmount = remaining
                                }

                                if (!isLinePartner) {
                                    rec.selectNewLine({ sublistId: 'expense' });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'category',
                                        value: 10
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'currency',
                                        value: setCurrency
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: -1 * parseFloat(setAmount)
                                    });
                                    //
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'customer',
                                        value: dataCashAdvance[0].setCustomer
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'department',
                                        value: dataCashAdvance[0].setDept
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'class',
                                        value: dataCashAdvance[0].setClass
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'projecttask',
                                        value: dataCashAdvance[0].setDeaActivity
                                    });
                                    if(dataCashAdvance[0].setSof){
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_sof',
                                            value: dataCashAdvance[0].setSof
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_drc_segmen',
                                            value: dataCashAdvance[0].setDrc
                                        });
                                        rec.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'cseg_stc_segmentdea',
                                            value: dataCashAdvance[0].setDea
                                        });
                                    }
                                    //
                                    rec.commitLine({ sublistId: 'expense' });
                                    log.debug('add', 'addnewline')

                                }
                            }
                        }

                        if (apprStatOld == 1 && apprStat == 1) {
                            var setAmount = currentItemAmount
                            if (currentItemAmount > remaining) {
                                setAmount = remaining
                            }

                            if (isLinePartner) {
                                rec.selectLine({ sublistId: 'expense', line: linePartner });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'foreignamount',
                                    value: -1 * parseFloat(setAmount)
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    value: -1 * parseFloat(setAmount)
                                });
                                rec.commitLine({ sublistId: 'expense' });
                            } else {
                                rec.selectNewLine({ sublistId: 'expense' });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'category',
                                    value: 10
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'currency',
                                    value: setCurrency
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    value: -1 * parseFloat(setAmount)
                                });
                                //
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'customer',
                                    value: dataCashAdvance[0].setCustomer
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'department',
                                    value: dataCashAdvance[0].setDept
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'class',
                                    value: dataCashAdvance[0].setClass
                                });
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'projecttask',
                                    value: dataCashAdvance[0].setDeaActivity
                                });
                                if(dataCashAdvance[0].setSof){
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'cseg_stc_sof',
                                        value: dataCashAdvance[0].setSof
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'cseg_stc_drc_segmen',
                                        value: dataCashAdvance[0].setDrc
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'cseg_stc_segmentdea',
                                        value: dataCashAdvance[0].setDea
                                    });
                                }
                                //
                                rec.commitLine({ sublistId: 'expense' });
                                log.debug('add', 'addnewline')
                            }
                        }

                        if (status == 'Voided' && apprStatOld == 2) {
                            if (oldItemAmount == (-1 * oldPartnerAmount)) {
                                setBalance = remaining + (-1 * oldPartnerAmount)
                                isSetBalance = true
                            }
                        }


                    }
                }

                rec.setValue({
                    fieldId: 'advance',
                    value: 0
                })

                var savedId = rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug('savedId', savedId)
                log.debug('isSetBalance', isSetBalance)

                if (savedId) {
                    if (isSetBalance) {
                        log.debug('setBalance', setBalance)
                        if (setBalance < 0) {
                            setBalance = 0
                        }
                        record.submitFields({
                            type: record.Type.EMPLOYEE,
                            id: employee,
                            values: {
                                custentity_sos_adv_partner_balance: setBalance
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        })
                        log.debug('set balance', 'done')
                    }
                }

                //add 26 May 2026 set installment dan spending update
                if (apprStat == true) { //khusus realization
                    try {
                        let scheduledTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_abj_set_ins_spend_ss',
                            deploymentId: 'customdeploy_abj_set_ins_spend_ss',
                            params: {
                                custscript_param_emp_id: employee
                            }
                        });

                        let taskId = scheduledTask.submit();
                        log.audit('Scheduled Script Triggered', 'Task ID: ' + taskId);
                    } catch (e) {
                        log.error('Error triggering Scheduled Script', e);
                    }
                }
              
            }

        } catch (e) {
            log.error('error', e)
        }

    }
  
    return{
        afterSubmit : afterSubmit,
        beforeLoad : beforeLoad
    }
});