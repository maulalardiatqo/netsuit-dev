/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog', 'N/runtime', 'N/url', 'N/https'], 
    (currentRecord, record, dialog, runtime, url, https) => {
    const pageInit = (context) => {
        try {
            const rec = context.currentRecord;
            console.log('Page Init - Record Type:', rec.type);
        } catch (e) {
            console.log('Error di pageInit:', e);
        }
    };
    const submitApp = async () => {
        try {
            const rec = currentRecord.get();
            const roleAdmin = 3;
            let isAdmin = false;
            
            const currentRole = runtime.getCurrentUser().role;
            console.log('currentRole', currentRole)
            if (currentRole == roleAdmin) {
                isAdmin = true;
            }
            dialog.confirm({
                title: 'Konfirmasi',
                message: 'Apakah Anda yakin ingin Submit Approval ke Website?'
            }).then((confirmed) => {
                if (confirmed) {
                    console.log('Processing...');

                    const suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_abj_sl_callintegration', 
                        deploymentId: 'customdeploy_abj_sl_callintegration'
                    });

                    const response = https.post({
                        url: suiteletUrl,
                        body: JSON.stringify({ 
                            recId: rec.id, 
                            recType: rec.type, 
                            isAdmin: isAdmin
                        })
                    });

                    const result = JSON.parse(response.body);

                    if (result.status === 'success' || result.id_web) {
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
        }catch(e){
            console.log('error', e)
        }
    }

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
                    fieldId : 'custbody_after_recall',
                    value : true
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
    const resubmitData = async () => {
        try {
            const rec = currentRecord.get();
            const recId = rec.id;
            const recType = rec.type;

            const confirmRecall = await dialog.confirm({
                title: 'Konfirmasi Resubmit Data',
                message: 'Apakah Anda yakin ingin melakukan Resubmit Data pada record ini?'
            });

            if (confirmRecall) {
                // Submit perubahan field custbody_abj_flag_approval = false
                var recordLoad = record.load({
                    type : recType,
                    id : recId
                })
                recordLoad.setValue({
                    fieldId : 'custbody_abj_trigger_resubmit',
                    value : true
                })
                var cekRec = recordLoad.save()
                if(cekRec){
                    dialog.alert({
                        title: 'Resubmit  Revision Berhasil',
                        message: 'Approval berhasil di submit.'
                    });
                }else{
                    dialog.alert({
                        title: 'Resubmit Revision Gagal',
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
    const resubmit = async () => {
        try {
            const rec = currentRecord.get();
            const recId = rec.id;
            const recType = rec.type;

            const confirmRecall = await dialog.confirm({
                title: 'Konfirmasi Resubmit Revision',
                message: 'Apakah Anda yakin ingin melakukan Resubmit Revision pada record ini?'
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
                var cekLine = recordLoad.getLineCount({
                    sublistId: 'recmachcustrecord_abj_a_id'
                });
                if(cekLine > 0){
                    for(var i = 0; i < cekLine; i++){
                        recordLoad.setSublistValue({
                            sublistId : 'recmachcustrecord_abj_a_id',
                            fieldId : 'custrecord_abj_status_approve',
                            value : '1',
                            line : i
                        });
                    }
                }
                var cekRec = recordLoad.save()
                if(cekRec){
                    dialog.alert({
                        title: 'Resubmit  Revision Berhasil',
                        message: 'Approval berhasil di submit.'
                    });
                }else{
                    dialog.alert({
                        title: 'Resubmit Revision Gagal',
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
    const afterReject = async () =>{
        try {
            const rec = currentRecord.get();
            const recId = rec.id;
            const recType = rec.type;

            const confirmRecall = await dialog.confirm({
                title: 'Konfirmasi Resubmit Approval',
                message: 'Apakah Anda yakin ingin melakukan Resubmit approval pada record ini?'
            });

            if (confirmRecall) {
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
                    value : false
                })
                recordLoad.setValue({
                    fieldId : 'custbody_after_recall',
                    value : true
                })
                recordLoad.setValue({
                    fieldId : 'approvalstatus',
                    value : '1'
                })
                var cekLine = recordLoad.getLineCount({
                    sublistId: 'recmachcustrecord_abj_a_id'
                });
                if(cekLine > 0){
                    for(var i = 0; i < cekLine; i++){
                        recordLoad.setSublistValue({
                            sublistId : 'recmachcustrecord_abj_a_id',
                            fieldId : 'custrecord_abj_status_approve',
                            value : '1',
                            line : i
                        });
                    }
                }
                var cekRec = recordLoad.save()
                if(cekRec){
                    dialog.alert({
                        title: 'Resubmit Approval Berhasil',
                        message: 'Approval berhasil di-resubmit.'
                    });
                }else{
                    dialog.alert({
                        title: 'Resubmit Approval Gagal',
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
    return { pageInit, recall, resubmit, afterReject, submitApp, resubmitData };
});
