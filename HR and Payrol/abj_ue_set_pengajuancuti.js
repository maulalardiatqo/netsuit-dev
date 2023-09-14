/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search'], function(record, log, search) {
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
  
                var newRecord = context.newRecord;
                
                
                log.debug('masuk');
               
                var tanggalMulai = newRecord.getValue({
                    fieldId: 'custrecord_tanggal_mulai' 
                });
                var tanggalAkhir = newRecord.getValue({
                    fieldId: 'custrecord_tanggal_ahir' 
                });
                log.debug('tanggalMulai', tanggalMulai);
                log.debug('tanggalAkhir', tanggalAkhir);
                if (tanggalMulai && tanggalAkhir) {
                    log.debug('masuk kondisi');
                    var startDate = new Date(tanggalMulai);
                    log.debug('startDate', startDate);
                    var endDate = new Date(tanggalAkhir);
                    var timeDiff = endDate - startDate;
                    var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    log.debug('dayDiff', daysDiff);

                    var employee = newRecord.getValue({
                        fieldId : 'custrecord_employee_pengajuan'
                    });
                    var searchDataCuti = search.create({
                        type: 'customrecord_data_cuti',
                        columns: ['internalid', 'custrecord_data_cuti_employee'],
                        filters: [{
                          name: 'custrecord_data_cuti_employee',
                          operator: 'is',
                          values: employee
                        }]
                    });
                    var searchDataCutiSet = searchDataCuti.run();
                    searchDataCuti = searchDataCutiSet.getRange({
                        start: 0,
                        end: 1
                    });
                    if(searchDataCuti.length>0){
                        var searchDataCutiRecord = searchDataCuti[0];
                        var internalId = searchDataCutiRecord.getValue({
                            name : 'internalid'
                        });
                        log.debug('internalid', internalId);
                    }
                    if(internalId){
                        var recordData = record.load({
                            type : 'customrecord_data_cuti',
                            id : internalId,
                            isDynamic : true
                        });
                        var jatahCuti = recordData.getValue({
                            fieldId : 'custrecord_jatah_cuti'
                        });
                    }
                    if(jatahCuti < daysDiff){
                        log.debug('masuk kondisi jatah')
                        throw new Error('Jatah Cuti Sudah Habis, Silahkan Ajukan Unpaid Leave');
                    }else{
                        newRecord.setValue({
                            fieldId: 'custrecord_pengambilan_hari', 
                            value: daysDiff
                        });
                        newRecord.setValue({
                            fieldId: 'custrecord_status_pengajuan_cuti', 
                            value: 'Pengajuan'
                        });
                    }
                    
                    
                }
                
                log.debug('jatah Cuti beforload', {jatahCuti, daysDiff});
        }
    }
    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ){
            try{
                var newRecord = context.newRecord;
                var jumlahPengambilan = newRecord.getValue({
                    fieldId : 'custrecord_pengambilan_hari'
                });
                log.debug('jumlahPengambilan', jumlahPengambilan);
                var employee = newRecord.getValue({
                    fieldId : 'custrecord_employee_pengajuan'
                });
                log.debug('employee', employee);

                var searchPengajuan = search.create({
                    type: 'customrecord_pengajuan_cuti',
                    columns: ['internalid', 'custrecord_employee_pengajuan', 'custrecord_pengambilan_hari'],
                    filters: [{
                      name: 'custrecord_employee_pengajuan',
                      operator: 'is',
                      values: employee
                    }]
                });
                var totalPengambilanHari = 0;

                var searchPengajuanSet = searchPengajuan.run();
                var searchPengajuanResults = searchPengajuanSet.getRange({
                    start: 0,
                    end: 100
                });

                for (var i = 0; i < searchPengajuanResults.length; i++) {
                    var pengajuanResult = searchPengajuanResults[i];
                    log.debug('pengajuanResult', pengajuanResult);
                    var pengambilanHari = parseFloat(pengajuanResult.getValue('custrecord_pengambilan_hari'));
                    if (!isNaN(pengambilanHari)) {
                        totalPengambilanHari += pengambilanHari; 
                    }
                }
                log.debug('Total Pengambilan Hari', totalPengambilanHari);

                // search create data cuti
                var searchDataCuti = search.create({
                    type: 'customrecord_data_cuti',
                    columns: ['internalid', 'custrecord_data_cuti_employee'],
                    filters: [{
                      name: 'custrecord_data_cuti_employee',
                      operator: 'is',
                      values: employee
                    }]
                });
                var searchDataCutiSet = searchDataCuti.run();
                searchDataCuti = searchDataCutiSet.getRange({
                    start: 0,
                    end: 1
                });
                if(searchDataCuti.length>0){
                    var searchDataCutiRecord = searchDataCuti[0];
                    var internalId = searchDataCutiRecord.getValue({
                        name : 'internalid'
                    });
                    log.debug('internalid', internalId);
                }
                if(internalId){
                    var recordData = record.load({
                        type : 'customrecord_data_cuti',
                        id : internalId,
                        isDynamic : true
                    });
                    var jatahCuti = recordData.getValue({
                        fieldId : 'custrecord_jatah_cuti'
                    });
                    var currentJatah = jatahCuti - totalPengambilanHari
                    log.debug('jatahCuti', jatahCuti);
                    log.debug('currentJatah', currentJatah);
                    recordData.setValue({
                        fieldId : 'custrecord_data_cuti_diambil',
                        value :totalPengambilanHari,
                        ignoreFieldChange: true
                    });
                    recordData.setValue({
                        fieldId : 'custrecord_total_diambil',
                        value : totalPengambilanHari,
                        ignoreFieldChange: true
                    });
                    recordData.setValue({
                        fieldId : 'custrecord_sisa',
                        value : currentJatah,
                        ignoreFieldChange: true
                    });
                    recordData.save();
                }
            }catch(e){
                log.debug(e)
            }
        }
    }
    
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit : afterSubmit
    };
});
