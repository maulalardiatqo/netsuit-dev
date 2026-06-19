/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/log', 'N/search'], (dialog, log, search) => {
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
        
        log.debug('transactionType', transactionType);

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

                // --- STEP 2: LOAD DATA TOR ASLI UNTUK MENGAMBIL BUDGET LIVE PER SOF & TRANSTYPE ---
                // Menggunakan require mendadak untuk record module jika belum di-load global
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

                        // Logika Dinamis: Jika mode EDIT dan ID transaksi ini sudah nempel di TOR, 
                        // maka transaksi ini sudah menyumbang angka ke 'allocated'. Maka nilai alokasi 
                        // harus dibersihkan dulu dari manifestasi nominal lama sebelum membandingkan plafon.
                        if (recId && existingLinks.indexOf(recId.toString()) > -1) {
                            // Khusus mode EDIT, sisa budget live dihitung dari: Plafon TOR - (Allocated Live - Nominal saat ini sebelum di-save)
                            // Karena kita belum tahu nominal lama di level Client, validasi paling aman adalah membandingkan total simulasi akhir:
                            // Tapi karena ini Client Script (bisa bypass budget lama), kita gunakan kalkulasi selisih yang aman:
                            // Solusi alternatif: di level Client, asumsikan penambahan alokasi baru tidak boleh menjebol Plafon TOR total jika diakumulasi dengan transaksi lain.
                            // Namun untuk akurasi EDIT paling sempurna, biarkan User Event di beforeSubmit yang memblokir secara absolut menggunakan oldRecord. 
                            // Di Client, kita validasikan untuk porsi penambahan murni:
                            targetAllocatedAfterSave = currentTxInput; // Paling aman diserahkan ke beforeSubmit untuk akurasi EDIT
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
        checkAndHideFields(scriptContext)
    }
    return {
        saveRecord: saveRecord,
        validateLine : validateLine,
        fieldChanged : fieldChanged,
        pageInit : pageInit
    };
});