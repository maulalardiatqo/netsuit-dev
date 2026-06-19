/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime', 'N/record', 'N/format'], (search, log, https, url, runtime, record, format) => {

    const beforeSubmit = (scriptContext) => {
        const { newRecord, oldRecord, type, UserEventType } = scriptContext;
        
        if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;

        const createdBy = newRecord.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
        
        var recId = newRecord.id
      
        const recType = newRecord.type;
        const datecreated = newRecord.getValue('createddate');
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
                log.debug('amountField', amountField)
                const amount = parseFloat(newRecord.getSublistValue({ sublistId, fieldId: amountField, line: i })) || 0;
                if (amount < 0) {
                    log.debug('Skip Grouping', 'Line ' + i + ' skipped because amount is negative: ' + amount);
                    continue; 
                }
                log.debug('amount', amount)
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
            log.debug('cek param sebelum function',{
                sofId : data.sofId,
                account : data.account,
                total : data.total,
                createdBy : createdBy,
                costCenter : data.costCenter,
                projectCode : data.projectCode,
                groupLevel : data.groupLevel
            })
            var bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.costCenter, data.projectCode, data.groupLevel);
            log.debug('bhApprover', bhApprover)
            if(bhApprover){
                var cekBhSubtitue = getSubtitue(bhApprover, datecreated, format, type, UserEventType );
                log.debug('cekBhSubtitue', cekBhSubtitue)
                if(cekBhSubtitue) bhApprover = cekBhSubtitue;
            }
            
            const finMapKey = data.isFinanceGrouping ? `${data.sofId}_${data.projectCode}` : data.sofId;
            const totalFinanceForSof = financeMap[finMapKey];
            let finApprover = null;
            const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
            
            if (validFinanceTypes.includes(recType)) {
                finApprover = getFinanceMatric(data.sofId, totalFinanceForSof, createdBy, recType, poType, data.projectCode);
                if(finApprover){
                    var cekFinSubtitue = getSubtitue(finApprover, datecreated, format, type, UserEventType );
                    log.debug('cekFinSubtitue', cekFinSubtitue)
                    if(cekFinSubtitue) finApprover = cekFinSubtitue;
                }
            }

            data.lines.forEach(item => {
                // if (item.isChanged) {
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
                // }
            });
        }
    };
    // function getSubtitue(empId, datecreated){
    //     log.debug('empId', empId);
    //     var appSubtitue
    //     var empLook = search.lookupFields({
    //         type: "employee",
    //         id: empId,
    //         columns: ["custentity_stc_subtitute_apprvl", "custentity_stc_delgtion_date_from", "custentity_stc_delegation_date_to"],
    //     });

    //     var firstCek = empLook.custentity_stc_subtitute_apprvl;
    //     var delegateFromStr = empLook.custentity_stc_delgtion_date_from; 
    //     var delegateToStr = empLook.custentity_stc_delegation_date_to;   

    //     if (firstCek && firstCek.length > 0 && delegateFromStr && delegateToStr) {
            
    //         log.debug('delegateFromStr',delegateFromStr)
    //         log.debug('delegateToStr', delegateToStr)
    //         var convertToDDMMYYYY = function(dateInput) {
    //             var d = new Date(dateInput);
    //             var day = String(d.getDate()).padStart(2, '0');
    //             var month = String(d.getMonth() + 1).padStart(2, '0'); 
    //             var year = d.getFullYear();
    //             return day + '/' + month + '/' + year;
    //         };

    //         var datecreatedStr = convertToDDMMYYYY(datecreated);
    //         log.debug('datecreated (formatted)', datecreatedStr);
    //         log.debug('datecreated', datecreated)
    //         var parseDate = function(str) {
    //             var parts = str.split('/');
    //             return new Date(parts[2], parts[1] - 1, parts[0]);
    //         };

    //         var dFrom = parseDate(delegateFromStr);
    //         var dTo = parseDate(delegateToStr);
    //         var createdDate = parseDate(datecreatedStr)
    //         log.debug('perbandingan date', {createdDate : createdDate, dFrom : dFrom, dTo : dTo})
    //         if (createdDate >= dFrom && createdDate <= dTo) {
    //             appSubtitue = firstCek[0].value;
    //             log.debug('Status', 'Masuk Range Delegasi. Substitute Assigned.');
    //         } else {
    //             log.debug('Status', 'Di luar periode delegasi. Substitute Ignored.');
    //         }

    //     }
    //     log.debug('appSubtitue', appSubtitue)
    //     return appSubtitue
    // }
    function getSubtitue(empId, dateCreated, format, type, UserEventType){

        log.debug('empId', empId);
        var appSubtitue;
        
        var empLook = search.lookupFields({
            type: "employee",
            id: empId,
            columns: ["custentity_stc_subtitute_apprvl", "custentity_stc_delgtion_date_from", "custentity_stc_delegation_date_to"],
        });

        var firstCek = empLook.custentity_stc_subtitute_apprvl;
        var delegateFromStr = empLook.custentity_stc_delgtion_date_from; 
        var delegateToStr = empLook.custentity_stc_delegation_date_to;   

        if (firstCek && firstCek.length > 0 && delegateFromStr && delegateToStr) {
            log.debug('masuk date empsubtitue');
            var createdDate; 

            var dFromObj = format.parse({ value: delegateFromStr, type: format.Type.DATE });
            var dToObj = format.parse({ value: delegateToStr, type: format.Type.DATE });

            if (type === UserEventType.CREATE || type === UserEventType.COPY) {
                var todayStr = format.format({ value: new Date(), type: format.Type.DATE });
                createdDate = format.parse({ value: todayStr, type: format.Type.DATE });
            } else {
                createdDate = dateCreated
            }

            var dapatkanAngkaTanggal = function(dateObj) {
                if (!dateObj) return 0;
                var yyyy = dateObj.getFullYear();
                var mm = String(dateObj.getMonth() + 1).padStart(2, '0'); 
                var dd = String(dateObj.getDate()).padStart(2, '0');
                return parseInt(yyyy + mm + dd, 10); 
            };
            log.debug('createdDate', createdDate)
            var tglCreated = dapatkanAngkaTanggal(createdDate);
            var tglFrom = dapatkanAngkaTanggal(dFromObj);
            var tglTo = dapatkanAngkaTanggal(dToObj);

            if (tglCreated < tglFrom && (tglFrom - tglCreated === 1)) {
                log.debug('Sistem info', 'Timezone server bergeser 1 hari. Menyelaraskan...');
                tglFrom = tglCreated; 
            }

            log.debug('Pengecekan Angka Tanggal Murni', {
                tglCreated: tglCreated, 
                tglFrom: tglFrom, 
                tglTo: tglTo
            });
            
            if (tglCreated >= tglFrom && tglCreated <= tglTo) {
                appSubtitue = firstCek[0].value;
                log.debug('Status', 'Masuk Range Delegasi. Substitute Assigned.');
            } else {
                log.debug('Status', 'Di luar periode delegasi. Substitute Ignored.');
            }
        }
        log.debug('appSubtitue', appSubtitue);
        return appSubtitue;
    }
    const getBudgetHolderApproval = (paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode, groupLevel) => {
        log.debug('paramBHapprover', {
            paramSof : paramSof,
            paramAccount : paramAccount,
            paramAmount : paramAmount,
            createdBy : createdBy,
            costCenter : costCenter,
            projectCode : projectCode,
            groupLevel : groupLevel
        })
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
        log.debug('approvalField', approvalField)
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