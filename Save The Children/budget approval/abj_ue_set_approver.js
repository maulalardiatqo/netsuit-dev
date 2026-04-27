/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime'], (search, log, https, url, runtime) => {

    // const beforeSubmit = (scriptContext) => {
    //     const { newRecord, oldRecord, type, UserEventType } = scriptContext;
        
    //     if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;

    //     const createdBy = newRecord.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
    //     const recType = newRecord.type;
    //     var poType = null
    //     if(recType == 'purchaseorder'){
    //         poType = newRecord.getValue('custbody_stc_po_type')
    //     }
    //     const groupMap = {};
    //     const financeMap = {};
    //     const sublists = ['item', 'expense'];

    //     log.debug('Start beforeSubmit', { recType, createdBy, type });

    //     sublists.forEach(sublistId => {
    //         const lineCount = newRecord.getLineCount({ sublistId });
    //         const oldLineCount = oldRecord ? oldRecord.getLineCount({ sublistId }) : 0;

    //         for (let i = 0; i < lineCount; i++) {
    //             const sofId = newRecord.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
    //             if (!sofId) continue;

    //             const costCenter = newRecord.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
    //             const projectCode = newRecord.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';
                
    //             let isChanged = true; 
    //             if (type === UserEventType.EDIT && oldRecord) {
    //                 if (i < oldLineCount) {
    //                     const oldSof = oldRecord.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
    //                     const oldDept = oldRecord.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
    //                     const oldClass = oldRecord.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';
                        
    //                     let oldAmountField = '';
    //                     if (sublistId === 'item') {
    //                         oldAmountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
    //                     } else {
    //                         oldAmountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
    //                         if (recType === 'purchaserequisition' || recType === 'purchasereq') oldAmountField = 'estimatedamount';
    //                     }
                        
    //                     const oldAmount = parseFloat(oldRecord.getSublistValue({ sublistId, fieldId: oldAmountField, line: i })) || 0;
                        
    //                     let oldAccount = '';
    //                     if (sublistId === 'item') {
    //                         const oldItem = oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
    //                         const newItem = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
    //                         oldAccount = oldItem; 
    //                         var currentAccountCheck = newItem;
    //                     } else {
    //                         const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
    //                         oldAccount = oldRecord.getSublistValue({ sublistId, fieldId: fieldAcc, line: i });
    //                         var currentAccountCheck = newRecord.getSublistValue({ sublistId, fieldId: fieldAcc, line: i });
    //                     }

    //                     const currentAmount = parseFloat(newRecord.getSublistValue({ sublistId, fieldId: (sublistId === 'item' && (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : (sublistId === 'item' ? 'grossamt' : (recType === 'expensereport' || recType === 'exprept' ? 'amount' : 'grossamt'))), line: i })) || 0;
    //                     log.debug('Pengecekan Baris ' + i, {
    //                         sof: { new: sofId, old: oldSof, match: (sofId === oldSof) },
    //                         dept: { new: costCenter, old: oldDept, match: (costCenter === oldDept) },
    //                         amount: { new: currentAmount, old: oldAmount, match: (currentAmount === oldAmount) },
    //                         acc: { new: currentAccountCheck, old: oldAccount, match: (currentAccountCheck === oldAccount) }
    //                     });
    //                     if (sofId === oldSof && 
    //                         costCenter === oldDept && 
    //                         projectCode === oldClass && 
    //                         currentAmount === oldAmount && 
    //                         currentAccountCheck === oldAccount) {
    //                         isChanged = false;
    //                     }
    //                 }
    //             }

    //             let groupLevel = 1;
    //             const sofLookup = search.lookupFields({
    //                 type: 'customrecord_cseg_stc_sof',
    //                 id: sofId,
    //                 columns: ['custrecord_stc_sof_kreasi', 'custrecord_stc_grouping_for_finance']
    //             });

    //             if (sofLookup.custrecord_stc_sof_kreasi === true || sofLookup.custrecord_stc_sof_kreasi === 'T') {
    //                 groupLevel = 2;
    //                 if (costCenter) {
    //                     const deptLookup = search.lookupFields({
    //                         type: 'department',
    //                         id: costCenter,
    //                         columns: ['custrecord_stc_kreasi']
    //                     });
    //                     if (deptLookup.custrecord_stc_kreasi === true || deptLookup.custrecord_stc_kreasi === 'T') {
    //                         groupLevel = 3;
    //                     }
    //                 }
    //             }

    //             const groupKey = (groupLevel === 1) ? sofId : (groupLevel === 2 ? `${sofId}_${costCenter}` : `${sofId}_${costCenter}_${projectCode}`);

    //             let amountField = '';
    //             if (sublistId === 'item') {
    //                 amountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
    //             } else {
    //                 amountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
    //                 if (recType === 'purchaserequisition' || recType === 'purchasereq') amountField = 'estimatedamount';
    //             }

    //             const amount = parseFloat(newRecord.getSublistValue({ sublistId, fieldId: amountField, line: i })) || 0;
    //             const statusLine = newRecord.getSublistValue({ sublistId, fieldId: 'custcol_stc_approval_status_line', line: i });
    //             const statusFa = newRecord.getSublistValue({ sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i });

    //             if (!groupMap[groupKey]) {
    //                 groupMap[groupKey] = {
    //                     sofId, total: 0, account: null, costCenter, projectCode, groupLevel, lines: []
    //                 };
    //             }
    //             groupMap[groupKey].total += amount;
    //             groupMap[groupKey].lines.push({ sublistId, line: i, statusLine, statusFa, isChanged });

    //             if (!financeMap[sofId]) financeMap[sofId] = 0;
    //             financeMap[sofId] += amount;

    //             if (!groupMap[groupKey].account) {
    //                 if (sublistId === 'item') {
    //                     const itemId = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
    //                     if (itemId) {
    //                         const suiteletUrl = url.resolveScript({
    //                             scriptId: 'customscript_abj_sl_get_item',
    //                             deploymentId: 'customdeploy_abj_sl_get_item',
    //                             params: { custscript_item_id: itemId },
    //                             returnExternalUrl: true
    //                         });
    //                         const response = https.get({ url: suiteletUrl });
    //                         log.debug('response', response)
    //                         groupMap[groupKey].account = response.body || '';
    //                     }
    //                 } else {
    //                     const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
    //                     groupMap[groupKey].account = newRecord.getSublistValue({ sublistId: 'expense', fieldId: fieldAcc, line: i });
    //                 }
    //             }
    //         }
    //     });

    //     for (let key in groupMap) {
    //         const data = groupMap[key];
            
    //         const anyLineChanged = data.lines.some(l => l.isChanged === true);
    //         log.debug('anyLineChanged', anyLineChanged)
    //         if (!anyLineChanged && type === UserEventType.EDIT) {
    //             log.debug('No Change Detected', 'Skipping logic for group: ' + key);
    //             continue; 
    //         }

    //         var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
    //             log.debug('bhApprover', bhApprover)
    //         if(bhApprover){
    //             var cekBhSubtitue = getSubtitue(bhApprover);
    //             log.debug('cekBhSubtitue', cekBhSubtitue)
    //             if(cekBhSubtitue) bhApprover = cekBhSubtitue;
    //         }
            
    //         const totalFinanceForSof = financeMap[data.sofId];
    //         let finApprover = null;
    //         const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
            
    //         if (validFinanceTypes.includes(recType)) {
    //             finApprover = getFinanceMatric(data.sofId, totalFinanceForSof, createdBy, recType, poType);
    //             log.debug('finApprover', finApprover)
    //             if(finApprover){
    //                 var cekFinSubtitue = getSubtitue(finApprover);
    //                 log.debug('cekFinSubtitue', cekFinSubtitue)
    //                 if(cekFinSubtitue) finApprover = cekFinSubtitue;
    //             }
    //         }

    //         data.lines.forEach(item => {
    //             if (item.isChanged) {
    //                 const isLineApproved = (item.statusLine == "2" || item.statusLine == 2);
    //                 const isFaApproved = (item.statusFa == "2" || item.statusFa == 2);

    //                 if (!isLineApproved) {
    //                     newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_linetrx', line: item.line, value: bhApprover });
    //                     newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approval_status_line', line: item.line, value: "1" });
    //                 }
    //                 if (!isFaApproved && finApprover) {
    //                     newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_fa', line: item.line, value: finApprover });
    //                     newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: item.line, value: "1" });
    //                 }
    //             }
    //         });
    //     }
    // };

    const beforeSubmit = (scriptContext) => {
    const { newRecord, oldRecord, type, UserEventType } = scriptContext;
    
    if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;

    const createdBy = newRecord.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
    const recType = newRecord.type;
    var poType = null
    if(recType == 'purchaseorder'){
        poType = newRecord.getValue('custbody_stc_po_type')
    }
    const groupMap = {};
    const financeMap = {};
    const sublists = ['item', 'expense'];

    log.debug('Start beforeSubmit', { recType, createdBy, type });

    sublists.forEach(sublistId => {
        const lineCount = newRecord.getLineCount({ sublistId });
        const oldLineCount = oldRecord ? oldRecord.getLineCount({ sublistId }) : 0;

        for (let i = 0; i < lineCount; i++) {
            const sofId = newRecord.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
            if (!sofId) continue;

            const costCenter = newRecord.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
            const projectCode = newRecord.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';
            
            let isChanged = true; 
            if (type === UserEventType.EDIT && oldRecord) {
                if (i < oldLineCount) {
                    const oldSof = oldRecord.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
                    const oldDept = oldRecord.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
                    const oldClass = oldRecord.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';
                    
                    let oldAmountField = '';
                    if (sublistId === 'item') {
                        oldAmountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
                    } else {
                        oldAmountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
                        if (recType === 'purchaserequisition' || recType === 'purchasereq') oldAmountField = 'estimatedamount';
                    }
                    
                    const oldAmount = parseFloat(oldRecord.getSublistValue({ sublistId, fieldId: oldAmountField, line: i })) || 0;
                    
                    let oldAccount = '';
                    if (sublistId === 'item') {
                        const oldItem = oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        const newItem = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        oldAccount = oldItem; 
                        var currentAccountCheck = newItem;
                    } else {
                        const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
                        oldAccount = oldRecord.getSublistValue({ sublistId, fieldId: fieldAcc, line: i });
                        var currentAccountCheck = newRecord.getSublistValue({ sublistId, fieldId: fieldAcc, line: i });
                    }

                    const currentAmount = parseFloat(newRecord.getSublistValue({ sublistId, fieldId: (sublistId === 'item' && (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : (sublistId === 'item' ? 'grossamt' : (recType === 'expensereport' || recType === 'exprept' ? 'amount' : 'grossamt'))), line: i })) || 0;
                    
                    if (sofId === oldSof && 
                        costCenter === oldDept && 
                        projectCode === oldClass && 
                        currentAmount === oldAmount && 
                        currentAccountCheck === oldAccount) {
                        isChanged = false;
                    }
                }
            }

            let groupLevel = 1;
            const sofLookup = search.lookupFields({
                type: 'customrecord_cseg_stc_sof',
                id: sofId,
                columns: ['custrecord_stc_sof_kreasi', 'custrecord_stc_grouping_for_finance']
            });

            const isFinanceGrouping = sofLookup.custrecord_stc_grouping_for_finance === true || sofLookup.custrecord_stc_grouping_for_finance === 'T';

            if (sofLookup.custrecord_stc_sof_kreasi === true || sofLookup.custrecord_stc_sof_kreasi === 'T') {
                groupLevel = 2;
                if (costCenter) {
                    const deptLookup = search.lookupFields({
                        type: 'department',
                        id: costCenter,
                        columns: ['custrecord_stc_kreasi']
                    });
                    if (deptLookup.custrecord_stc_kreasi === true || deptLookup.custrecord_stc_kreasi === 'T') {
                        groupLevel = 3;
                    }
                }
            }

            const groupKey = (groupLevel === 1) ? sofId : (groupLevel === 2 ? `${sofId}_${costCenter}` : `${sofId}_${costCenter}_${projectCode}`);

            let amountField = '';
            if (sublistId === 'item') {
                amountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
            } else {
                amountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
                if (recType === 'purchaserequisition' || recType === 'purchasereq') amountField = 'estimatedamount';
            }

            const amount = parseFloat(newRecord.getSublistValue({ sublistId, fieldId: amountField, line: i })) || 0;
            const statusLine = newRecord.getSublistValue({ sublistId, fieldId: 'custcol_stc_approval_status_line', line: i });
            const statusFa = newRecord.getSublistValue({ sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i });

            if (!groupMap[groupKey]) {
                groupMap[groupKey] = {
                    sofId, total: 0, account: null, costCenter, projectCode, groupLevel, lines: [], isFinanceGrouping: isFinanceGrouping
                };
            }
            groupMap[groupKey].total += amount;
            groupMap[groupKey].lines.push({ sublistId, line: i, statusLine, statusFa, isChanged });

            const finMapKey = isFinanceGrouping ? `${sofId}_${projectCode}` : sofId;
            if (!financeMap[finMapKey]) financeMap[finMapKey] = 0;
            financeMap[finMapKey] += amount;

            if (!groupMap[groupKey].account) {
                if (sublistId === 'item') {
                    const itemId = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    if (itemId) {
                        const suiteletUrl = url.resolveScript({
                            scriptId: 'customscript_abj_sl_get_item',
                            deploymentId: 'customdeploy_abj_sl_get_item',
                            params: { custscript_item_id: itemId },
                            returnExternalUrl: true
                        });
                        const response = https.get({ url: suiteletUrl });
                        groupMap[groupKey].account = response.body || '';
                    }
                } else {
                    const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
                    groupMap[groupKey].account = newRecord.getSublistValue({ sublistId: 'expense', fieldId: fieldAcc, line: i });
                }
            }
        }
    });

    for (let key in groupMap) {
        const data = groupMap[key];
        
        const anyLineChanged = data.lines.some(l => l.isChanged === true);
        if (!anyLineChanged && type === UserEventType.EDIT) {
            continue; 
        }

        var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
        if(bhApprover){
            var cekBhSubtitue = getSubtitue(bhApprover);
            if(cekBhSubtitue) bhApprover = cekBhSubtitue;
        }
        
        const finMapKey = data.isFinanceGrouping ? `${data.sofId}_${data.projectCode}` : data.sofId;
        const totalFinanceForSof = financeMap[finMapKey];
        let finApprover = null;
        const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
        
        if (validFinanceTypes.includes(recType)) {
            finApprover = getFinanceMatric(data.sofId, totalFinanceForSof, createdBy, recType, poType, data.projectCode);
            if(finApprover){
                var cekFinSubtitue = getSubtitue(finApprover);
                if(cekFinSubtitue) finApprover = cekFinSubtitue;
            }
        }

        data.lines.forEach(item => {
            if (item.isChanged) {
                const isLineApproved = (item.statusLine == "2" || item.statusLine == 2);
                const isFaApproved = (item.statusFa == "2" || item.statusFa == 2);

                if (!isLineApproved) {
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_linetrx', line: item.line, value: bhApprover });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approval_status_line', line: item.line, value: "1" });
                }
                if (!isFaApproved && finApprover) {
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_fa', line: item.line, value: finApprover });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: item.line, value: "1" });
                }
            }
        });
    }
};
function getSubtitue(empId){
        log.debug('empId', empId);
        var appSubtitue
        var empLook = search.lookupFields({
            type: "employee",
            id: empId,
            columns: ["custentity_stc_subtitute_apprvl", "custentity_stc_delgtion_date_from", "custentity_stc_delegation_date_to"],
        });

        var firstCek = empLook.custentity_stc_subtitute_apprvl;
        var delegateFromStr = empLook.custentity_stc_delgtion_date_from; 
        var delegateToStr = empLook.custentity_stc_delegation_date_to;   

        if (firstCek && firstCek.length > 0 && delegateFromStr && delegateToStr) {
            
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            var parseDate = function(str) {
                var parts = str.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };

            var dFrom = parseDate(delegateFromStr);
            var dTo = parseDate(delegateToStr);
            log.debug('perbandingan date', {today : today, dFrom : dFrom, dTo : dTo})
            if (today >= dFrom && today <= dTo) {
                appSubtitue = firstCek[0].value;
                log.debug('Status', 'Masuk Range Delegasi. Substitute Assigned.');
            } else {
                log.debug('Status', 'Di luar periode delegasi. Substitute Ignored.');
            }

        }
        return appSubtitue
    }
    const getBudgetHolderApproval = (paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode, groupLevel) => {
        const runSearch = (useAccount) => {
            let filters = [
                ["custrecord_stc_sof", "anyof", paramSof], "AND",
                ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
                ["isinactive", "is", "F"]
            ];
            if (groupLevel >= 2 && costCenter) filters.push("AND", ["custrecord_stc_bh_cost_center", "anyof", costCenter]);
            if (groupLevel === 3 && projectCode) filters.push("AND", ["custrecord_stc_bh_project_code", "anyof", projectCode]);
            if (useAccount && paramAccount) filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);

            const searchObj = search.create({
                type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                filters: filters,
                columns: [{ name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC }, "custrecord_stc_bdgt_hldr_approval", "custrecord_stc_bh_cost_center", "custrecord_stc_bh_project_code"]
            });

            const results = searchObj.run().getRange({ start: 0, end: 100 });
            if (results && results.length > 0) {
                for (let res of results) {
                    let mtrxCC = res.getValue("custrecord_stc_bh_cost_center");
                    let mtrxPC = res.getValue("custrecord_stc_bh_project_code");
                    let approverId = res.getValue("custrecord_stc_bdgt_hldr_approval");
                    if (groupLevel === 1 && !mtrxCC && !mtrxPC && approverId != createdBy) return approverId;
                    if (groupLevel === 2 && mtrxCC == costCenter && !mtrxPC && approverId != createdBy) return approverId;
                    if (groupLevel === 3 && mtrxCC == costCenter && mtrxPC == projectCode && approverId != createdBy) return approverId;
                }
                for (let res of results) {
                    if (!res.getValue("custrecord_stc_bh_cost_center") && !res.getValue("custrecord_stc_bh_project_code") && res.getValue("custrecord_stc_bdgt_hldr_approval") != createdBy) {
                        return res.getValue("custrecord_stc_bdgt_hldr_approval");
                    }
                }
            }
            return null;
        };
        return runSearch(true) || runSearch(false);
    };

    const getFinanceMatric = (sofId, amount, createdBy, recordType, poType, projectCode) => {
        log.debug('paramFA', {
            sofId : sofId, amount : amount, createdBy : createdBy, recordType : recordType, poType : poType, projectCode : projectCode
        })
        log.debug('poType', poType);
        if(poType == 3){
            recordType = 'non-po'
        }
        const filters = [
            ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
            ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
            ["isinactive", "is", "F"]
        ];
        log.debug('recordType', recordType)
        const approvalField = (recordType === 'purchaseorder') 
            ? "custrecord_stc_apprvl_finance" 
            : "custrecord_stc_apprvl_finance_non_po";

        const searchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: filters,
            columns: [
                { name: "custrecord_finance_max_amnt", sort: search.Sort.ASC },
                "custrecord_stc_apprvl_finance",
                "custrecord_stc_apprvl_finance_non_po"
            ]
        });

        const results = searchObj.run().getRange({ start: 0, end: 100 });
        log.debug('results FA', results)
        if (results && results.length > 0) {
            for (let res of results) {
                const approverId = res.getValue(approvalField);
                
                if (approverId && approverId != createdBy) {
                    return approverId;
                }
            }
        }

        return null;
    };

    return { beforeSubmit }; 
});