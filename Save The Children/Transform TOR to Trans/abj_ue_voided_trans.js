/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], (record, log) => {

    const afterSubmit = (context) => {
        log.debug('context.type', context.type)
        if (context.type !== context.UserEventType.EDIT) {
            return;
        }

        try {
            const rec = context.newRecord;
            const oldRecord = context.oldRecord; 
            const voidedRecordId = String(rec.id); 
            const recordType = rec.type;

            // Penanda apakah record adalah customrecord_tar
            const isTarRecord = (recordType === 'customrecord_tar');

            const newRecord = record.load({
                type : rec.type,
                id : rec.id
            });

            // 1. Cek Void atau Inactive berdasarkan record type
            const voidFieldId = isTarRecord ? 'isinactive' : 'voided';
            const cekVoided = newRecord.getValue({
               fieldId : voidFieldId
            });
            log.debug('cekVoided / isinactive', cekVoided);

            const isTriggered = (cekVoided === 'T' || cekVoided === true);

            if(isTriggered) {
                log.debug('masuk eksekusi void / inactive')
                var linkToTor
                if(isTarRecord) {
                    linkToTor = newRecord.getValue({ fieldId : 'custrecord_tar_link_to_tor'});
                } else {
                    linkToTor = newRecord.getValue({ fieldId: 'custbody_stc_link_to_tor' });
                }
                
                log.debug('linkToTor', linkToTor)
                
                if (linkToTor) {
                    log.debug('Proses', `ID Transaksi: ${voidedRecordId} | Tipe: ${recordType} | TOR Link ID: ${linkToTor}`);

                    let sourceSublistId;
                    let amountFieldId;

                    if (isTarRecord) {
                        sourceSublistId = 'recmachcustrecord_tar_e_id';
                        amountFieldId = 'custrecord_tare_amount';
                    } else {
                        let isExpenseReport = (recordType === record.Type.EXPENSE_REPORT || recordType === 'expensereport');
                        let isPurchaseReq = (recordType === record.Type.PURCHASE_REQUISITION || recordType === 'purchaserequisition');

                        sourceSublistId = isExpenseReport ? 'expense' : 'item';

                        if (isPurchaseReq) {
                            amountFieldId = 'estimatedamount';
                        } else {
                            amountFieldId = 'amount';
                        }
                    }

                    let totalAmountToDeduct = 0;

                    if (oldRecord) {
                        try {
                            const lineCount = oldRecord.getLineCount({ sublistId: sourceSublistId });
                            log.debug('sourceSublistId', sourceSublistId)
                            if (lineCount > 0) {
                                for (let e = 0; e < lineCount; e++) {
                                    let lineAmount = oldRecord.getSublistValue({
                                        sublistId: sourceSublistId,
                                        fieldId: amountFieldId,
                                        line: e
                                    });
                                    log.debug('lineAmount', lineAmount)
                                    totalAmountToDeduct += (parseFloat(lineAmount) || 0);
                                }
                            }
                        } catch (sublistErr) {
                            log.error('Sublist Error', `Sublist '${sourceSublistId}' tidak ditemukan di record ini.`);
                        }

                        log.debug('Total Amount', `Total yang akan dikurangi: ${totalAmountToDeduct}`);
                    }
                    
                    // =========================================================
                    // LOGIKA PENENTUAN RECORD TOR MANA SAJA YANG AKAN DI-UPDATE
                    // =========================================================
                    
                    // Kita buat array penampung, isi awalnya adalah TOR asli (linkToTor)
                    let torIdsToUpdate = [String(linkToTor)]; 

                    // Load TOR asli untuk mengecek apakah ada amendment
                    let originalTorRecord = record.load({
                        type: 'customrecord_tor',
                        id: linkToTor,
                        isDynamic: false
                    });

                    let amendmentList = originalTorRecord.getValue({ fieldId: 'custrecord_abj_tor_amendment_list' });
                    
                    if (amendmentList && amendmentList.length > 0) {
                        let idArray = Array.isArray(amendmentList) ? amendmentList : String(amendmentList).split(',');
                        // Filter string kosong dan ubah ke Integer untuk dicari MAX nya
                        idArray = idArray.filter(id => id).map(id => parseInt(id, 10));
                        
                        if (idArray.length > 0) {
                            let maxAmendmentId = String(Math.max(...idArray)); // Cari ID terbesar
                            
                            // Pastikan maxAmendmentId belum ada di array untuk menghindari duplikat proses
                            if (!torIdsToUpdate.includes(maxAmendmentId)) {
                                torIdsToUpdate.push(maxAmendmentId);
                                log.debug('Amendment Terdeteksi', `Record Amendment MAX ID (${maxAmendmentId}) ditambahkan ke antrean update.`);
                            }
                        }
                    }

                    log.debug('List TOR ID yang akan diupdate', torIdsToUpdate.join(', '));

                    // =========================================================
                    // EKSEKUSI UPDATE UNTUK SEMUA ID DI DALAM torIdsToUpdate
                    // =========================================================
                    
                    for (let x = 0; x < torIdsToUpdate.length; x++) {
                        let currentTorId = torIdsToUpdate[x];
                        let torRecordToUpdate;

                        // Optimalisasi: Jika ID-nya adalah TOR asli yang sudah kita load di atas, pakai yang sudah di-load
                        if (currentTorId === String(linkToTor)) {
                            torRecordToUpdate = originalTorRecord;
                        } else {
                            // Load TOR amendment
                            torRecordToUpdate = record.load({
                                type: 'customrecord_tor',
                                id: currentTorId,
                                isDynamic: false
                            });
                        }

                        const targetSublistId = 'recmachcustrecord_tori_id';
                        let isModified = false;
                        const torLineCount = torRecordToUpdate.getLineCount({ sublistId: targetSublistId });
                        const torLinkFieldId = isTarRecord ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';

                        for (let i = 0; i < torLineCount; i++) {
                            let linkTrxNos = torRecordToUpdate.getSublistValue({
                                sublistId: targetSublistId,
                                fieldId: torLinkFieldId,
                                line: i
                            });

                            let idArrayTrx = [];
                            if (linkTrxNos) {
                                if (Array.isArray(linkTrxNos)) {
                                    idArrayTrx = linkTrxNos.map(id => String(id));
                                } else {
                                    idArrayTrx = String(linkTrxNos).split(',');
                                }
                            }

                            if (idArrayTrx.includes(voidedRecordId)) {
                                let updatedIds = idArrayTrx.filter(id => id !== voidedRecordId);

                                torRecordToUpdate.setSublistValue({
                                    sublistId: targetSublistId,
                                    fieldId: torLinkFieldId,
                                    line: i,
                                    value: updatedIds.length > 0 ? updatedIds : '' 
                                });

                                let currentAllocated = torRecordToUpdate.getSublistValue({
                                    sublistId: targetSublistId,
                                    fieldId: 'custrecord_amount_allocated',
                                    line: i
                                });

                                let currentAllocatedNum = parseFloat(currentAllocated) || 0;
                                let newAllocatedAmount = currentAllocatedNum - totalAmountToDeduct;

                                torRecordToUpdate.setSublistValue({
                                    sublistId: targetSublistId,
                                    fieldId: 'custrecord_amount_allocated',
                                    line: i,
                                    value: newAllocatedAmount
                                });

                                isModified = true;
                                log.debug(
                                    `Update Baris TOR (ID: ${currentTorId})`, 
                                    `Baris ke-${i}: Sisa ID [${updatedIds.join(', ')}] | Amount: ${currentAllocatedNum} - ${totalAmountToDeduct} = ${newAllocatedAmount}`
                                );
                            }
                        }

                        if (isModified) {
                            const savedId = torRecordToUpdate.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                            log.debug('Berhasil', `Record TOR dengan ID ${savedId} berhasil di-update.`);
                        } else {
                            log.debug('Skip', `Record TOR dengan ID ${currentTorId} tidak memiliki perubahan (transaksi tidak ditemukan di sublist).`);
                        }
                    }
                }
            }            

        } catch (error) {
            log.error('Error saat Update TOR', error.message);
        }
    };

    return {
        afterSubmit: afterSubmit
    };
});