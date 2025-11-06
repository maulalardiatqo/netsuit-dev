/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog', 'N/runtime'], 
    (currentRecord, record, dialog, runtime) => {
    const pageInit = (context) => {
        try {
            const rec = context.currentRecord;
            console.log('Page Init - Record Type:', rec.type);
        } catch (e) {
            console.log('Error di pageInit:', e);
        }
    };
    const recall = async () => {
        try {
            const rec = currentRecord.get();
            const recId = rec.id;
            const recType = rec.type;

            const confirmRecall = await dialog.confirm({
                title: 'Konfirmasi Recall',
                message: 'Apakah Anda yakin ingin melakukan Recall pada record ini?'
            });

            if (confirmRecall) {
                // Submit perubahan field custbody_abj_flag_approval = false
                var recordLoad = record.load({
                    type : recType,
                    id : recId
                })
                recordLoad.setValue({
                    fieldId : 'custbody_abj_flag_approval',
                    value : false
                })
                recordLoad.setValue({
                    fieldId : 'custbody_abj_revision',
                    value : true
                })
                recordLoad.setValue({
                    fieldId : 'custbody_after_recall',
                    value : false
                })
                var cekRec = recordLoad.save()
                if(cekRec){
                    dialog.alert({
                        title: 'Recall Berhasil',
                        message: 'Approval berhasil di-recall.'
                    });
                }else{
                    dialog.alert({
                        title: 'Recall Gagal',
                        message: 'Approval gagal di-recall.'
                    });
                }
                

                location.reload();
            }

        } catch (e) {
            console.log('Error saat recall:', e);
            dialog.alert({
                title: 'Error Recall',
                message: 'Terjadi kesalahan: ' + e.message
            });
        }
    };
    const resubmit = async () => {
        try {
            const rec = currentRecord.get();
            const recId = rec.id;
            const recType = rec.type;

            const confirmRecall = await dialog.confirm({
                title: 'Konfirmasi Resubmit Approval',
                message: 'Apakah Anda yakin ingin melakukan Resubmit approval pada record ini?'
            });

            if (confirmRecall) {
                // Submit perubahan field custbody_abj_flag_approval = false
                var recordLoad = record.load({
                    type : recType,
                    id : recId
                })
                recordLoad.setValue({
                    fieldId : 'approvalstatus',
                    value : '1'
                })
                recordLoad.setValue({
                    fieldId : 'custbody_after_recall',
                    value : false
                })
                recordLoad.setValue({
                    fieldId : 'custbody_abj_trigger_resubmit',
                    value : true
                })
                recordLoad.setValue({
                    fieldId : 'custbody_abj_flag_approval',
                    value : false
                })
                var cekRec = recordLoad.save()
                if(cekRec){
                    dialog.alert({
                        title: 'Resubmit Berhasil',
                        message: 'Approval berhasil di submit.'
                    });
                }else{
                    dialog.alert({
                        title: 'Resubmit Gagal',
                        message: 'Approval gagal di-resubmit.'
                    });
                }
                

                location.reload();
            }

        } catch (e) {
            console.log('Error saat resubmit:', e);
            dialog.alert({
                title: 'Error Resubmit',
                message: 'Terjadi kesalahan: ' + e.message
            });
        }
    }

    return { pageInit, recall, resubmit };
});
