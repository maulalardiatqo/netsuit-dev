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
            fieldId : 'custrecord_lama_period'
        });
        lamaPeriod.isDisplay = false;

        var tanggalAwal = currentRecordObj.getField({
            fieldId : 'custrecord_tanggal_awal_period'
        });
        tanggalAwal.isDisplay = false;

        var tanggalSlipBef = currentRecordObj.getField({
            fieldId : 'custrecord_tanggal_slip_sebelumnya'
        });
        tanggalSlipBef.isDisplay = false

        var hariawalPer = currentRecordObj.getField({
            fieldId : 'custrecord_abj_msa_hari_awalper'
        });
        hariawalPer.isDisplay = false

        var jumlahHariPeriod = currentRecordObj.getField({
            fieldId : 'custrecord_abj_msa_jumlah_hariperiod'
        })
        jumlahHariPeriod.isDisplay = false;
        // var absensiTerahir = currentRecordObj.getField({
        //     fieldId : 'custpage_absensi_terahir'
        // });

        // absensiTerahir.isDisplay = false

    }

    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        var FieldName = context.fieldId;

        var lamaPeriod = vrecord.getField({
            fieldId : 'custrecord_lama_period'
        });
        
        var tanggalAwal = vrecord.getField({
            fieldId : 'custrecord_tanggal_awal_period'
        });
        
        var tanggalSlipBef = vrecord.getField({
            fieldId : 'custrecord_tanggal_slip_sebelumnya'
        });
        var hariawalPer = vrecord.getField({
            fieldId : 'custrecord_abj_msa_hari_awalper'
        });
        var jumlahHariPeriod = vrecord.getField({
            fieldId : 'custrecord_abj_msa_jumlah_hariperiod'
        })
        
        if(FieldName == 'custrecord_slip_gaji_period'){
            var period = vrecord.getValue({
                fieldId : 'custrecord_slip_gaji_period'
            });
            console.log('period', period);
           
           
            if(period == '1'){
                console.log('masuk1')
                lamaPeriod.isDisplay = true;
                tanggalAwal.isDisplay = true;
                tanggalSlipBef.isDisplay = false;
                
            }else{
                lamaPeriod.isDisplay = false;
                tanggalAwal.isDisplay = false;
                tanggalSlipBef.isDisplay = true;

            }
            
        }
        if(FieldName == 'custrecord_lama_period'){
            
            
            var lamaPeriode = vrecord.getValue({
                fieldId : 'custrecord_lama_period'
            });
            console.log('lamaPeriod', lamaPeriod);
            if(lamaPeriode == '1'){
                console.log('masuk1lamaperiod');
                hariawalPer.isDisplay = false
                tanggalAwal.isDisplay = true
                tanggalSlipBef.isDisplay = false
                jumlahHariPeriod.isDisplay = false
            }else if(lamaPeriode == '2'){
                hariawalPer.isDisplay = true
                tanggalAwal.isDisplay = false
                tanggalSlipBef.isDisplay = false
                jumlahHariPeriod.isDisplay = false
            }else if(lamaPeriode == '3'){
                hariawalPer.isDisplay = false
                tanggalAwal.isDisplay = false
                tanggalSlipBef.isDisplay = true
                jumlahHariPeriod.isDisplay = true
            }
        }
        
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
