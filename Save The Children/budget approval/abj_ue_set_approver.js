/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime'], (search, log, https, url, runtime) => {

    const beforeSubmit = (scriptContext) => {
        const { newRecord, type, UserEventType } = scriptContext;
        
        if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;

        const createdBy = newRecord.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
        const recType = newRecord.type;
        const groupMap = {};
        const financeMap = {};
        const sublists = ['item', 'expense'];

        log.debug('Start beforeSubmit', { recType, createdBy });

        sublists.forEach(sublistId => {
            const lineCount = newRecord.getLineCount({ sublistId });
            for (let i = 0; i < lineCount; i++) {
                const sofId = newRecord.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
                if (!sofId) continue;

                const costCenter = newRecord.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
                const projectCode = newRecord.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';
                
                let groupLevel = 1;
                const sofLookup = search.lookupFields({
                    type: 'customrecord_cseg_stc_sof',
                    id: sofId,
                    columns: ['custrecord_stc_sof_kreasi']
                });

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
                        sofId, total: 0, account: null, costCenter, projectCode, groupLevel, lines: []
                    };
                }
                groupMap[groupKey].total += amount;
                groupMap[groupKey].lines.push({ sublistId, line: i, statusLine, statusFa });

                if (!financeMap[sofId]) financeMap[sofId] = 0;
                financeMap[sofId] += amount;

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
            log.debug('params BH', {sofId : data.sofId, account : data.account, totalAmount : data.total, createdBy : createdBy, costCenter : data.costCenter, projectCode : data.projectCode, groupLevel : data.groupLevel})
            const bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
            log.debug('bhApprover', bhApprover)
            
            const totalFinanceForSof = financeMap[data.sofId];
            let finApprover = null;
            const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
            
            if (validFinanceTypes.includes(recType)) {
                finApprover = getFinanceMatric(data.sofId, totalFinanceForSof, createdBy);
                log.debug('finApprover', finApprover)
            }

            data.lines.forEach(item => {
                const isLineApproved = (item.statusLine == "2" || item.statusLine == 2);
                const isFaApproved = (item.statusFa == "2" || item.statusFa == 2);

                if (!isLineApproved) {
                    // MENGGUNAKAN setSublistValue (Cara benar di beforeSubmit)
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_linetrx', line: item.line, value: bhApprover });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approval_status_line', line: item.line, value: "1" });
                }
                if (!isFaApproved && finApprover) {
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_approver_fa', line: item.line, value: finApprover });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: item.line, value: "1" });
                }
            });
        }
    };

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

    const getFinanceMatric = (sofId, amount, createdBy) => {
        const filters = [
            ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
            ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
            ["isinactive", "is", "F"]
        ];
        const searchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters,
            columns: [{ name: "custrecord_finance_max_amnt", sort: search.Sort.ASC }, "custrecord_stc_apprvl_finance"]
        });
        const results = searchObj.run().getRange({ start: 0, end: 100 });
        if (results && results.length > 0) {
            for (let res of results) {
                if (res.getValue("custrecord_stc_apprvl_finance") != createdBy) return res.getValue("custrecord_stc_apprvl_finance");
            }
        }
        return null;
    };

    return { beforeSubmit }; 
});