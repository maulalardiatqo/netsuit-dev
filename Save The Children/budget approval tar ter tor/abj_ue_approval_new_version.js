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
                // log.debug('recType', recType);
                var recBefLoad = record.load({
                    type : recType,
                    id : rec.id
                })
                
                var sublistExpense
                var sublistItem
                var approverField
                var approvalStatusField
                var approverFAfield
                var fieldApprovalStatusFA
                var fieldTriggerBudget
                var isItem = true
                if(recType == 'customrecord_tar'){
                    sublistExpense = 'recmachcustrecord_tar_e_id'
                    fieldTriggerBudget = 'custrecord_tar_approved_by_budget_holder'
                    isItem = false
                }
                if(recType == 'customrecord_ter'){
                    sublistItem = 'recmachcustrecord_terd_id'
                    sublistExpense = 'recmachcustrecord_tar_id_ter'
                    approverField = 'custrecord_terd_approver'
                    approvalStatusField = 'custrecord_terd_approval_status'
                    approverFAfield = 'custrecord_ter_approver_fa'
                    fieldTriggerBudget = 'custrecord_ter_approved_by_budget_h'
                    fieldApprovalStatusFA = 'custrecord_ter_apprvl_sts_fa'
                    isItem = true
                }
                if(recType == 'customrecord_tor'){
                    sublistItem = 'recmachcustrecord_tori_id'
                    approverField = 'custrecord_tori_approver'
                    approvalStatusField = 'custrecord_tori_approval_status'
                    approverFAfield = 'custrecord_tori_approver_fa'
                    fieldTriggerBudget = 'custrecord_tor_approved_by_budget_h'
                    fieldApprovalStatusFA = 'custrecord_tori_approval_status_fa'
                    isItem = true
                }
                log.debug('fieldTriggerBudget', fieldTriggerBudget)
                var cekisAppBgt = recBefLoad.getValue(fieldTriggerBudget)
                let allowButton = false;
                if(isItem){
                    const itemCount = recBefLoad.getLineCount({ sublistId: sublistItem });
                    // log.debug('itemCount', itemCount)
                    if(itemCount > 0){
                        for (let i = 0; i < itemCount; i++) {
                            const approver = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: approverField,
                                line: i
                            });
                            var appSubtitue
                            if(approver){
                                var empLook = search.lookupFields({
                                    type: "employee",
                                    id: approver,
                                    columns: ["custentity_stc_subtitute_apprvl"],
                                });
                                var firstCek = empLook.custentity_stc_subtitute_apprvl
                                if(firstCek.length > 0){
                                    appSubtitue = firstCek[0].value;
                                }
                                
                            }
                            const approvalStatus = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: approvalStatusField,
                                line: i
                            });
                            const approverFA = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: approverFAfield,
                                line: i
                            });
                            // log.debug('approverFA', approverFA)
                            var appFASubtitue
                            if(approverFA){
                                var appFALook = search.lookupFields({
                                    type: "employee",
                                    id: approverFA,
                                    columns: ["custentity_stc_subtitute_apprvl"],
                                });
                                var firstCekFa = appFALook.custentity_stc_subtitute_apprvl
                                // log.debug('firstCekFa', firstCekFa)
                                if(firstCekFa.length > 0){
                                    appFASubtitue = firstCekFa[0].value;
                                }
                                
                            }
                           
                            const approverSatatusFA = recBefLoad.getSublistValue({
                                sublistId: sublistItem,
                                fieldId: fieldApprovalStatusFA,
                                line: i
                            });
                            if(recType == 'customrecord_tor' || recType == 'customrecord_ter'){
                                // log.debug('cekisAppBgt', cekisAppBgt)
                                if ((Number(approver) === Number(employeeId) &&
                                        Number(approvalStatus) === 1) || (Number(appSubtitue) === Number(employeeId) &&
                                        Number(approvalStatus) === 1)) {
                                            // log.debug('masuk allow')
                                        allowButton = true;
                                        break;
                                    }
                                if(cekisAppBgt){
                                    log.debug('data cek', {cekisAppBgt : cekisAppBgt, appFASubtitue : appFASubtitue, employeeId : employeeId, approverSatatusFA : approverSatatusFA})
                                    if((Number(approverFA) === Number(employeeId) && Number(approverSatatusFA) === 1) || (Number(appFASubtitue) === Number(employeeId) && Number(approverSatatusFA) === 1)){

                                        // log.debug('masuk kondisi approve FA')
                                        allowButton = true;
                                        break;
                                    }
                                }
                                
                            }else{
                                // log.debug('kondisi else tor', {
                                //     appSubtitue : appFASubtitue,
                                //     employeeId : employeeId,
                                //     approvalStatus : approvalStatus
                                // })
                                if ((Number(approver) === Number(employeeId) &&
                                    Number(approvalStatus) === 1) || (Number(appSubtitue) === Number(employeeId) &&
                                    Number(approvalStatus) === 1)) {
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
                                var appSubtitue
                                if(approver){
                                    // log.debug('approver', approver)
                                    var empLook = search.lookupFields({
                                        type: "employee",
                                        id: approver,
                                        columns: ["custentity_stc_subtitute_apprvl"],
                                    });
                                    var firstCek = empLook.custentity_stc_subtitute_apprvl
                                    if(firstCek.length> 0){
                                        appSubtitue = firstCek[0].value;
                                        // log.debug('appSubtitue', appSubtitue)
                                    }
                                    
                                }
                                const approvalStatus = row.getValue(approvalStatusField);
                                if(approvalFaField){
                                    var approverFA = row.getValue(approvalFaField);
                                    var appFASubtitue
                                    if(approverFA){
                                        // log.debug('approverFA', approverFA)
                                        var appFALook = search.lookupFields({
                                            type: "employee",
                                            id: approverFA,
                                            columns: ["custentity_stc_subtitute_apprvl"],
                                        });
                                        var firscekFA = appFALook.custentity_stc_subtitute_apprvl
                                        if(firscekFA.length > 0){
                                            appFASubtitue = firscekFA[0].value;
                                            // log.debug('appFASubtitue', appFASubtitue)
                                        }
                                        
                                    }
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
                                // log.debug('cek data app TAR', {
                                //     appSubtitue : Number(appSubtitue),
                                //     employeeId : employeeId,
                                //     approvalStatus : approvalStatus
                                // })
                                if (
                                    (Number(approver) === Number(employeeId) &&
                                    Number(approvalStatus) === 1) || (Number(appSubtitue) == Number(employeeId) &&
                                    Number(approvalStatus) === 1)
                                ) {
                                    // log.debug('masuk kondisi approve regular');
                                    allowButton = true;
                                    break;
                                }

                                if (
                                    (Number(approverFA) === Number(employeeId) &&
                                    Number(approverStatusFA) === 1) || (Number(appFASubtitue) === Number(employeeId) &&
                                    Number(approverStatusFA) === 1)
                                ) {
                                    // log.debug('masuk kondisi approve FA');
                                    allowButton = true;
                                    break;
                                }
                            }
                        }
                    }
                    if(recType === 'customrecord_ter'){
                        // log.debug('exp')
                        const expCount = recBefLoad.getLineCount({ sublistId: 'recmachcustrecord_tar_id_ter' });
                        // log.debug('expCount', expCount)
                        for (let j = 0; j < expCount; j++) {
                            const approver = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tare_approver',
                                line: j
                            });
                             var appSubtitue
                            if(approver){
                                // log.debug('approver', approver)
                                var empLook = search.lookupFields({
                                    type: "employee",
                                    id: approver,
                                    columns: ["custentity_stc_subtitute_apprvl"],
                                });
                                var firstCek = empLook.custentity_stc_subtitute_apprvl
                                if(firstCek.length > 0){
                                    appSubtitue = firstCek[0].value;
                                    // log.debug('appSubtitue', appSubtitue)
                                }
                                
                            }
                            const approvalStatus = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tare_approval_status',
                                line: j
                            });
                            // log.debug('approvalStatus', approvalStatus)
                            if ((Number(approver) === Number(employeeId) &&
                                Number(approvalStatus) === 1) || (Number(appSubtitue) === Number(employeeId) &&
                                Number(approvalStatus) === 1)) {
                                    // log.debug('kondisi approver')
                                allowButton = true;
                                break;
                            }
                            // =====================
                            const approverFA = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tar_approver_fa',
                                line: j
                            });
                            var appFaSubtitue
                            if(approverFA){
                                
                                var empLook = search.lookupFields({
                                    type: "employee",
                                    id: approverFA,
                                    columns: ["custentity_stc_subtitute_apprvl"],
                                });
                                var firstCek = empLook.custentity_stc_subtitute_apprvl
                                if(firstCek.length > 0){
                                    appFaSubtitue = firstCek[0].value;
                                    
                                }
                                
                            }
                            const approvalStatusFA = recBefLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tar_id_ter',
                                fieldId: 'custrecord_tar_apprvl_sts_fa',
                                line: j
                            });
                            log.debug('data exp ter FA', {approverFA : approverFA, appFaSubtitue : appFaSubtitue, approvalStatusFA : approvalStatusFA})
                            if (
                                    (Number(approverFA) === Number(employeeId) &&
                                    Number(approvalStatusFA) === 1) || (Number(appFaSubtitue) === Number(employeeId) &&
                                    Number(approvalStatusFA) === 1)
                                ) {
                                    log.debug('masuk kondisi approve FA EXP TER');
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
        function getSubtitue(empId){
            var appSubtitue
            var empLook = search.lookupFields({
                type: "employee",
                id: empId,
                columns: ["custentity_stc_subtitute_apprvl"],
            });
            var firstCek = empLook.custentity_stc_subtitute_apprvl
            log.debug('firstCek', firstCek)
            if(firstCek){
                if(firstCek.length > 0){
                    appSubtitue = firstCek[0].value;
                }
            }
            
            
            return appSubtitue
        }
        try {
            if (context.type === context.UserEventType.EDIT) {
                const rec = context.newRecord;
                const recOld = context.oldRecord;
                const currentUser = runtime.getCurrentUser();
                const employeeId = currentUser.id;
                const recType = rec.type;

                const newRecLoad = record.load({
                    type: recType,
                    id: rec.id,
                    isDynamic: false
                });

                const getTargetSublists = (type) => {
                    if (type === 'customrecord_tor') return ['recmachcustrecord_tori_id'];
                    if (type === 'customrecord_tar') return ['recmachcustrecord_tar_e_id'];
                    if (type === 'customrecord_ter') return ['recmachcustrecord_terd_id', 'recmachcustrecord_tar_id_ter'];
                    return [];
                };

                const getFieldMapping = (type, sublistId) => {
                    const mapping = {
                        customrecord_ter: {
                            statusH: 'custrecord_ter_status',
                            apprH: 'custrecord_ter_approval_by_budget_holder',
                            checkH: 'custrecord_ter_approved_by_budget_h',
                            // Budget Fields
                            apprLine: sublistId === 'recmachcustrecord_tar_id_ter' ? 'custrecord_tare_approver' : 'custrecord_terd_approver',
                            statusLine: sublistId === 'recmachcustrecord_tar_id_ter' ? 'custrecord_tare_approval_status' : 'custrecord_terd_approval_status',
                            // Finance Fields (FA)
                            apprFAH: 'custrecord_ter_apprvl_by_finance',
                            checkFAH: 'custrecord_ter_approved_by_finance',
                            apprFALine: sublistId === 'recmachcustrecord_tar_id_ter' ? 'custrecord_tar_approver_fa' : 'custrecord_ter_approver_fa',
                            statusFALine: sublistId === 'recmachcustrecord_tar_id_ter' ? 'custrecord_tar_apprvl_sts_fa' : 'custrecord_ter_apprvl_sts_fa'
                        },
                        customrecord_tor: {
                            statusH: 'custrecord_tor_status', apprH: 'custrecord_tor_approval_by_budget_h', checkH: 'custrecord_tor_approved_by_budget_h',
                            apprLine: 'custrecord_tori_approver', statusLine: 'custrecord_tori_approval_status',
                            apprFAH: 'custrecord_tor_approval_by_finance', checkFAH: 'custrecord_tor_approved_by_finance',
                            apprFALine: 'custrecord_tori_approver_fa', statusFALine: 'custrecord_tori_approval_status_fa'
                        },
                        customrecord_tar: {
                            statusH: 'custrecord_tar_status', apprH: 'custrecord_tar_approval_by_budget_holder', checkH: 'custrecord_tar_approved_by_budget_holder',
                            apprLine: 'custrecord_tare_approver', statusLine: 'custrecord_tare_approval_status'
                        }
                    };
                    return mapping[type];
                };

                const updateLinesForUser = (sublists, isFA, statusValue) => {
                    sublists.forEach(subId => {
                        const fields = getFieldMapping(recType, subId);
                        if (!fields) return;

                        const apprField = isFA ? fields.apprFALine : fields.apprLine;
                        const statField = isFA ? fields.statusFALine : fields.statusLine;
                        const count = newRecLoad.getLineCount({ sublistId: subId });
                        
                        log.debug(`Action Sublist: ${subId}`, `Count: ${count} | Field: ${apprField}`);

                        for (let i = 0; i < count; i++) {
                            const approver = toInt(newRecLoad.getSublistValue({ sublistId: subId, fieldId: apprField, line: i }));
                            const substitute = getSubtitue(approver);
                            
                            log.debug(`Line ${i} Detail`, `Approver: ${approver} | Me: ${employeeId} | Sub: ${substitute}`);

                            if (Number(approver) === Number(employeeId) || (substitute && Number(substitute) === Number(employeeId))) {
                                newRecLoad.setSublistValue({ sublistId: subId, fieldId: statField, line: i, value: statusValue });
                                log.debug('Update Success', `${subId} Line ${i} set to ${statusValue}`);
                            }
                        }
                    });
                };

                const validateFullApproval = (sublists, isFA) => {
                    let hasApproverAnywhere = false;
                    let allValid = true;

                    sublists.forEach(subId => {
                        const fields = getFieldMapping(recType, subId);
                        const apprField = isFA ? fields.apprFALine : fields.apprLine;
                        const statField = isFA ? fields.statusFALine : fields.statusLine;
                        const count = newRecLoad.getLineCount({ sublistId: subId });

                        for (let i = 0; i < count; i++) {
                            const approver = toInt(newRecLoad.getSublistValue({ sublistId: subId, fieldId: apprField, line: i }));
                            if (approver > 0) {
                                hasApproverAnywhere = true;
                                const status = toInt(newRecLoad.getSublistValue({ sublistId: subId, fieldId: statField, line: i }));
                                if (Number(status) !== 2) {
                                    allValid = false;
                                    log.debug('Validation Fail', `Sublist ${subId} Line ${i} is status ${status}`);
                                }
                            }
                        }
                    });
                    return hasApproverAnywhere && allValid;
                };

                const targetSublists = getTargetSublists(recType);
                const f = getFieldMapping(recType, targetSublists[0]);

                if (f) {
                    const oldStatus = toInt(recOld.getValue(f.statusH));
                    const newStatus = toInt(newRecLoad.getValue(f.statusH));
                    const oldAppr = toInt(recOld.getValue(f.apprH));
                    const newAppr = toInt(newRecLoad.getValue(f.apprH));

                    // FINANCE APPROVAL (FA)
                    if (f.apprFAH) {
                        const oldApprFA = toInt(recOld.getValue(f.apprFAH));
                        const newApprFA = toInt(newRecLoad.getValue(f.apprFAH));
                        const isBudgetApproved = newRecLoad.getValue(f.checkH) === true || newRecLoad.getValue(f.checkH) === 'T';

                        if (newApprFA !== oldApprFA && Number(newApprFA) === Number(employeeId) && isBudgetApproved) {
                            log.debug('Process', 'Finance Approval Triggered');
                            
                            updateLinesForUser(targetSublists, true, 2);
                            
                            if (validateFullApproval(targetSublists, true)) {
                                newRecLoad.setValue(f.checkFAH, true);
                                log.debug('Result', 'Header set to Approved (All Sublists 2)');
                            }
                            newRecLoad.save({ ignoreMandatoryFields: true });
                            return;
                        }
                    }

                    if (newAppr !== oldAppr && Number(newAppr) === Number(employeeId)) {
                        updateLinesForUser(targetSublists, false, 2);
                        if (validateFullApproval(targetSublists, false)) {
                            newRecLoad.setValue(f.checkH, true);
                        }
                        newRecLoad.save({ ignoreMandatoryFields: true });
                        return;
                    }

                    if ((oldStatus !== 3 && newStatus === 3) || (oldStatus === 3 && newStatus === 1)) {
                        const isReject = (newStatus === 3);
                        targetSublists.forEach(subId => {
                            const fields = getFieldMapping(recType, subId);
                            const count = newRecLoad.getLineCount({ sublistId: subId });
                            for (let i = 0; i < count; i++) {
                                const val = isReject ? 3 : 1;
                                newRecLoad.setSublistValue({ sublistId: subId, fieldId: fields.statusLine, line: i, value: val });
                                if (fields.statusFALine) newRecLoad.setSublistValue({ sublistId: subId, fieldId: fields.statusFALine, line: i, value: val });
                            }
                        });
                        if (!isReject) {
                            newRecLoad.setValue(f.apprH, ""); newRecLoad.setValue(f.checkH, false);
                            if (f.apprFAH) { newRecLoad.setValue(f.apprFAH, ""); newRecLoad.setValue(f.checkFAH, false); }
                        }
                        newRecLoad.save({ ignoreMandatoryFields: true });
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