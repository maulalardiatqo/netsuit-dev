/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/url', 'N/https'], function(currentRecord, dialog, log, search, url, https) {

    function pageInit(context) {}

    function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode, groupLevel) {
        log.debug('params BH', {paramSof: paramSof, paramAccount: paramAccount, paramAmount: paramAmount, costCenter: costCenter, projectCode: projectCode, groupLevel: groupLevel});
        
        function runSearch(useAccount) {
            var filters = [
                ["custrecord_stc_sof", "is", paramSof], "AND",
                ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
                ["isinactive", "is", "F"]
            ];

            if (groupLevel >= 2 && costCenter) {
                filters.push("AND", ["custrecord_stc_bh_cost_center", "anyof", costCenter]);
            }
            if (groupLevel === 3 && projectCode) {
                filters.push("AND", ["custrecord_stc_bh_project_code", "anyof", projectCode]);
            }
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

                    if (groupLevel === 1) {
                        if (!mtrxCC && !mtrxPC && approverId != createdBy) return approverId;
                    } else if (groupLevel === 2) {
                        if (mtrxCC == costCenter && !mtrxPC && approverId != createdBy) return approverId;
                    } else if (groupLevel === 3) {
                        if (mtrxCC == costCenter && mtrxPC == projectCode && approverId != createdBy) return approverId;
                    }
                }
                
                for (var j = 0; j < results.length; j++) {
                    var mtrxCCG = results[j].getValue("custrecord_stc_bh_cost_center");
                    var mtrxPCG = results[j].getValue("custrecord_stc_bh_project_code");
                    var apprvId = results[j].getValue("custrecord_stc_bdgt_hldr_approval");
                    if (!mtrxCCG && !mtrxPCG && apprvId != createdBy) return apprvId;
                }
            }
            return null;
        }

        var approval = runSearch(true);
        if (!approval) approval = runSearch(false);
        return approval;
    }

    function getFinanceMatric(sofId, amount, createdBy, costCenter, projectCode, groupLevel) {
        log.debug('params FA', {sofId : sofId, amount : amount, createdBy : createdBy, costCenter : costCenter, projectCode : projectCode, groupLevel: groupLevel});
        
        var filters = [
            ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
            ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
            ["isinactive", "is", "F"]
        ];

        if (groupLevel >= 2 && costCenter) {
            filters.push("AND", ["custrecord_stc_fa_cost_center", "anyof", costCenter]);
        }
        if (groupLevel === 3 && projectCode) {
            filters.push("AND", ["custrecord_stc_fa_project_code", "anyof", projectCode]);
        }

        var customrecord_stc_apprvl_mtrix_financeSearchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: filters,
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

                if (groupLevel === 1) {
                    if (!mtrxCC && !mtrxPC && apprvFinance != createdBy) return apprvFinance;
                } else if (groupLevel === 2) {
                    if (mtrxCC == costCenter && !mtrxPC && apprvFinance != createdBy) return apprvFinance;
                } else if (groupLevel === 3) {
                    if (mtrxCC == costCenter && mtrxPC == projectCode && apprvFinance != createdBy) return apprvFinance;
                }
            }
            for (var j = 0; j < results.length; j++) {
                var mtrxCCG = results[j].getValue("custrecord_stc_fa_cost_center");
                var mtrxPCG = results[j].getValue("custrecord_stc_fa_project_code");
                var apprvFinanceG = results[j].getValue("custrecord_stc_apprvl_finance");
                if (!mtrxCCG && !mtrxPCG && apprvFinanceG != createdBy) return apprvFinanceG;
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
                
                var groupKey = sofId;
                var groupLevel = 1;

                var sofLookup = search.lookupFields({
                    type: 'customrecord_cseg_stc_sof', 
                    id: sofId,
                    columns: ['custrecord_stc_sof_kreasi']
                });
                var isSofKreasi = sofLookup.custrecord_stc_sof_kreasi;
                log.debug('isSofKreasi', isSofKreasi);

                if (isSofKreasi === true || isSofKreasi === 'T') {
                    groupKey = sofId + '_' + costCenter;
                    groupLevel = 2;
                    if (costCenter) {
                        var deptLookup = search.lookupFields({
                            type: 'department',
                            id: costCenter,
                            columns: ['custrecord_stc_kreasi']
                        });
                        var isKreasi = deptLookup.custrecord_stc_kreasi;
                        log.debug('isKreasi', isKreasi);
                        if (isKreasi === true || isKreasi === 'T') {
                            groupKey = sofId + '_' + costCenter + '_' + projectCode;
                            groupLevel = 3;
                        }
                    }
                }

                var amountField = (sublistId === 'item') 
                    ? ((type === 'cutrprch108' || type === 'purchreq') ? 'estimatedamount' : 'grossamt') 
                    : (type === 'exprept' ? 'amount' : (type === 'purchreq' ? 'estimatedamount' : 'grossamt'));
                
                var amount = parseFloat(rec.getSublistValue({ sublistId: sublistId, fieldId: amountField, line: i })) || 0;
                var statusLine = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_approval_status_line', line: i });
                var statusFa = rec.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_stc_apprvl_sts_fa', line: i });

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = { 
                        sofId: sofId, 
                        total: 0, 
                        account: null, 
                        costCenter: (groupLevel >= 2) ? costCenter : null, 
                        projectCode: (groupLevel === 3) ? projectCode : null, 
                        groupLevel: groupLevel,
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
                        var fieldAcc = (type == 'exprept' || type == 'purchreq') ? 'expenseaccount' : 'account';
                        groupMap[groupKey].account = rec.getSublistValue({ sublistId: 'expense', fieldId: fieldAcc, line: i });
                    }
                }
            }
        });
        log.debug('groupMap length', groupMap.length)
        log.debug('groupMap', groupMap)
        for (var key in groupMap) {
            var data = groupMap[key];
            
            var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
            log.debug('bhApprover', bhApprover);
            
            var finApprover = null;
            if (['vendbill', 'purchreq', 'purchord', 'exprept'].includes(type)) {
                finApprover = getFinanceMatric(data.sofId, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
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