/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog', 'N/url', 'N/https'], 
    (currentRecord, record, dialog, url, https) => {

    const pageInit = (context) => {
    };

    // 1. SUBMIT AWAL
    const submitApp = () => {
        const rec = currentRecord.get();
        dialog.confirm({
            title: 'Konfirmasi',
            message: 'Apakah Anda yakin ingin Submit Approval ke Website?'
        }).then((confirmed) => {
            if (confirmed) {
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_sl_callintegration',
                    deploymentId: 'customdeploy_abj_sl_callintegration'
                });

                const response = https.post({
                    url: suiteletUrl,
                    body: JSON.stringify({ recId: rec.id, recType: rec.type, action: 'submitApp' })
                });

                const result = JSON.parse(response.body);

                if (result.status === 'success' || result.po_id) {
                    dialog.alert({
                        title: 'Success',
                        message: 'Data berhasil dikirim ke Website.'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Gagal integrasi: ' + (result.message || 'Unknown Error')
                    });
                }
            }
        });
    };

    // 2. RECALL
    const recall = () => {
        const rec = currentRecord.get();
        dialog.confirm({
            title: 'Konfirmasi Recall',
            message: 'Tarik kembali dokumen untuk diedit?'
        }).then((confirmed) => {
            if (confirmed) {
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_sl_callintegration',
                    deploymentId: 'customdeploy_abj_sl_callintegration'
                });

                const response = https.post({
                    url: suiteletUrl,
                    body: JSON.stringify({ recId: rec.id, recType: rec.type, action: 'recall' })
                });

                const result = JSON.parse(response.body);

                if (result.status === 'success' || result.status === 'success_update') {
                    // Update flags agar tombol edit muncul (after_recall = true)
                    record.submitFields({
                        type: rec.type,
                        id: rec.id,
                        values: {
                            'custbody_after_recall': true,
                            'custbody_abj_ready_resubmit': false
                        }
                    });
                    dialog.alert({
                        title: 'Success',
                        message: 'Berhasil Recall. Dokumen sekarang dapat diedit.'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Gagal Recall: ' + (result.message || 'Unknown Error')
                    });
                }
            }
        });
    };

    // 3. RESUBMIT APPROVAL (Setelah Reject atau Recall + Edit Save)
    const resubmitApproval = () => {
        const rec = currentRecord.get();
        dialog.confirm({
            title: 'Konfirmasi Resubmit',
            message: 'Apakah Anda yakin ingin mengirim ulang approval ini?'
        }).then((confirmed) => {
            if (confirmed) {
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_sl_callintegration',
                    deploymentId: 'customdeploy_abj_sl_callintegration'
                });

                const response = https.post({
                    url: suiteletUrl,
                    body: JSON.stringify({ recId: rec.id, recType: rec.type, action: 'resubmitApproval' })
                });

                const result = JSON.parse(response.body);

                if (result.status === 'success' || result.status === 'success_update') {
                    // Matikan flag ready_resubmit dan reset status recall
                    record.submitFields({
                        type: rec.type,
                        id: rec.id,
                        values: {
                            'custbody_abj_ready_resubmit': false,
                            'custbody_after_recall': false,
                            'approvalstatus': '1'
                        }
                    });
                    dialog.alert({
                        title: 'Success',
                        message: 'Data berhasil di-resubmit.'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Gagal Resubmit: ' + (result.message || 'Unknown Error')
                    });
                }
            }
        });
    };

    // 4. SUBMIT REVISION (Setelah Approved + Edit Save)
    const resubmitRevission = () => {
        const rec = currentRecord.get();
        dialog.confirm({
            title: 'Konfirmasi Revisi',
            message: 'Apakah Anda yakin ingin membuat revisi baru ke website?'
        }).then((confirmed) => {
            if (confirmed) {
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_sl_callintegration',
                    deploymentId: 'customdeploy_abj_sl_callintegration'
                });

                const response = https.post({
                    url: suiteletUrl,
                    body: JSON.stringify({ recId: rec.id, recType: rec.type, action: 'resubmitRevission' })
                });

                const result = JSON.parse(response.body);

                if (result.status === 'success') {
                    // Kalkulasi Revision Code untuk update di NS
                    let currentRev = rec.getValue('custbody_abj_revision_code') || '';
                    let nextRev = currentRev ? 'R' + (parseInt(currentRev.replace('R', '')) + 1) : 'R1';

                    record.submitFields({
                        type: rec.type,
                        id: rec.id,
                        values: {
                            'custbody_abj_ready_resubmit': false,
                            'custbody_abj_revision_code': nextRev,
                            'approvalstatus': '1'
                        }
                    });

                    dialog.alert({
                        title: 'Success',
                        message: 'Revisi ' + nextRev + ' berhasil dikirim.'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: 'Gagal Revisi: ' + (result.message || 'Unknown Error')
                    });
                }
            }
        });
    };

    return { 
        pageInit, 
        submitApp, 
        recall, 
        resubmitApproval, 
        resubmitRevission 
    };
});