/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/url', 'N/https'], function(currentRecord, dialog, log, search, url, https) {

    function pageInit(context) {}
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

            // 2. Fungsi pembantu untuk convert string "DD/MM/YYYY" ke Date Object
            var parseDate = function(str) {
                var parts = str.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };

            var dFrom = parseDate(delegateFromStr);
            var dTo = parseDate(delegateToStr);

            // 3. Cek apakah hari ini berada di dalam range (Inclusive)
            if (today >= dFrom && today <= dTo) {
                appSubtitue = firstCek[0].value;
                log.debug('Status', 'Masuk Range Delegasi. Substitute Assigned.');
            } else {
                log.debug('Status', 'Di luar periode delegasi. Substitute Ignored.');
            }

        }
        return appSubtitue
    }
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

    function getFinanceMatric(sofId, amount, createdBy) {
    log.debug('params FA (Global)', { sofId: sofId, amount: amount, createdBy: createdBy });

    var filters = [
        ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
        ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
        ["isinactive", "is", "F"]
    ];

    var searchObj = search.create({
        type: "customrecord_stc_apprvl_mtrix_finance",
        filters: filters,
        columns: [
            search.createColumn({ name: "custrecord_finance_max_amnt", sort: search.Sort.ASC }),
            search.createColumn({ name: "custrecord_stc_apprvl_finance" })
        ]
    });

    var results = searchObj.run().getRange({ start: 0, end: 100 });
    if (results && results.length > 0) {
        for (var i = 0; i < results.length; i++) {
            var apprvFinance = results[i].getValue("custrecord_stc_apprvl_finance");
            if (apprvFinance != createdBy) return apprvFinance;
        }
    }
    return null;
}

function saveRecord(context) {
    var rec = context.currentRecord;
    var createdBy = rec.getValue('custbody_stc_create_by');
    var type = rec.getValue('type');
    var groupMap = {};
    var financeMap = {};

    var sublists = ['item', 'expense'];
    sublists.forEach(function(sublistId) {
        var lineCount = rec.getLineCount({ sublistId: sublistId });
        for (var i = 0; i < lineCount; i++) {
            var sofId = rec.getSublistValue({ sublistId: sublistId, fieldId: 'cseg_stc_sof', line: i });
            if (!sofId) continue;

            var costCenter = rec.getSublistValue({ sublistId: sublistId, fieldId: 'department', line: i }) || '';
            var projectCode = rec.getSublistValue({ sublistId: sublistId, fieldId: 'class', line: i }) || '';
            
            var groupLevel = 1;
            var sofLookup = search.lookupFields({
                type: 'customrecord_cseg_stc_sof', 
                id: sofId,
                columns: ['custrecord_stc_sof_kreasi']
            });
            var isSofKreasi = sofLookup.custrecord_stc_sof_kreasi;

            if (isSofKreasi === true || isSofKreasi === 'T') {
                groupLevel = 2;
                if (costCenter) {
                    var deptLookup = search.lookupFields({
                        type: 'department',
                        id: costCenter,
                        columns: ['custrecord_stc_kreasi']
                    });
                    var isKreasi = deptLookup.custrecord_stc_kreasi;
                    if (isKreasi === true || isKreasi === 'T') groupLevel = 3;
                }
            }

            var groupKey = (groupLevel === 1) ? sofId : (groupLevel === 2 ? sofId + '_' + costCenter : sofId + '_' + costCenter + '_' + projectCode);
            
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

            if (!financeMap[sofId]) financeMap[sofId] = 0;
            financeMap[sofId] += amount;

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

    for (var key in groupMap) {
        var data = groupMap[key];
        var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
        if(bhApprover){
            var cekSubtitue = getSubtitue(bhApprover)
            if(cekSubtitue){
                bhApprover = cekSubtitue
            }
        }
        var totalFinanceForSof = financeMap[data.sofId];
        var finApprover = null;
        if (['vendbill', 'purchreq', 'purchord', 'exprept'].includes(type)) {
            finApprover = getFinanceMatric(data.sofId, totalFinanceForSof, createdBy);
            if(finApprover){
                var cekSubFA = getSubtitue(finApprover)
                if(cekSubFA){
                    finApprover = cekSubFA
                }
            }
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