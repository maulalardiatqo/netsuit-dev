/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * logic untuk expense di pindah ke abj_cs_tax_expense_report.js
 * logic untuk po di pindah ke abj_cs_validate_amount.js
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime', 'N/format', 'N/ui/dialog'],
    (search, log, https, url, runtime, format, dialog) => {

    // =====================================================================
    // ENTRY POINT
    // =====================================================================
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
        try {
            const rec = scriptContext.currentRecord;
            const recType = rec.type;
            const createdBy = rec.getValue('custbody_stc_create_by') || runtime.getCurrentUser().id;
            const isNewRecord = !rec.id;
            const datecreated = isNewRecord ? new Date() : (rec.getValue('createddate') || new Date());

            let poType = null;
            if (recType === 'purchaseorder') {
                poType = rec.getValue('custbody_stc_po_type');
            }

            // PERBAIKAN DI SINI: Deteksi sublist tanpa menggunakan getSublists()
            const sublists = [];
            ['item', 'expense'].forEach(sublistId => {
                try {
                    const count = rec.getLineCount({ sublistId: sublistId });
                    if (count >= 0) {
                        sublists.push(sublistId);
                    }
                } catch (e) {
                    // Abaikan jika sublist tidak ada di tipe record ini
                }
            });

            // ---------------------------------------------------------------
            // PASS 1: baca semua line sekali jalan, kumpulkan id unik
            // ---------------------------------------------------------------
            const lineData = [];
            const sofIdSet = new Set();
            const deptIdSet = new Set();
            const itemIds = [];

            sublists.forEach(sublistId => {
                const lineCount = rec.getLineCount({ sublistId });
                for (let i = 0; i < lineCount; i++) {
                    const sofId = rec.getSublistValue({ sublistId, fieldId: 'cseg_stc_sof', line: i });
                    if (!sofId) continue;

                    const costCenter = rec.getSublistValue({ sublistId, fieldId: 'department', line: i }) || '';
                    const projectCode = rec.getSublistValue({ sublistId, fieldId: 'class', line: i }) || '';

                    let amountField;
                    if (sublistId === 'item') {
                        amountField = (recType === 'purchaserequisition' || recType === 'purchasereq') ? 'estimatedamount' : 'grossamt';
                    } else {
                        amountField = (recType === 'expensereport' || recType === 'exprept') ? 'amount' : 'grossamt';
                        if (recType === 'purchaserequisition' || recType === 'purchasereq') amountField = 'estimatedamount';
                    }

                    const amount = parseFloat(rec.getSublistValue({ sublistId, fieldId: amountField, line: i })) || 0;
                    if (amount < 0) continue; 

                    let itemId = null;
                    if (sublistId === 'item') {
                        itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        if (itemId && itemIds.indexOf(itemId) === -1) itemIds.push(itemId);
                    }

                    sofIdSet.add(sofId);
                    if (costCenter) deptIdSet.add(costCenter);

                    lineData.push({ sublistId, line: i, sofId, costCenter, projectCode, amount, itemId });
                }
            });

            if (lineData.length === 0) return true; 

            const uniqueSofIds = Array.from(sofIdSet);
            const uniqueDeptIds = Array.from(deptIdSet);

            // ---------------------------------------------------------------
            // PASS 2: bulk reference lookup (masing-masing HANYA 1 call)
            // ---------------------------------------------------------------
            const itemAccountsMap = fetchItemAccountsBulk(itemIds);
            const sofCache = fetchSofBulk(uniqueSofIds);
            const deptCache = fetchDeptBulk(uniqueDeptIds);

            // ---------------------------------------------------------------
            // PASS 3: bentuk groupMap & financeMap (tanpa search tambahan)
            // ---------------------------------------------------------------
            const groupMap = {};
            const financeMap = {};

            lineData.forEach(ld => {
                const sofInfo = sofCache[ld.sofId] || { kreasi: false, finance: false };
                const isFinanceGrouping = sofInfo.finance;

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

                let account = '';
                if (ld.sublistId === 'item') {
                    account = (ld.itemId && itemAccountsMap[ld.itemId]) || '';
                } else {
                    const fieldAcc = (recType === 'expensereport' || recType === 'exprept' || recType === 'purchaserequisition') ? 'expenseaccount' : 'account';
                    account = rec.getSublistValue({ sublistId: ld.sublistId, fieldId: fieldAcc, line: ld.line }) || '';
                }

                if (!groupMap[groupKey]) {
                    groupMap[groupKey] = {
                        sofId: ld.sofId, total: 0, account: account || null,
                        costCenter: ld.costCenter, projectCode: ld.projectCode,
                        groupLevel, isFinanceGrouping, lines: []
                    };
                }
                const g = groupMap[groupKey];
                g.total += ld.amount;
                if (!g.account && account) g.account = account;
                g.lines.push(ld.line);

                const finKey = isFinanceGrouping ? `${ld.sofId}_${ld.projectCode}` : ld.sofId;
                financeMap[finKey] = (financeMap[finKey] || 0) + ld.amount;
            });

            // ---------------------------------------------------------------
            // PASS 4: bulk search matrix (masing-masing HANYA 1 call)
            // ---------------------------------------------------------------
            const bhMatrixRows = fetchBudgetHolderMatrixBulk(uniqueSofIds);

            const validFinanceTypes = ['vendorbill', 'purchaserequisition', 'purchaseorder', 'expensereport', 'vendbill', 'purchreq', 'purchord', 'exprept'];
            const isFinanceTipe = validFinanceTypes.indexOf(recType) !== -1;
            const finMatrixRows = isFinanceTipe ? fetchFinanceMatrixBulk(uniqueSofIds) : [];

            // ---------------------------------------------------------------
            // PASS 5: resolve approver mentah per group (in-memory, no search)
            // ---------------------------------------------------------------
            const groupResults = {};
            for (const key in groupMap) {
                const g = groupMap[key];
                const bh = resolveBudgetHolder(bhMatrixRows, g, createdBy);

                let fin = null;
                if (isFinanceTipe) {
                    const finKey = g.isFinanceGrouping ? `${g.sofId}_${g.projectCode}` : g.sofId;
                    const totalFinance = financeMap[finKey];
                    fin = resolveFinanceApprover(finMatrixRows, g.sofId, totalFinance, createdBy, recType, poType);
                }

                groupResults[key] = { bh, fin, lines: g.lines };
            }

            // ---------------------------------------------------------------
            // PASS 6: bulk cek substitute/delegasi untuk semua kandidat
            // ---------------------------------------------------------------
            const candidateIds = new Set();
            Object.keys(groupResults).forEach(key => {
                const r = groupResults[key];
                if (r.bh) candidateIds.add(r.bh);
                if (r.fin) candidateIds.add(r.fin);
            });
            const subCache = fetchSubstitutesBulk(Array.from(candidateIds));

            const missingLines = new Set();
            for (const key in groupResults) {
                let { bh, fin, lines } = groupResults[key];

                if (bh) {
                    const sub = applySubstitute(subCache[bh], datecreated);
                    if (sub) bh = sub;
                }
                if (fin) {
                    const sub = applySubstitute(subCache[fin], datecreated);
                    if (sub) fin = sub;
                }

                if (!bh || (isFinanceTipe && !fin)) {
                    lines.forEach(l => missingLines.add(l + 1)); 
                }
            }

            if (missingLines.size > 0) {
                const sortedLines = Array.from(missingLines).sort((a, b) => a - b);
                dialog.alert({
                    title: 'Approver Tidak Ditemukan',
                    message: 'Terdapat baris yang tidak mendapatkan approver (Budget Holder dan/atau Finance): baris '
                        + sortedLines.join(', ')
                        + '. Mohon periksa kembali SOF, Cost Center, atau Project Code pada baris tersebut sebelum menyimpan.'
                });
                return false;
            }

            return true;

        } catch (e) {
            log.error({ title: 'saveRecord validation error', details: e });
            dialog.alert({
                title: 'Validasi Gagal',
                message: 'Terjadi kesalahan saat memvalidasi approver: ' + (e && e.message ? e.message : e)
            });
            return false;
        }
    }

    // =====================================================================
    // HELPER FUNCTIONS (Di luar saveRecord agar kode rapi)
    // =====================================================================

    function isTrue(v) {
        return v === true || v === 'T' || v === 'true';
    }

    function fetchItemAccountsBulk(itemIds) {
        if (!itemIds.length) return {};
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
            log.error('Bulk Suitelet Error', 'Gagal memanggil suitelet. Response: ' + response.body);
        } catch (e) {
            log.error('HTTP Request Error', e.message);
        }
        return {};
    }

    function fetchSofBulk(sofIds) {
        const cache = {};
        if (!sofIds.length) return cache;
        const s = search.create({
            type: 'customrecord_cseg_stc_sof',
            filters: [['internalid', 'anyof', sofIds]],
            columns: ['internalid', 'custrecord_stc_sof_kreasi', 'custrecord_stc_grouping_for_finance']
        });
        s.run().each(res => {
            cache[res.getValue('internalid')] = {
                kreasi: isTrue(res.getValue('custrecord_stc_sof_kreasi')),
                finance: isTrue(res.getValue('custrecord_stc_grouping_for_finance'))
            };
            return true;
        });
        return cache;
    }

    function fetchDeptBulk(deptIds) {
        const cache = {};
        if (!deptIds.length) return cache;
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
        if (!sofIds.length) return rows;
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
        if (!sofIds.length) return rows;
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

    function fetchSubstitutesBulk(empIds) {
        const cache = {};
        if (!empIds.length) return cache;
        const s = search.create({
            type: 'employee',
            filters: [['internalid', 'anyof', empIds]],
            columns: [
                'internalid',
                'custentity_stc_subtitute_apprvl',
                'custentity_stc_delgtion_date_from',
                'custentity_stc_delegation_date_to'
            ]
        });
        s.run().each(res => {
            const subRaw = res.getValue('custentity_stc_subtitute_apprvl');
            cache[res.getValue('internalid')] = {
                substitute: subRaw ? String(subRaw).split(',')[0] : null,
                from: res.getValue('custentity_stc_delgtion_date_from'),
                to: res.getValue('custentity_stc_delegation_date_to')
            };
            return true;
        });
        return cache;
    }

    // =====================================================================
    // IN-MEMORY RESOLVERS
    // =====================================================================

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

    function resolveFinanceApprover(rows, sofId, amount, createdBy, recordType, poType) {
        let rt = recordType;
        if (poType == 3) rt = 'non-po';
        const field = rt === 'purchaseorder' ? 'apprPo' : 'apprNonPo';

        const candidates = rows
            .filter(r => r.sof == sofId && r.maxAmt >= amount)
            .sort((a, b) => a.maxAmt - b.maxAmt);

        for (const r of candidates) {
            const approver = r[field];
            if (approver && approver != createdBy) return approver;
        }
        return null;
    }

    function applySubstitute(info, dateCreated) {
        if (!info || !info.substitute || !info.from || !info.to) return null;

        try {
            const dFromObj = format.parse({ value: info.from, type: format.Type.DATE });
            const dToObj = format.parse({ value: info.to, type: format.Type.DATE });
            const createdObj = dateCreated instanceof Date ? dateCreated : new Date(dateCreated);

            const toNum = (d) => {
                if (!d || isNaN(d.getTime())) return 0;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return parseInt(`${yyyy}${mm}${dd}`, 10);
            };

            let tglCreated = toNum(createdObj);
            let tglFrom = toNum(dFromObj);
            const tglTo = toNum(dToObj);

            if (tglCreated < tglFrom && (tglFrom - tglCreated === 1)) {
                tglFrom = tglCreated;
            }

            if (tglCreated >= tglFrom && tglCreated <= tglTo) {
                return info.substitute;
            }
        } catch (e) {
            log.debug('applySubstitute parse error', e.message);
        }
        return null;
    }


    return { saveRecord };
});