/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord',], function (currentRecord,) {
    function pageInit(context) {
        console.log('masuk');
        var currentRecordObj = currentRecord.get();
        var lamaPeriod = currentRecordObj.getField({
            fieldId : 'custpage_lama_period_slip_gaji'
        });
        lamaPeriod.isDisplay = false;

        var hariAwalPeriod = currentRecordObj.getField({
            fieldId : 'custpage_hari_awal_period_slip_gaji'
        });
        hariAwalPeriod.isDisplay = false;

        var jumlahHariPeriod = currentRecordObj.getField({
            fieldId : 'custpage_jumlah_hari_period'
        });
        jumlahHariPeriod.isDisplay = false

        var tanggalSlipSebelumnya = currentRecordObj.getField({
            fieldId : 'custpage_tanggal_slip_sebelumnya'
        });
        tanggalSlipSebelumnya.isDisplay = false

        var tanggalAwalPeriod = currentRecordObj.getField({
            fieldId : 'custpage_tanggal_awal_period'
        })
        tanggalAwalPeriod.isDisplay = false;
        // var absensiTerahir = currentRecordObj.getField({
        //     fieldId : 'custpage_absensi_terahir'
        // });

        // absensiTerahir.isDisplay = false

    }

    function fieldChanged(context) {
        var currentRecordObj = currentRecord.get();
        var lamaPeriod = currentRecordObj.getField({
            fieldId : 'custpage_lama_period_slip_gaji'
        });
        lamaPeriod.isDisplay = false;

        var hariAwalPeriod = currentRecordObj.getField({
            fieldId : 'custpage_hari_awal_period_slip_gaji'
        });
        hariAwalPeriod.isDisplay = false;

        var jumlahHariPeriod = currentRecordObj.getField({
            fieldId : 'custpage_jumlah_hari_period'
        });
        jumlahHariPeriod.isDisplay = false

        var tanggalSlipSebelumnya = currentRecordObj.getField({
            fieldId : 'custpage_tanggal_slip_sebelumnya'
        });
        tanggalSlipSebelumnya.isDisplay = false

        var tanggalAwalPeriod = currentRecordObj.getField({
            fieldId : 'custpage_tanggal_awal_period'
        })
        tanggalAwalPeriod.isDisplay = false;
        
        if(context.fieldId == 'custpage_period_slip_gaji'){
            console.log('change');

            
            var periodSlip = currentRecordObj.getValue('custpage_period_slip_gaji');
            console.log('periodSlip', periodSlip);
            if(periodSlip == 1){
                lamaPeriod.isDisplay = true
                tanggalAwalPeriod.isDisplay = true
            }
        }
        if(context.fieldId == 'custpage_lama_period_slip_gaji'){
            var lamaPeriodValue = currentRecordObj.getValue('custpage_lama_period_slip_gaji');
            console.log('lamaPeriod', lamaPeriodValue);
            if(lamaPeriodValue == 2){
                hariAwalPeriod.isDisplay = true
            }else if(lamaPeriodValue == 3){
                jumlahHariPeriod.isDisplay = true
                tanggalSlipSebelumnya.isDisplay = true
            }
        }
        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
