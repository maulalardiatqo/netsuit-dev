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
                }else{
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
                        
                        log.debug('Total Amount', `Total yang akan dikurangi dari sublist '${sourceSublistId}': ${totalAmountToDeduct}`);
                    }
                    log.debug('totalAmountToDeduct', totalAmountToDeduct)
                    const torRecord = record.load({
                        type: 'customrecord_tor',
                        id: linkToTor,
                        isDynamic: false
                    });

                    const targetSublistId = 'recmachcustrecord_tori_id';
                    let isModified = false;
                    const torLineCount = torRecord.getLineCount({ sublistId: targetSublistId });

                    const torLinkFieldId = isTarRecord ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';

                    for (let i = 0; i < torLineCount; i++) {
                        let linkTrxNos = torRecord.getSublistValue({
                            sublistId: targetSublistId,
                            fieldId: torLinkFieldId,
                            line: i
                        });

                        let idArray = [];
                        if (linkTrxNos) {
                            if (Array.isArray(linkTrxNos)) {
                                idArray = linkTrxNos.map(id => String(id));
                            } else {
                                idArray = String(linkTrxNos).split(',');
                            }
                        }

                        if (idArray.includes(voidedRecordId)) {
                            
                            let updatedIds = idArray.filter(id => id !== voidedRecordId);
                            
                            torRecord.setSublistValue({
                                sublistId: targetSublistId,
                                fieldId: torLinkFieldId,
                                line: i,
                                value: updatedIds.length > 0 ? updatedIds : '' 
                            });

                            let currentAllocated = torRecord.getSublistValue({
                                sublistId: targetSublistId,
                                fieldId: 'custrecord_amount_allocated',
                                line: i
                            });
                            
                            let currentAllocatedNum = parseFloat(currentAllocated) || 0;
                            let newAllocatedAmount = currentAllocatedNum - totalAmountToDeduct;

                            torRecord.setSublistValue({
                                sublistId: targetSublistId,
                                fieldId: 'custrecord_amount_allocated',
                                line: i,
                                value: newAllocatedAmount
                            });

                            isModified = true;
                            log.debug(
                                'Update Baris TOR', 
                                `Baris ke-${i}: Sisa ID [${updatedIds.join(', ')}] | Amount: ${currentAllocatedNum} - ${totalAmountToDeduct} = ${newAllocatedAmount}`
                            );
                        }
                    }

                    if (isModified) {
                        const savedId = torRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        log.debug('Berhasil', `Record TOR dengan ID ${savedId} berhasil di-update.`);
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