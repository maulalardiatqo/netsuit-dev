/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/url', 'N/https'], function(currentRecord, dialog, log, search, url, https) {

    function pageInit(context) {}

    function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode) {
        log.debug('params BH', {paramSof: paramSof, paramAccount: paramAccount, paramAmount: paramAmount, costCenter: costCenter, projectCode: projectCode});
        
        function runSearch(useAccount) {
            var filters = [
                ["custrecord_stc_sof", "is", paramSof], "AND",
                ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
                ["isinactive", "is", "F"]
            ];
            if (useAccount && paramAccount) {
                filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);
            }

            var searchObj = search.create({
                type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                filters: filters,
                columns: [
                    search.createColumn({ name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC }),
                    search.createColumn({ name: "custrecord_stc_bdgt_hldr_approval" }),
                    search.createColumn({ name: "custrecord_stc_bh_cost_center" }),
                    search.createColumn({ name: "custrecord_stc_bh_project_code" })
                ]
            });

            var results = searchObj.run().getRange({ start: 0, end: 100 });
            if (results && results.length > 0) {
                for (var i = 0; i < results.length; i++) {
                    var mtrxCC = results[i].getValue("custrecord_stc_bh_cost_center");
                    var mtrxPC = results[i].getValue("custrecord_stc_bh_project_code");
                    var approverId = results[i].getValue("custrecord_stc_bdgt_hldr_approval");

                    if (mtrxCC == costCenter && mtrxPC == projectCode) {
                        if (approverId != createdBy) return approverId;
                    }
                }
                for (var j = 0; j < results.length; j++) {
                    var mtrxCCG = results[j].getValue("custrecord_stc_bh_cost_center");
                    var mtrxPCG = results[j].getValue("custrecord_stc_bh_project_code");
                    var apprvId = results[j].getValue("custrecord_stc_bdgt_hldr_approval");
                    if (!mtrxCCG && !mtrxPCG) {
                        if (apprvId != createdBy) return apprvId;
                    }
                }
            }
            return null;
        }

        var approval = runSearch(true);
        if (!approval) approval = runSearch(false);
        return approval;
    }

    function getFinanceMatric(sofId, amount, createdBy, costCenter, projectCode) {
        var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
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

        var results = customrecord_stc_apprvl_mtrix_financeSearchObj.run().getRange({ start: 0, end: 100 });
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var mtrxCC = results[i].getValue("custrecord_stc_fa_cost_center");
                var mtrxPC = results[i].getValue("custrecord_stc_fa_project_code");
                var apprvFinance = results[i].getValue("custrecord_stc_apprvl_finance");
                if (mtrxCC == costCenter && mtrxPC == projectCode) {
                    if (apprvFinance != createdBy) return apprvFinance;
                }
            }
            for (var j = 0; j < results.length; j++) {
                var mtrxCCG = results[j].getValue("custrecord_stc_fa_cost_center");
                var mtrxPCG = results[j].getValue("custrecord_stc_fa_project_code");
                var apprvFinanceG = results[j].getValue("custrecord_stc_apprvl_finance");
                if (!mtrxCCG && !mtrxPCG) {
                    if (apprvFinanceG != createdBy) return apprvFinanceG;
                }
            }
        }
        return null;
    }

    function saveRecord(context) {
        var rec = context.currentRecord;
        var createdBy = rec.getValue('custbody_stc_create_by');
        var type = rec.getValue('type');
        var groupMap = {};

        var sublists = ['item', 'expense'];
        sublists.forEach(function(sublistId) {
            var lineCount = rec.getLineCount({ sublistId: sublistId });
            for (var i = 0; i < lineCount; i++) {
                var sofId = rec.getSublistValue({ sublistId: sublistId, fieldId: 'cseg_stc_sof', line: i });
                if (!sofId) continue;

                var costCenter = rec.getSublistValue({ sublistId: sublistId, fieldId: 'department', line: i }) || '';
                var projectCode = rec.getSublistValue({ sublistId: sublistId, fieldId: 'class', line: i }) || '';
                
                // --- KUNCI GROUPING BARU ---
                var groupKey = sofId + '_' + costCenter + '_' + projectCode;

                var amountField = (sublistId === 'item') ? ((type == 'cutrprch108' || type == 'purchreq') ? 'amount' : 'grossamt') : ((type == 'exprept' || type == 'purchreq') ? 'amount' : 'grossamt');
                var amount = parseFloat(rec.getSublistValue({ sublistId: sublistId, fieldId: amountField, line: i })) || 0;
                var statusLine = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_approval_status_line', line: i });
                var statusFa = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i });

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = { 
                        sofId: sofId, 
                        total: 0, 
                        account: null, 
                        costCenter: costCenter, 
                        projectCode: projectCode, 
                        lines: [] 
                    };
                }
                
                groupMap[groupKey].total += amount;
                groupMap[groupKey].lines.push({ sublist: sublistId, line: i, statusLine: statusLine, statusFa: statusFa });

                if (!groupMap[groupKey].account) {
                    if (sublistId === 'item') {
                        var itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        if (itemId) {
                            var suiteletUrl = url.resolveScript({
                                scriptId: "customscript_abj_sl_get_item",
                                deploymentId: "customdeploy_abj_sl_get_item",
                                params: { custscript_item_id: itemId }
                            });
                            var response = https.get({ url: suiteletUrl });
                            groupMap[groupKey].account = response.body || '';
                        }
                    } else {
                        groupMap[groupKey].account = rec.getSublistValue({ sublistId: 'expense', fieldId: (type == 'exprept' || type == 'purchreq') ? 'expenseaccount' : 'account', line: i });
                    }
                }
            }
        });

        for (var key in groupMap) {
            var data = groupMap[key];
            var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode);
            var finApprover = null;

            if (['vendbill', 'purchreq', 'purchord', 'exprept'].includes(type)) {
                finApprover = getFinanceMatric(data.sofId, data.total, createdBy, data.costCenter, data.projectCode);
            }

            data.lines.forEach(function(item) {
                var isLine2 = (item.statusLine == "2" || item.statusLine == 2);
                var isFa2 = (item.statusFa == "2" || item.statusFa == 2);

                if (!isLine2 || !isFa2) {
                    rec.selectLine({ sublistId: item.sublist, line: item.line });
                    if (!isLine2) {
                        rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approver_linetrx', value: bhApprover || '' });
                        rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approval_status_line', value: "1" });
                    }
                    if (!isFa2 && finApprover) {
                        rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_approver_fa', value: finApprover });
                        rec.setCurrentSublistValue({ sublistId: item.sublist, fieldId: 'custcol_stc_apprvl_sts_fa', value: "1" });
                    }
                    rec.commitLine({ sublistId: item.sublist });
                }
            });
        }
        return true;
    }

    return { pageInit: pageInit, saveRecord: saveRecord };
});