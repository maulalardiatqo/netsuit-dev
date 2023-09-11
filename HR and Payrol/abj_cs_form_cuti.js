/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord','N/record', 'N/search'], function (currentRecord, record, search) {
    function pageInit(context) {
        console.log('masuk');
        var currentRecordObj = currentRecord.get();
        var employee = currentRecordObj.getValue('custrecord_employee_pengajuan');

    }
    function fieldChanged(context) {
        var currentRecordObj = currentRecord.get();
       
        if(context.fieldId == 'custrecord_employee_pengajuan'){
            var employee = currentRecordObj.getValue('custrecord_employee_pengajuan');
            console.log(employee);
            var searchDataCuti = search.create({
                type: 'customrecord_data_cuti',
                columns: ['internalid', 'custrecord_data_cuti_employee', 'custrecord_jatah_cuti', 'custrecord_data_cuti_diambil', 'custrecord_data_jatah_carry_forward', 'custrecorddat_carry_forward_diambil', 'custrecord_total_diambil', 'custrecord_sisa'],
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
            console.log(searchDataCuti);
            if(searchDataCuti.length>0){
                var searchDataCutiRecord = searchDataCuti[0];
                var jatahCUti = searchDataCutiRecord.getValue({
                    name : 'custrecord_jatah_cuti'
                });
                console.log(jatahCUti);
                var cutiDiambil = searchDataCutiRecord.getValue({
                    name : 'custrecord_data_cuti_diambil'
                });

                currentRecordObj.setValue({
                    fieldId : 'custrecord_jatah_cuti_tahunan',
                    value : jatahCUti,
                    ignoreFieldChange: true
                });
                console.log('setted')
                currentRecordObj.setValue({
                    fieldId : 'custrecord_jumlah_telah_diambil',
                    value : cutiDiambil,
                    ignoreFieldChange: true
                });
                console.log('settet2')
            }
        }
        if(context.fieldId == 'custrecord_tanggal_mulai'){
            console.log('dateCHanged')
            var tanggalMulai = currentRecordObj.getValue('custrecord_tanggal_mulai');
            console.log(tanggalMulai);
        }
        if(context.fieldId == 'custrecord_tanggal_ahir'){
            var tanggalAhir = currentRecordObj.getValue('custrecord_tanggal_mulai');
            console.log(tanggalAhir);
        }
        if(context.fieldId == 'custrecord_keterangan'){
            console.log('keterangan')
        }
        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
