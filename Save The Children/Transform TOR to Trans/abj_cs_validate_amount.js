/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/log', 'N/search', 'N/record', 'N/runtime'], (dialog, log, search, record, runtime) => {
    let torKeysCache = null;
    let lastTorId = null;
    const eksekusiHide = (scriptContext) => {
        try {
                var headerApprover = document.querySelector('td[data-label="Approver FA"]');
                if (headerApprover) {
                    headerApprover.style.setProperty('display', 'none', 'important');
                    
                    var columnIndex = headerApprover.cellIndex;
                    
                    var tableEl = headerApprover.closest('table');
                    if (tableEl) {
                        var rows = tableEl.querySelectorAll('tr');
                        rows.forEach(function(row) {
                            if (row.cells[columnIndex]) {
                                row.cells[columnIndex].style.setProperty('display', 'none', 'important');
                            }
                        });
                    }
                }

                var headerStatus = document.querySelector('td[data-label="Approval Status FA"]');
                if (headerStatus) {
                    headerStatus.style.setProperty('display', 'none', 'important');
                    
                    var columnIndexStatus = headerStatus.cellIndex;
                    var tableElStatus = headerStatus.closest('table');
                    if (tableElStatus) {
                        var rowsStatus = tableElStatus.querySelectorAll('tr');
                        rowsStatus.forEach(function(row) {
                            if (row.cells[columnIndexStatus]) {
                                row.cells[columnIndexStatus].style.setProperty('display', 'none', 'important');
                            }
                        });
                    }
                }

                console.log('DOM Manipulation Sukses: Kolom Approver FA & Approval Status FA Berhasil Disembunyikan.');
            } catch (e) {
                console.error('Gagal eksekusi DOM manipulation:', e.message);
            }
    }
    const checkAndHideFields = (scriptContext) => {
        var rec = scriptContext.currentRecord; 
        var transType = rec.type;
        console.log('transType Client:', transType);

        var isNeedHide = false;

        if (transType === 'customrecord_tar') {
        isNeedHide = true;
        }
        if(transType == 'expensereport'){
            var cForm = rec.getValue('customform');
            if(cForm == '139'){
                var expType = rec.getValue('custbody_stc_expense_report_type');
                console.log('expType', expType)
                if(expType == '2' || expType == '3'){
                    isNeedHide = true;
                }
            }
        }
        if (isNeedHide) {
            eksekusiHide(scriptContext)
        }
    };
    const validateLine = (scriptContext) => {
        const rec = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;
        var sblId 
        var typeTran
        var fieldSOF
        var fieldCostCenter
        var fieldProjectCode
        var fieldItem
        var fieldDea

        if (sublistId !== 'item') return true;

        const cekTor = rec.getValue('custbody_stc_link_to_tor');
        if (!cekTor) return true;

        const transType = rec.type;
        if(transType == 'purchaserequisition'){
            typeTran = '3' 
            sblId = 'item'
            fieldItem = 'item'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'purchaseorder'){
            var cekCustRec = rec.getValue('custbody_stc_po_type');
            
            if(cekCustRec == 3){
                typeTran = '5'
            }else{
                typeTran = '1'
            }
             
            sblId = 'item'
            fieldItem = 'item'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'expense'){
            typeTran = '2'
            sblId = 'expense'
            fieldItem = 'expmediaitem'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'customrecord_tar'){
            typeTran = '2'
            sblId = 'recmachcustrecord_tar_e_id'
            fieldItem = 'custrecord_tare_category'
            fieldCostCenter = 'custrecord_tare_cost_center'
            fieldProjectCode = 'custrecord_tare_project_code'
            fieldSOF = 'custrecord_tare_source_of_funding'
            fieldDea = 'custrecord_tare_project_task'
        }
       

        if (torKeysCache === null || lastTorId !== cekTor) {
            torKeysCache = fetchTorKeys(cekTor, typeTran);
            lastTorId = cekTor;
        }
        console.log('torKeysCache', torKeysCache)
        const itemRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldItem });
        const costCenterRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldCostCenter });
        const projectCodeRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldProjectCode });
        const sofRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldSOF });
        const deaRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldDea });

        const currentLineKey = `${itemRec}-${costCenterRec}-${projectCodeRec}-${sofRec}-${deaRec}`;
        console.log('currentLineKey', currentLineKey)
        if (!torKeysCache[currentLineKey]) {
            alert('You Cannot add line');
            return false;
        }

        return true;
    };


    const fetchTorKeys = (torId, typeTrans) => {
        console.log('typeTrans', typeTrans)
        log.debug('System', 'Fetching TOR Data for ID: ' + torId);
        let keys = {};

        const torSearch = search.create({
            type: "customrecord_tor_items",
            filters: [
                ["custrecord_tori_id", "anyof", torId],
                "AND",
                ["custrecord_tor_transaction_type", "anyof", typeTrans]
            ],
            columns: [
                "custrecord_tori_item",
                "custrecord_tori_cost_center",
                "custrecord_tori_project_code",
                "custrecord_tori_source_of_funding",
                "custrecord_tor_project_task"
            ]
        });

        torSearch.run().each(result => {
            let item = result.getValue("custrecord_tori_item");
            let costCenter = result.getValue("custrecord_tori_cost_center");
            let projectCode = result.getValue("custrecord_tori_project_code");
            let sof = result.getValue("custrecord_tori_source_of_funding");
            let dea = result.getValue("custrecord_tor_project_task");

            let key = `${item}-${costCenter}-${projectCode}-${sof}-${dea}`;
            keys[key] = true; 
            return true;
        });
        console.log('keys', keys)
        return keys;
    };

    const fieldChanged = (scriptContext) => {
        if (scriptContext.fieldId === 'custbody_stc_link_to_tor') {
            console.log('tirgger field change on tor')
            torKeysCache = null; 
        }
    };

    
    const saveRecord = (scriptContext) => {
        console.log('masuk eksekusi script');
        
        const currentRecord = scriptContext.currentRecord;
        const transactionType = currentRecord.type;
        const recId = currentRecord.id;
        
        console.log('transactionType', transactionType);
        if(transactionType == 'purchaseorder'){
             var currentUser = runtime.getCurrentUser();
            var userRole = currentUser.role;

            if (Number(userRole) === 15) {
                return true;
            }
            return validateApprover(scriptContext);
            console.log('approverOk jalan validate approver', approverOk);
        }

        try {
            let sublistId = '';
            let lineFieldId = '';
            let sofFieldId = 'customer'; 
            let typeToCheck = '';

            // Tentukan mapping berdasarkan tipe transaksi berjalan
            if (transactionType === 'expensereport') {
                sublistId = 'expense';
                lineFieldId = 'amount';
                sofFieldId = 'customer';
                typeToCheck = '2';
            } else if (transactionType === 'purchaseorder') {
                sublistId = 'item';
                lineFieldId = 'amount';
                sofFieldId = 'custcolid_line_tor';
                var cekCustomForm = currentRecord.getValue('custbody_stc_po_type');
                typeToCheck = (cekCustomForm == '3') ? '5' : '1';
            } else if (transactionType === 'purchaserequisition') {
                sublistId = 'item';
                lineFieldId = 'estimatedamount';
                sofFieldId = 'custcolid_line_tor';
                typeToCheck = '3';
            } else if (transactionType === 'customrecord_tar') {
                sublistId = 'recmachcustrecord_tar_e_id'; 
                lineFieldId = 'custrecord_tare_amount';   
                sofFieldId = 'custrecord_id_item_form_tar'; 
                typeToCheck = '4';
            }

            if (!sublistId) return true;

            // Ambil ID TOR dari body field
            let idTor = currentRecord.getValue('custbody_id_to');
            if (transactionType === 'customrecord_tar') {
                idTor = currentRecord.getValue('custrecord_tar_link_to_tor');
            }

            // Jika tidak link ke TOR, lewati validasi budget TOR
            if (!idTor) return true;

            const lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            
            if (lineCount > 0) {
                // --- STEP 1: GROUPING NOMINAL INPUT DARI TRANSAKSI BERJALAN BY SOF ---
                let sofInputAmountMap = {};
                for (let i = 0; i < lineCount; i++) {
                    let sofVal = currentRecord.getSublistValue({ sublistId: sublistId, fieldId: sofFieldId, line: i });
                    let amountVal = parseFloat(currentRecord.getSublistValue({ sublistId: sublistId, fieldId: lineFieldId, line: i })) || 0;

                    if (sofVal) {
                        let sofKey = sofVal.toString();
                        if (!sofInputAmountMap[sofKey]) sofInputAmountMap[sofKey] = 0;
                        sofInputAmountMap[sofKey] += amountVal;
                    }
                }
                console.log('sofInputAmountMap berjalan:', sofInputAmountMap);
                const recordMod = require('N/record');
                let recLoadTOR = recordMod.load({ type: 'customrecord_tor', id: idTor });
                let torLineCount = recLoadTOR.getLineCount({ sublistId: 'recmachcustrecord_tori_id' });

                let torBudgetMap = {};
                let torAllocatedMap = {};
                let torLineLinksMap = {};

                for (let i = 0; i < torLineCount; i++) {
                    let torTxType = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
                    var torSof = recLoadTOR.getSublistValue({ 
                        sublistId: 'recmachcustrecord_tori_id', 
                        fieldId: 'custrecord_tor_project', 
                        line: i 
                    });
                    if(torTxType != '2'){
                        var torSof = recLoadTOR.getSublistValue({ 
                            sublistId: 'recmachcustrecord_tori_id', 
                            fieldId: 'id', 
                            line: i 
                        });
                    }
                    if (torTxType == typeToCheck && torSof) {
                        let sofStr = torSof.toString();
                        let amount = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_amount', line: i })) || 0;
                        let allocated = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i })) || 0;
                        
                        let linkFieldId = (torTxType == '4') ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                        let links = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: linkFieldId, line: i }) || [];
                        if (!Array.isArray(links)) links = links ? [links.toString()] : [];

                        if (!torBudgetMap[sofStr]) torBudgetMap[sofStr] = 0;
                        torBudgetMap[sofStr] += amount;
                        
                        // Allocated langsung dicatat total per baris matang (sesuai logika grouping sebelumnya)
                        torAllocatedMap[sofStr] = allocated;
                        torLineLinksMap[sofStr] = links;
                    }
                }

                // --- STEP 3: HITUNG & BANDINGKAN NOMINAL DENGAN LIVE BUDGET ---
                for (let sofKey in sofInputAmountMap) {
                    if (sofInputAmountMap.hasOwnProperty(sofKey)) {
                        let currentTxInput = sofInputAmountMap[sofKey];
                        let maxBudgetTor = torBudgetMap[sofKey] || 0;
                        let currentAllocatedTor = torAllocatedMap[sofKey] || 0;
                        let existingLinks = torLineLinksMap[sofKey] || [];

                        let targetAllocatedAfterSave = 0;

                        if (recId && existingLinks.indexOf(recId.toString()) > -1) {
                            targetAllocatedAfterSave = currentTxInput; 
                        } else {
                            // Mode CREATE: Allocated lama ditambah input baru
                            targetAllocatedAfterSave = currentAllocatedTor + currentTxInput;
                        }

                        console.log('Validasi SOF:', sofKey);
                        console.log('Input Transaksi Saat Ini:', currentTxInput);
                        console.log('Plafon Maksimal TOR:', maxBudgetTor);
                        console.log('Allocated Terpakai di TOR:', currentAllocatedTor);

                        // Validasi: Jika total alokasi akhir menjebol plafon budget TOR asli
                        if (maxBudgetTor > 0 && targetAllocatedAfterSave > maxBudgetTor) {
                            dialog.alert({
                                title: 'Validasi Amount',
                                message: `Total amount (${targetAllocatedAfterSave.toLocaleString()}) melebihi nilai Amount from TOR (${maxBudgetTor.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`
                            });
                            return false; 
                        }
                    }
                }
            }
            
            return true; 
        } catch (e) {
            log.error('Error on Amount Validation', e.message);
            return true; 
        }
    };
    const pageInit = (scriptContext) => {
        const rec = scriptContext.currentRecord;
        log.debug('trigerred');
        
        const urlParams = new URLSearchParams(window.location.search);
        let rawData = urlParams.get('dataParamsString');
        console.log('rawData dari URL:', rawData);

        if (!rawData) return;

        try {
            let data;
            
            if (rawData.indexOf('temp_id_') === 0) {
                const internalRecId = rawData.replace('temp_id_', '');
                console.log('Loading Temporary Record ID:', internalRecId);

                const tempLoad = record.load({
                    type: 'customrecord_temporary_data_transfer',
                    id: internalRecId
                });

                const realJsonData = tempLoad.getValue('custrecord_temp_json_data');
                if (realJsonData) {
                    data = JSON.parse(realJsonData);
                }
                try {
                    record.delete({
                        type: 'customrecord_temporary_data_transfer',
                        id: internalRecId
                    });
                    console.log('Temporary record ' + internalRecId + ' berhasil dihapus (Cleanup).');
                } catch (errDel) {
                    console.error('Housekeeping Failed:', errDel.message);
                }

            } else {
                data = JSON.parse(rawData);
            }

            if (data && data.length > 0) {
                
                data.forEach(function(item) {
                    if (item.description) {
                        try {
                            item.description = decodeURIComponent(item.description);
                        } catch (e) {
                            console.error('Fail to decode desc:', e.message);
                        }
                    }
                });
                if (String(data[0].transactionType) === "1") {
                    console.log('Validasi lolos: transactionType adalah 1. Memulai processDataAsync...');
                    processDataAsync(data, rec);
                } else {
                    console.log('Proses dibatalkan: transactionType bukan 1. Nilai transactionType: ', data[0].transactionType);
                }
            }
            
            var cekDatetran = rec.getValue('trandate');
            console.log('cekDatetran', cekDatetran);

        } catch (e) {
            console.error('Error processing dataParamsString', e);
        }
        
        checkAndHideFields(scriptContext);
    }
    async function processDataAsync(data, rec) {
        let totalAmount = 0;

        for (let i = 0; i < data.length; i++) {
            let lineData = data[i];
            
            rec.selectNewLine({ sublistId: 'item' });

            const forceSet = (field, val, ignore) => {
                if (val !== null && val !== undefined && val !== '') {
                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: field,
                        value: val,
                        ignoreFieldChange: ignore
                    });
                }
            };

           try {
                if (lineData.item) {
                    forceSet('item', lineData.item, false);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                forceSet('quantity', lineData.qty, true);
                forceSet('rate', lineData.amount, true);
                
                // Gunakan FALSE pada amount agar NetSuite mentrigger kalkulasi total
                forceSet('amount', lineData.amount, false); 
                
                if (lineData.amount) {
                    totalAmount += Number(lineData.amount);
                    forceSet('estimaterate', lineData.amount, true);
                    forceSet('estimatedamount', lineData.amount, true);
                }

                forceSet('units', lineData.uom, true);
                forceSet('description', lineData.description, true);
                
                // Ubah menjadi false agar trigger kalkulasi pajak
                forceSet('taxcode', '5', false); 
                forceSet('currency', '1', true);
                
                // PENTING: Ubah menjadi FALSE sesuai pembahasan sebelumnya
                forceSet('department', lineData.costCenter, false);
                forceSet('class', lineData.projectCode, false);
                
                // Opsional: Jika location mandatory, Anda harus men-set nya juga
                // forceSet('location', lineData.location, false); 

                forceSet('cseg_stc_sof', lineData.sof, true);
                forceSet('cseg_paactivitycode', lineData.activityCode, true);
                forceSet('cseg1', lineData.bussinessUnit, true);
                forceSet('cseg_stc_drc_segmen', lineData.drc, true);
                forceSet('cseg_stc_segmentdea', lineData.dea, true);

                if (lineData.project) {
                    forceSet('customer', lineData.project, false);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    console.log('dataProjet', {
                        project : lineData.project,
                        projectTask : lineData.projectTask,
                    });
                    
                    forceSet('projecttask', lineData.projectTask, false);
                    
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                }

                forceSet('custcol_stc_approval_status_line', '1', true);
                forceSet('custcol_stc_apprvl_sts_fa', '1', true);
                forceSet('custcol_stc_approver_linetrx', lineData.approver, true);
                forceSet('custcol_stc_approver_fa', lineData.approverFa, true);
                forceSet('custcol_stc_asset', '2', true);
                forceSet('custcolid_line_tor', lineData.idLine, true);

                await new Promise(resolve => setTimeout(resolve, 500));

                rec.commitLine({ sublistId: 'item' });
                console.log('Baris PO ' + i + ' Berhasil Commit.');
                
            } catch (lineErr) {
                console.error('Gagal Commit Baris ' + i + ': ' + lineErr.message); 
                rec.cancelLine({ sublistId: 'item' }); 
            }

            await new Promise(resolve => setTimeout(resolve, 150));
        }

        rec.setValue({
            fieldId: 'custbody_amount_from_tor',
            value: totalAmount,
            ignoreFieldChange: true
        });

        console.log('Injeksi PO Selesai. Total Amount:', totalAmount);
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

    return {
        saveRecord: saveRecord,
        validateLine : validateLine,
        fieldChanged : fieldChanged,
        pageInit : pageInit
    };
});