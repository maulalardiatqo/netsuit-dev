/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record'], (log, record) => {

    const beforeSubmit = (scriptContext) => {
        if (scriptContext.type !== scriptContext.UserEventType.CREATE && 
            scriptContext.type !== scriptContext.UserEventType.EDIT) {
            return;
        }

        const currentRecord = scriptContext.newRecord;
        const transactionType = currentRecord.type;
        const idRec = currentRecord.id;
        
        log.debug('beforeSubmit Execution Started', { transactionType, type: scriptContext.type });

        try {
            let sublistId = '';
            let lineFieldId = '';
            let sofFieldId = 'customer'; 
            let typeToCheck = '';

            if (transactionType === 'expensereport') {
                sublistId = 'expense';
                lineFieldId = 'amount';
                sofFieldId = 'customer';
                typeToCheck = '2';
            } else if (transactionType === 'purchaseorder') {
                sublistId = 'item';
                lineFieldId = 'amount';
                sofFieldId = 'customer';
                var cekCustomForm = currentRecord.getValue('custbody_stc_po_type');
                typeToCheck = (cekCustomForm == '3') ? '5' : '1';
            } else if (transactionType === 'purchaserequisition') {
                sublistId = 'item';
                lineFieldId = 'estimatedamount';
                sofFieldId = 'customer';
                typeToCheck = '3';
            } else if (transactionType === 'customrecord_tar') {
                sublistId = 'recmachcustrecord_tar_e_id';
                lineFieldId = 'custrecord_tare_amount';
                sofFieldId = 'custrecord_tare_donor';
                typeToCheck = '4';
            }

            if (!sublistId) return;

            let idTor = currentRecord.getValue('custbody_id_to');
            if (transactionType === 'customrecord_tar') {
                idTor = currentRecord.getValue('custrecord_tar_link_to_tor');
            }

            if (!idTor) return;

            const lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            
            if (lineCount > 0) {
                // --- STEP 1: HITUNG MAP TRANSAKSI BARU (NEW RECORD) BY SOF ---
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

                // --- STEP 2: AMBIL LIVE PLAFON & ALLOCATED BUDGET DARI RECORD TOR ---
                let recLoadTOR = record.load({ type: 'customrecord_tor', id: idTor });
                let torLineCount = recLoadTOR.getLineCount({ sublistId: 'recmachcustrecord_tori_id' });

                let torBudgetMap = {};
                let torAllocatedMap = {};

                for (let i = 0; i < torLineCount; i++) {
                    let torTxType = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
                    let torSof = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project', line: i });

                    if (torTxType == typeToCheck && torSof) {
                        let sofStr = torSof.toString();
                        let amount = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_amount', line: i })) || 0;
                        let allocated = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i })) || 0;

                        if (!torBudgetMap[sofStr]) torBudgetMap[sofStr] = 0;
                        torBudgetMap[sofStr] += amount;
                        torAllocatedMap[sofStr] = allocated; 
                    }
                }

                // --- STEP 3: HITUNG MAP TRANSAKSI LAMA (KHUSUS EVENT EDIT) ---
                let oldRecordSummaryMap = {};
                if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                    let oldRec = scriptContext.oldRecord;
                    let oldLineCount = oldRec.getLineCount({ sublistId: sublistId });
                    for (let y = 0; y < oldLineCount; y++) {
                        let oldSof = oldRec.getSublistValue({ sublistId: sublistId, fieldId: sofFieldId, line: y });
                        let oldAmount = parseFloat(oldRec.getSublistValue({ sublistId: sublistId, fieldId: lineFieldId, line: y })) || 0;
                        if (oldSof) {
                            let oldSofStr = oldSof.toString();
                            if (!oldRecordSummaryMap[oldSofStr]) oldRecordSummaryMap[oldSofStr] = 0;
                            oldRecordSummaryMap[oldSofStr] += oldAmount;
                        }
                    }
                }

                // --- STEP 4: SIMULASIKAN KALKULASI ALOKASI BARU DAN VALIDASI ---
                for (let sofKey in sofInputAmountMap) {
                    if (sofInputAmountMap.hasOwnProperty(sofKey)) {
                        let newTxAmt = sofInputAmountMap[sofKey];
                        let maxBudgetTor = torBudgetMap[sofKey] || 0;
                        let currentAllocatedTor = torAllocatedMap[sofKey] || 0;

                        let calculatedAllocated = 0;

                        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                            // CREATE: Alokasi Live TOR + Input Baru berjalan
                            calculatedAllocated = currentAllocatedTor + newTxAmt;
                        } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                            // EDIT: Alokasi Live TOR - Nominal Transaksi Lama + Nominal Transaksi Baru berjalan
                            let oldTxAmt = oldRecordSummaryMap[sofKey] || 0;
                            calculatedAllocated = currentAllocatedTor - oldTxAmt + newTxAmt;
                        }

                        log.debug('Evaluating beforeSubmit Budget', {
                            sofKey,
                            maxBudgetTor,
                            currentAllocatedTor,
                            calculatedAllocated
                        });

                        // Blokir simpan jika simulasi alokasi akhir menjebol Plafon TOR asli
                        if (maxBudgetTor > 0 && calculatedAllocated > maxBudgetTor) {
                            throw `Total amount (${calculatedAllocated.toLocaleString()}) melebihi nilai Amount from TOR (${maxBudgetTor.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`;
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Error on Amount Validation beforeSubmit', e.message || e);
            throw e; 
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };
});