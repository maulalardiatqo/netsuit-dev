/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Validasi Matrix Approver khusus untuk TAR, TER, dan TOR.
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime', 'N/format', 'N/ui/dialog'],
    (search, log, https, url, runtime, format, dialog) => {

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

    function saveRecord(scriptContext) {
        try {
            var currentUser = runtime.getCurrentUser();
            var userRole = currentUser.role;

            if (Number(userRole) === 15) {
                return true;
            }
            return validateApprover(scriptContext);
        } catch (e) {
            log.error({ title: 'saveRecord validation error', details: e });
            dialog.alert({
                title: 'Validasi Gagal',
                message: 'Terjadi kesalahan saat memvalidasi approver: ' + (e && e.message ? e.message : e)
            });
            return false;
        }
    }

    function validateApprover(scriptContext) {
        const rec = scriptContext.currentRecord;
        const recType = rec.type;
        const config = recordConfig[recType];
        
        if (!config) return true;

        const createdBy = rec.getValue(config.createdField) || runtime.getCurrentUser().id;

        // ---------------------------------------------------------------
        // PASS 1: Kumpulkan data line dinamis berdasarkan config
        // ---------------------------------------------------------------
        const lineData = [];
        const sofIdSet = new Set();
        const deptIdSet = new Set();
        const itemIds = [];

        Object.keys(config.sublists).forEach(subType => {
            const subConf = config.sublists[subType];
            
            // Cek ketersediaan sublist di UI
            let lineCount = 0;
            try {
                lineCount = rec.getLineCount({ sublistId: subConf.id });
            } catch (e) {
                return; 
            }

            for (let i = 0; i < lineCount; i++) {
                const sofId = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.sof, line: i });
                if (!sofId) continue;

                const cc = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.cc, line: i }) || '';
                const pc = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.pc, line: i }) || '';
                const amount = parseFloat(rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.amt, line: i })) || 0;
                
                if (amount <= 0) continue; 

                let itemId = null;
                let staticAccount = '';

                // Ambil Item jika dikonfigurasi, atau Account jika dikonfigurasi
                if (subConf.item) {
                    itemId = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.item, line: i });
                    if (itemId && itemIds.indexOf(itemId) === -1) itemIds.push(itemId);
                } else if (subConf.acc) {
                    staticAccount = rec.getSublistValue({ sublistId: subConf.id, fieldId: subConf.acc, line: i }) || '';
                }

                sofIdSet.add(sofId);
                if (cc) deptIdSet.add(cc);

                lineData.push({ 
                    sublistId: subConf.id, 
                    subConf: subConf, 
                    line: i, 
                    sofId: sofId, 
                    costCenter: cc, 
                    projectCode: pc, 
                    amount: amount, 
                    itemId: itemId,
                    account: staticAccount 
                });
            }
        });

        if (lineData.length === 0) return true; 

        const uniqueSofIds = Array.from(sofIdSet);
        const uniqueDeptIds = Array.from(deptIdSet);

        // ---------------------------------------------------------------
        // PASS 2: Bulk reference lookup
        // ---------------------------------------------------------------
        const itemAccountsMap = fetchItemAccountsBulk(itemIds);
        const sofCache = fetchSofBulk(uniqueSofIds);
        const deptCache = fetchDeptBulk(uniqueDeptIds);

        // ---------------------------------------------------------------
        // PASS 3: Bentuk groupMap (BH) & financeMap (FA)
        // ---------------------------------------------------------------
        const groupMap = {};
        const financeMap = {};

        lineData.forEach(ld => {
            const sofInfo = sofCache[ld.sofId] || { kreasi: false };

            let groupLevel = 1;
            if (sofInfo.kreasi) {
                groupLevel = 2;
                if (ld.costCenter) {
                    const deptInfo = deptCache[ld.costCenter];
                    if (deptInfo && deptInfo.kreasi) groupLevel = 3;
                }
            }

            const groupKey = groupLevel === 1
                ? ld.sofId
                : (groupLevel === 2 ? `${ld.sofId}_${ld.costCenter}` : `${ld.sofId}_${ld.costCenter}_${ld.projectCode}`);

            let lineAccount = ld.account;
            if (ld.itemId) {
                lineAccount = itemAccountsMap[ld.itemId] || '';
            }

            if (!groupMap[groupKey]) {
                groupMap[groupKey] = {
                    sofId: ld.sofId, total: 0, account: lineAccount || null,
                    costCenter: ld.costCenter, projectCode: ld.projectCode,
                    groupLevel, lines: []
                };
            }
            
            const g = groupMap[groupKey];
            g.total += ld.amount;
            if (!g.account && lineAccount) g.account = lineAccount;
            g.lines.push(ld); // Simpan referensi lengkap ke baris data

            // Grouping Finance: Murni berdasarkan SOF ID
            if (!financeMap[ld.sofId]) financeMap[ld.sofId] = 0;
            financeMap[ld.sofId] += ld.amount;
        });

        // ---------------------------------------------------------------
        // PASS 4: Bulk Search Matrix
        // ---------------------------------------------------------------
        const bhMatrixRows = fetchBudgetHolderMatrixBulk(uniqueSofIds);
        const finMatrixRows = fetchFinanceMatrixBulk(uniqueSofIds);

        // ---------------------------------------------------------------
        // PASS 5: Resolve Approver per Group (Termasuk Finance)
        // ---------------------------------------------------------------
        const missingLines = new Set();
        
        for (const key in groupMap) {
            const g = groupMap[key];
            
            // Resolve Budget Holder
            let bhApprover = resolveBudgetHolder(bhMatrixRows, g, createdBy);

            // Resolve Finance (Jika ada)
            const totalFinance = financeMap[g.sofId]; 
            let finApprover = resolveFinanceApprover(finMatrixRows, g.sofId, totalFinance, createdBy);

            // Validasi apakah setiap baris di grup ini mendapatkan approver
            g.lines.forEach(ld => {
                // Semua baris WAJIB memiliki Budget Holder
                if (!bhApprover) {
                    missingLines.add(ld.line + 1);
                }
                
                // Jika konfigurasi baris tersebut memiliki field faApprv, berarti WAJIB memiliki Finance Approver
                if (ld.subConf.faApprv && !finApprover) {
                    missingLines.add(ld.line + 1);
                }
            });
        }

        // ---------------------------------------------------------------
        // PASS 6: Hasil Validasi
        // ---------------------------------------------------------------
        if (missingLines.size > 0) {
            const sortedLines = Array.from(missingLines).sort((a, b) => a - b);
            dialog.alert({
                title: 'Approver Tidak Ditemukan',
                message: 'Terdapat baris yang tidak mendapatkan approver (Budget Holder dan/atau Finance): baris ke-'
                    + sortedLines.join(', ')
                    + '. Mohon periksa kembali SOF, Cost Center, atau Project Code pada baris tersebut sebelum menyimpan.'
            });
            return false;
        }

        return true;
    }

    // =====================================================================
    // HELPER FUNCTIONS 
    // =====================================================================

    function isTrue(v) {
        return v === true || v === 'T' || v === 'true';
    }

    function fetchItemAccountsBulk(itemIds) {
        if (!itemIds || !itemIds.length) return {};
        try {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_get_item_in_bulk',
                deploymentId: 'customdeploy_abj_sl_get_item_in_bulk',
                params: { custscript_item_ids: JSON.stringify(itemIds) },
                returnExternalUrl: true
            });
            const response = https.get({ url: suiteletUrl });
            if (response.code === 200 && response.body && response.body.indexOf('<!DOCTYPE html>') === -1) {
                return JSON.parse(response.body);
            }
        } catch (e) {
            log.error('Bulk Fetch Item Acc Error', e.message);
        }
        return {};
    }

    function fetchSofBulk(sofIds) {
        const cache = {};
        if (!sofIds || !sofIds.length) return cache;
        const s = search.create({
            type: 'customrecord_cseg_stc_sof',
            filters: [['internalid', 'anyof', sofIds]],
            columns: ['internalid', 'custrecord_stc_sof_kreasi']
        });
        s.run().each(res => {
            cache[res.getValue('internalid')] = {
                kreasi: isTrue(res.getValue('custrecord_stc_sof_kreasi'))
            };
            return true;
        });
        return cache;
    }

    function fetchDeptBulk(deptIds) {
        const cache = {};
        if (!deptIds || !deptIds.length) return cache;
        const s = search.create({
            type: 'department',
            filters: [['internalid', 'anyof', deptIds]],
            columns: ['internalid', 'custrecord_stc_kreasi']
        });
        s.run().each(res => {
            cache[res.getValue('internalid')] = {
                kreasi: isTrue(res.getValue('custrecord_stc_kreasi'))
            };
            return true;
        });
        return cache;
    }

    function fetchBudgetHolderMatrixBulk(sofIds) {
        const rows = [];
        if (!sofIds || !sofIds.length) return rows;
        const s = search.create({
            type: 'customrecord_stc_apprv_matrix_bdgt_holdr',
            filters: [
                ['custrecord_stc_sof', 'anyof', sofIds], 'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'custrecord_stc_sof',
                { name: 'custrecord_stc_max_limit_amnt', sort: search.Sort.ASC },
                'custrecord_stc_bdgt_hldr_approval',
                'custrecord_stc_bh_cost_center',
                'custrecord_stc_bh_project_code',
                'custrecord_stc_account'
            ]
        });
        s.run().each(res => {
            rows.push({
                sof: res.getValue('custrecord_stc_sof'),
                maxAmt: parseFloat(res.getValue('custrecord_stc_max_limit_amnt')) || 0,
                approver: res.getValue('custrecord_stc_bdgt_hldr_approval'),
                costCenter: res.getValue('custrecord_stc_bh_cost_center'),
                projectCode: res.getValue('custrecord_stc_bh_project_code'),
                account: res.getValue('custrecord_stc_account')
            });
            return true;
        });
        return rows;
    }

    function fetchFinanceMatrixBulk(sofIds) {
        const rows = [];
        if (!sofIds || !sofIds.length) return rows;
        const s = search.create({
            type: 'customrecord_stc_apprvl_mtrix_finance',
            filters: [
                ['custrecord_stc_sof_mtrx_finance', 'anyof', sofIds], 'AND',
                ['isinactive', 'is', 'F']
            ],
            columns: [
                'custrecord_stc_sof_mtrx_finance',
                { name: 'custrecord_finance_max_amnt', sort: search.Sort.ASC },
                'custrecord_stc_apprvl_finance',
                'custrecord_stc_apprvl_finance_non_po'
            ]
        });
        s.run().each(res => {
            rows.push({
                sof: res.getValue('custrecord_stc_sof_mtrx_finance'),
                maxAmt: parseFloat(res.getValue('custrecord_finance_max_amnt')) || 0,
                apprPo: res.getValue('custrecord_stc_apprvl_finance'),
                apprNonPo: res.getValue('custrecord_stc_apprvl_finance_non_po')
            });
            return true;
        });
        return rows;
    }

    function resolveBudgetHolder(rows, g, createdBy) {
        const candidates = rows.filter(r => r.sof == g.sofId && r.maxAmt >= g.total);

        const tryMatch = (useAccount) => {
            const filtered = candidates
                .filter(r => useAccount ? (g.account && r.account == g.account) : !r.account)
                .sort((a, b) => a.maxAmt - b.maxAmt);

            for (const r of filtered) {
                if (g.groupLevel === 1 && !r.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
                if (g.groupLevel === 2 && r.costCenter == g.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
                if (g.groupLevel === 3 && r.costCenter == g.costCenter && r.projectCode == g.projectCode && r.approver != createdBy) return r.approver;
            }
            for (const r of filtered) {
                if (!r.costCenter && !r.projectCode && r.approver != createdBy) return r.approver;
            }
            return null;
        };

        if (g.account) {
            return tryMatch(true) || tryMatch(false);
        }
        return tryMatch(false);
    }

    function resolveFinanceApprover(rows, sofId, amount, createdBy) {
        const field = 'apprNonPo'; 

        const candidates = rows
            .filter(r => r.sof == sofId && r.maxAmt >= amount)
            .sort((a, b) => a.maxAmt - b.maxAmt);

        for (const r of candidates) {
            const approver = r[field];
            if (approver && approver != createdBy) return approver;
        }
        return null;
    }

    return { 
        saveRecord: saveRecord 
    };
});