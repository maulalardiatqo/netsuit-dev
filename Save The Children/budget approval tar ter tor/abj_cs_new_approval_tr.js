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
function getTarAmount(id) {
        let alocatAmount = 0;
        let idArray = [];

        if (id) {
            if (Array.isArray(id)) idArray = id;
            else if (typeof id === 'string') idArray = id.split(',');
            else idArray = [id];
        }

        if (idArray.length === 0) return 0;

        const tarSearch = search.create({
            type: "customrecord_tar",
            filters: [["internalid", "anyof", idArray]],
            columns: [
                search.createColumn({
                    name: "custrecord_tare_amount",
                    join: "CUSTRECORD_TAR_E_ID"
                })
            ]
        });

        tarSearch.run().each(function(result) {
            let amt = result.getValue({
                name: "custrecord_tare_amount",
                join: "CUSTRECORD_TAR_E_ID"
            }) || 0;
            alocatAmount += Number(amt);
            return true;
        });
        log.debug('alocatAmount', alocatAmount)
        return alocatAmount;
    }
function getBudgetHolderApproval(paramSof, paramAccount, paramAmount, createdBy, costCenter, projectCode, groupLevel) {
    log.debug('params BH', { paramSof, paramAccount, paramAmount, costCenter, projectCode, groupLevel });

    function runSearch(useAccount) {
        let filters = [
            ["custrecord_stc_sof", "is", paramSof], "AND",
            ["custrecord_stc_max_limit_amnt", "greaterthanorequalto", paramAmount], "AND",
            ["isinactive", "is", "F"]
        ];

        // Filter dinamis berdasarkan Group Level
        if (groupLevel >= 2 && costCenter) {
            filters.push("AND", ["custrecord_stc_bh_cost_center", "anyof", costCenter]);
        }
        if (groupLevel === 3 && projectCode) {
            filters.push("AND", ["custrecord_stc_bh_project_code", "anyof", projectCode]);
        }
        if (useAccount && paramAccount) {
            filters.push("AND", ["custrecord_stc_account", "is", paramAccount]);
        }

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
        
        // Loop 1: Cek kecocokan spesifik sesuai level
        for (let res of results) {
            let mtrxCC = res.getValue("custrecord_stc_bh_cost_center");
            let mtrxPC = res.getValue("custrecord_stc_bh_project_code");
            let approverId = res.getValue("custrecord_stc_bdgt_hldr_approval");

            if (groupLevel === 1) {
                if (!mtrxCC && !mtrxPC && approverId != createdBy) return approverId;
            } else if (groupLevel === 2) {
                if (mtrxCC == costCenter && !mtrxPC && approverId != createdBy) return approverId;
            } else if (groupLevel === 3) {
                if (mtrxCC == costCenter && mtrxPC == projectCode && approverId != createdBy) return approverId;
            }
        }

        // Loop 2: Fallback ke Global (tanpa CC & PC) jika tidak ketemu di level spesifik
        for (let res of results) {
            if (!res.getValue("custrecord_stc_bh_cost_center") && !res.getValue("custrecord_stc_bh_project_code")) {
                let apprvId = res.getValue("custrecord_stc_bdgt_hldr_approval");
                if (apprvId != createdBy) return apprvId;
            }
        }
        return null;
    }

    return runSearch(true) || runSearch(false);
}

function getFinanceMatric(sofId, amount, createdBy) {
    log.debug('params FA (Global)', { sofId, amount, createdBy });
    
    let filters = [
        ["custrecord_stc_sof_mtrx_finance", "anyof", sofId], "AND",
        ["custrecord_finance_max_amnt", "greaterthanorequalto", amount], "AND",
        ["isinactive", "is", "F"]
    ];

    let searchObj = search.create({
        type: "customrecord_stc_apprvl_mtrix_finance",
        filters: filters,
        columns: [
            { name: "custrecord_finance_max_amnt", sort: search.Sort.ASC },
            "custrecord_stc_apprvl_finance"
        ]
    });

    let results = searchObj.run().getRange({ start: 0, end: 100 });
    
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            let apprvFinance = results[i].getValue("custrecord_stc_apprvl_finance");
            if (apprvFinance != createdBy) {
                return apprvFinance;
            }
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
    const financeMap = {}; // Map khusus untuk akumulasi total per SOF

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
            let statusFa = subConf.faSts ? rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.faSts, line: i }) : '2';

            let groupLevel = 1;
            let sofLookup = search.lookupFields({
                type: 'customrecord_cseg_stc_sof',
                id: sofId,
                columns: ['custrecord_stc_sof_kreasi']
            });

            if (sofLookup.custrecord_stc_sof_kreasi === true || sofLookup.custrecord_stc_sof_kreasi === 'T') {
                groupLevel = 2;
                if (cc) {
                    let deptLookup = search.lookupFields({
                        type: 'department',
                        id: cc,
                        columns: ['custrecord_stc_kreasi']
                    });
                    if (deptLookup.custrecord_stc_kreasi === true || deptLookup.custrecord_stc_kreasi === 'T') {
                        groupLevel = 3;
                    }
                }
            }

            let groupKey = (groupLevel === 1) ? sofId : (groupLevel === 2 ? `${sofId}_${cc}` : `${sofId}_${cc}_${pc}`);
            
            if (!groupMap[groupKey]) {
                groupMap[groupKey] = { 
                    sofId: sofId, total: 0, account: null, cc: (groupLevel >= 2) ? cc : null, 
                    pc: (groupLevel === 3) ? pc : null, groupLevel: groupLevel, lines: [] 
                };
            }
            groupMap[groupKey].total += amount;
            groupMap[groupKey].lines.push({ 
                sublistId: subConf.id, line: i, conf: subConf, 
                currentStatus: status, currentStatusFa: statusFa 
            });

            if (!financeMap[sofId]) financeMap[sofId] = 0;
            financeMap[sofId] += amount;

            if (!groupMap[groupKey].account) {
                if (subType === 'item') {
                    let itemId = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.item, line: i });
                    const sUrl = url.resolveScript({ 
                        scriptId: "customscript_abj_sl_get_item", deploymentId: "customdeploy_abj_sl_get_item", 
                        params: { custscript_item_id: itemId } 
                    });
                    groupMap[groupKey].account = https.get({ url: sUrl }).body || '';
                } else {
                    groupMap[groupKey].account = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.acc, line: i });
                }
            }
        }
    });

    Object.keys(groupMap).forEach(key => {
        const data = groupMap[key];
        
        const bhApprover = getBudgetHolderApproval(data.sofId, data.account, data.total, createdBy, data.cc, data.pc, data.groupLevel);
        
        const totalFinanceAmount = financeMap[data.sofId];
        log.debug('paramsFA', {SOFID : data.sofId, totalFinanceAmount : totalFinanceAmount, createdBy : createdBy})
        const finApprover = getFinanceMatric(data.sofId, totalFinanceAmount, createdBy);

        log.debug('Approvers Logic', {
            groupKey: key,
            amountBH: data.total,
            amountFin: totalFinanceAmount,
            finApprover: finApprover
        });

        data.lines.forEach(item => {
            let isApprovedBH = (item.currentStatus == "2" || item.currentStatus == 2);
            let isApprovedFA = (item.currentStatusFa == "2" || item.currentStatusFa == 2);

            if (!isApprovedBH || !isApprovedFA) {
                rec.selectLine({ sublistId: item.sublistId, line: item.line });
                
                if (!isApprovedBH) {
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.apprv, value: bhApprover || '' });
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.sts, value: '1' });
                }

                if (!isApprovedFA && item.conf.faApprv && finApprover) {
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faApprv, value: finApprover });
                    rec.setCurrentSublistValue({ sublistId: item.sublistId, fieldId: item.conf.faSts, value: '1' });
                }
                rec.commitLine({ sublistId: item.sublistId });
            }
        });
    });

    if (typeRec == 'customrecord_tar') {
        const torId = rec.getValue('custrecord_tar_link_to_tor');
        const currentTarId = rec.id; 

        if (torId) {
            let totalAmountTOR = 0;
            let totalAmountOtherTars = 0;

            const torSearch = search.create({
                type: "customrecord_tor",
                filters: [
                    ["custrecord_tori_id.custrecord_tor_transaction_type", "anyof", "4"],
                    "AND",
                    ["internalid", "anyof", torId]
                ],
                columns: [
                    { name: "custrecord_tori_amount", join: "CUSTRECORD_TORI_ID" },
                    { name: "custrecord_tor_link_tar", join: "CUSTRECORD_TORI_ID" }
                ]
            });

            torSearch.run().each(function(result) {
                let amtTor = result.getValue({ name: "custrecord_tori_amount", join: "CUSTRECORD_TORI_ID" }) || 0;
                totalAmountTOR += Number(amtTor);

                let cekTar = result.getValue({ name: "custrecord_tor_link_tar", join: "CUSTRECORD_TORI_ID" });
                if (cekTar) {
                    let tarIds = [];
                    if (Array.isArray(cekTar)) tarIds = cekTar;
                    else if (typeof cekTar === 'string') tarIds = cekTar.split(',');
                    else tarIds = [cekTar];

                    let otherTarIds = tarIds.filter(id => id != currentTarId);

                    if (otherTarIds.length > 0) {
                        totalAmountOtherTars += getTarAmount(otherTarIds);
                    }
                }
                return true;
            });

            let remainingQuota = Number(totalAmountTOR) - Number(totalAmountOtherTars);
            let currentTarInputAmount = 0;
            let sublistId = 'recmachcustrecord_tar_e_id';
            let lineCount = rec.getLineCount({ sublistId: sublistId });

            for (let i = 0; i < lineCount; i++) {
                let lineAmt = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tare_amount',
                    line: i
                }) || 0;
                currentTarInputAmount += Number(lineAmt);
            }

            if (totalAmountTOR === 0 || remainingQuota < 0) {
                alert('Total amount TAR in TOR Record is 0 or already fully allocated.');
                return false;
            }

            if (currentTarInputAmount > remainingQuota) {
                alert('Total Amount in this TAR (' + currentTarInputAmount + ') exceeds remaining quota in TOR (' + remainingQuota + ')');
                return false;
            }
        }
    }

    return true;
}

    return { pageInit: (ctx) => {}, saveRecord: saveRecord };
});