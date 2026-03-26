/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime'], (search, log, https, url, runtime) => {

    const recordConfig = {
        'customrecord_tar': {
            createdField: 'custrecord_tar_created_by',
            sublists: {
                expense: {
                    id: 'recmachcustrecord_tar_e_id',
                    sof: 'custrecord_tare_source_of_funding',
                    amt: 'custrecord_tare_amount',
                    acc: 'custrecord_tare_account',
                    apprv: 'custrecord_tare_approver',
                    sts: 'custrecord_tare_approval_status',
                    cc: 'custrecord_tare_cost_center',
                    pc: 'custrecord_tare_project_code'
                }
            }
        },
        'customrecord_ter': {
            createdField: 'custrecord_ter_created_by',
            sublists: {
                item: {
                    id: 'recmachcustrecord_terd_id',
                    item: 'custrecord_ted_item',
                    sof: 'custrecord_terd_sourcing_of_funding',
                    amt: 'custrecord_terd_amount',
                    apprv: 'custrecord_terd_approver',
                    sts: 'custrecord_terd_approval_status',
                    faApprv: 'custrecord_ter_approver_fa',
                    faSts: 'custrecord_ter_apprvl_sts_fa',
                    cc: 'custrecord_terd_cost_center',
                    pc: 'custrecord_terd_project_code'
                },
                expense: {
                    id: 'recmachcustrecord_tar_id_ter',
                    sof: 'custrecord_tare_source_of_funding',
                    amt: 'custrecord_tare_amount',
                    acc: 'custrecord_tare_account',
                    apprv: 'custrecord_tare_approver',
                    sts: 'custrecord_tare_approval_status',
                    faApprv: 'custrecord_tar_approver_fa',
                    faSts: 'custrecord_tar_apprvl_sts_fa',
                    cc: 'custrecord_tare_cost_center',
                    pc: 'custrecord_tare_project_code'
                }
            }
        },
        'customrecord_tor': {
            createdField: 'custrecord_tor_create_by',
            sublists: {
                item: {
                    id: 'recmachcustrecord_tori_id',
                    item: 'custrecord_tori_item',
                    sof: 'custrecord_tori_source_of_funding',
                    amt: 'custrecord_tori_amount',
                    apprv: 'custrecord_tori_approver',
                    sts: 'custrecord_tori_approval_status',
                    faApprv: 'custrecord_tori_approver_fa',
                    faSts: 'custrecord_tori_approval_status_fa',
                    cc: 'custrecord_tori_cost_center',
                    pc: 'custrecord_tori_project_code'
                }
            }
        }
    };

    const beforeSubmit = (scriptContext) => {
        const { newRecord, type, UserEventType } = scriptContext;
        if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;

        const recType = newRecord.type;
        const config = recordConfig[recType];
        if (!config) return;

        const createdBy = newRecord.getValue(config.createdField) || runtime.getCurrentUser().id;
        const groupMap = {};
        const financeMap = {};

        Object.keys(config.sublists).forEach(subType => {
            const subConf = config.sublists[subType];
            const lineCount = newRecord.getLineCount({ sublistId: subConf.id });

            for (let i = 0; i < lineCount; i++) {
                const sofId = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.sof, line: i });
                if (!sofId) continue;

                const cc = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.cc, line: i }) || '';
                const pc = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.pc, line: i }) || '';
                const amount = parseFloat(newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.amt, line: i })) || 0;
                const status = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.sts, line: i });
                const statusFa = subConf.faSts ? newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.faSts, line: i }) : '2';

                let groupLevel = 1;
                const sofLookup = search.lookupFields({
                    type: 'customrecord_cseg_stc_sof',
                    id: sofId,
                    columns: ['custrecord_stc_sof_kreasi']
                });

                if (sofLookup.custrecord_stc_sof_kreasi === true || sofLookup.custrecord_stc_sof_kreasi === 'T') {
                    groupLevel = 2;
                    if (cc) {
                        const deptLookup = search.lookupFields({
                            type: 'department',
                            id: cc,
                            columns: ['custrecord_stc_kreasi']
                        });
                        if (deptLookup.custrecord_stc_kreasi === true || deptLookup.custrecord_stc_kreasi === 'T') {
                            groupLevel = 3;
                        }
                    }
                }

                const groupKey = (groupLevel === 1) ? sofId : (groupLevel === 2 ? `${sofId}_${cc}` : `${sofId}_${cc}_${pc}`);

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = {
                        sofId, total: 0, account: null, cc: (groupLevel >= 2) ? cc : null,
                        pc: (groupLevel === 3) ? pc : null, groupLevel, lines: []
                    };
                }
                groupMap[groupKey].total += amount;
                groupMap[groupKey].lines.push({ sublistId: subConf.id, line: i, conf: subConf, status, statusFa });

                if (!financeMap[sofId]) financeMap[sofId] = 0;
                financeMap[sofId] += amount;

                if (!groupMap[groupKey].account) {
                    if (subType === 'item') {
                        const itemId = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.item, line: i });
                        if (itemId) {
                            const suiteletUrl = url.resolveScript({
                                scriptId: "customscript_abj_sl_get_item",
                                deploymentId: "customdeploy_abj_sl_get_item",
                                params: { custscript_item_id: itemId },
                                returnExternalUrl: true
                            });
                            const response = https.get({ url: suiteletUrl });
                            groupMap[groupKey].account = response.body || '';
                        }
                    } else {
                        groupMap[groupKey].account = newRecord.getSublistValue({ sublistId: subConf.id, fieldId: subConf.acc, line: i });
                    }
                }
            }
        });

        Object.keys(groupMap).forEach(key => {
            const data = groupMap[key];
            log.debug('params BH', {sofId : data.sofId, account : data. account, totalAmount : data.total, createdBy : createdBy, costCenter : data.cc, projectCode : data.pc, groupLevel : data.groupLevel})
            const bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.cc, data.pc, data.groupLevel);
            log.debug('bhApprover', bhApprover)
            const totalFinanceAmount = financeMap[data.sofId];
            log.debug('params FA', {sofId : data.sofId, totalFinanceAmount : totalFinanceAmount, createdBy : createdBy})
            const finApprover = getFinanceMatric(data.sofId, totalFinanceAmount, createdBy);
            log.debug('finApprover', finApprover)
            log.debug('Processing Group', { key, totalBH: data.total, totalFin: totalFinanceAmount });

            data.lines.forEach(item => {
                const isLineApproved = (item.status == "2" || item.status == 2);
                const isFaApproved = (item.statusFa == "2" || item.statusFa == 2);

                if (!isLineApproved) {
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: item.conf.apprv, line: item.line, value: bhApprover || '' });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: item.conf.sts, line: item.line, value: "1" });
                }

                if (!isFaApproved && item.conf.faApprv && finApprover) {
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faApprv, line: item.line, value: finApprover });
                    newRecord.setSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faSts, line: item.line, value: "1" });
                }
            });
        });
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
            if (useAccount && paramAccount) filters.push("AND", ["custrecord_stc_account", "anyof", paramAccount]);

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
                let apprvFinance = res.getValue("custrecord_stc_apprvl_finance");
                if (apprvFinance != createdBy) return apprvFinance;
            }
        }
        return null;
    };

    return { beforeSubmit };
});