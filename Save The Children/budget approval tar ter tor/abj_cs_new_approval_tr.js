/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/search', 'N/https', 'N/url', 'N/runtime', 'N/log'], 
function(currentRecord, search, https, url, runtime, log) {

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

    function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode) {
        log.debug('params Budget', { paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode})
        function runSearch(useAccount) {
            let filters = [
                ["custrecord_stc_sof", "is", paramSof], "AND",
                ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
                ["isinactive", "is", "F"]
            ];
            if (useAccount && paramAccount) filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);

            let searchObj = search.create({
                type: "customrecord_stc_apprv_matrix_bdgt_holdr",
                filters: filters,
                columns: [
                    { name: "custrecord_stc_max_limit_amnt", sort: search.Sort.ASC },
                    "custrecord_stc_bdgt_hldr_approval",
                    "custrecord_stc_bh_cost_center",
                    "custrecord_stc_bh_project_code"
                ]
            });

            let results = searchObj.run().getRange({ start: 0, end: 100 });
            
            for (let res of results) {
                let mtrxCC = res.getValue("custrecord_stc_bh_cost_center");
                let mtrxPC = res.getValue("custrecord_stc_bh_project_code");
                let approver = res.getValue("custrecord_stc_bdgt_hldr_approval");
                if (mtrxCC == costCenter && mtrxPC == projectCode && approver != createdBy) return approver;
            }
            for (let res of results) {
                if (!res.getValue("custrecord_stc_bh_cost_center") && !res.getValue("custrecord_stc_bh_project_code")) {
                    let approver = res.getValue("custrecord_stc_bdgt_hldr_approval");
                    if (approver != createdBy) return approver;
                }
            }
            return null;
        }
        return runSearch(true) || runSearch(false);
    }

    function getFinanceMatric(sofId, amount, createdBy, costCenter, projectCode) {
        log.debug('params FA', {sofId : sofId, amount : amount, createdBy : createdBy, costCenter : costCenter, projectCode : projectCode})
        let searchObj = search.create({
            type: "customrecord_stc_apprvl_mtrix_finance",
            filters: [
                ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
                ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
                ["isinactive", "is", "F"]
            ],
            columns: ["custrecord_stc_apprvl_finance", "custrecord_stc_fa_cost_center", "custrecord_stc_fa_project_code"]
        });
        let results = searchObj.run().getRange({ start: 0, end: 100 });
        for (let res of results) {
            let mtrxCC = res.getValue("custrecord_stc_fa_cost_center");
            let mtrxPC = res.getValue("custrecord_stc_fa_project_code");
            let approver = res.getValue("custrecord_stc_apprvl_finance");
            if (mtrxCC == costCenter && mtrxPC == projectCode && approver != createdBy) return approver;
        }
        for (let res of results) {
            if (!res.getValue("custrecord_stc_fa_cost_center") && !res.getValue("custrecord_stc_fa_project_code")) {
                let approver = res.getValue("custrecord_stc_apprvl_finance");
                if (approver != createdBy) return approver;
            }
        }
        return null;
    }

    function saveRecord(context) {
        const rec = context.currentRecord;
        const typeRec = rec.type;
        const config = recordConfig[typeRec];
        if (!config) return true;

        const createdBy = rec.getValue(config.createdField);
        const groupMap = {};

        Object.keys(config.sublists).forEach(subType => {
            const subConf = config.sublists[subType];
            const lineCount = rec.getLineCount({ sublistId: subConf.id });

            for (let i = 0; i < lineCount; i++) {
                let sofId = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.sof, line: i });
                if (!sofId) continue;

                let cc = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.cc, line: i }) || '';
                let pc = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.pc, line: i }) || '';
                let amount = parseFloat(rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.amt, line: i })) || 0;
                let status = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.sts, line: i });
                
                let groupKey = `${sofId}_${cc}_${pc}`;

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = { sofId: sofId, total: 0, account: null, cc: cc, pc: pc, lines: [] };
                }

                groupMap[groupKey].total += amount;
                groupMap[groupKey].lines.push({ sublistId: subConf.id, line: i, conf: subConf, currentStatus: status });

                if (!groupMap[groupKey].account) {
                    if (subType === 'item') {
                        let itemId = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.item, line: i });
                        const sUrl = url.resolveScript({ scriptId: "customscript_abj_sl_get_item", deploymentId: "customdeploy_abj_sl_get_item", params: { custscript_item_id: itemId } });
                        groupMap[groupKey].account = https.get({ url: sUrl }).body || '';
                    } else {
                        groupMap[groupKey].account = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.acc, line: i });
                    }
                }
            }
        });

        Object.keys(groupMap).forEach(key => {
            const data = groupMap[key];
            const bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.cc, data.pc);
            log.debug('bhApprover', bhApprover)
            const finApprover = getFinanceMatric(data.sofId, data.total, createdBy, data.cc, data.pc);
            log.debug('finApprover', finApprover)

            data.lines.forEach(item => {
                if (item.currentStatus != "2" && item.currentStatus != 2) {
                    rec.selectLine({ sublistId: item.sublistId, line: item.line });
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.apprv, value: bhApprover || '' });
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.sts, value: '1' });

                    if (item.conf.faApprv && finApprover) {
                        rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faApprv, value: finApprover });
                        rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faSts, value: '1' });
                    }
                    rec.commitLine({ sublistId: item.sublistId });
                }
            });
        });

        return true;
    }

    return { pageInit: (ctx) => {}, saveRecord: saveRecord };
});