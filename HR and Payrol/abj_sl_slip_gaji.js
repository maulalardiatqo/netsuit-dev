/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/record', 'N/search'], function (serverWidget, record, search) {
  
    function onRequest(context) {
      if (context.request.method === 'GET') {
        var form = serverWidget.createForm({
          title: 'Slip Gaji'
        });
        var namaSlipGaji = form.addField({
            id: 'custpage_nama_slip_gaji',
            type: serverWidget.FieldType.TEXT,
            label: 'Nama Slip Gaji'
        });
        var periodSlipGaji = form.addField({
            id: 'custpage_period_slip_gaji',
            type: serverWidget.FieldType.SELECT,
            label: 'period'
        });
        periodSlipGaji.addSelectOption({
            value: '',
            text: ''
        });
        periodSlipGaji.addSelectOption({
            value: '1',
            text: 'Tetap(Gaji Bulanan, Mingguan, Harian)'
        });
        periodSlipGaji.addSelectOption({
            value: '2',
            text: 'Tidak Tetap (THR atau bonus lebih dari 31 Hari)'
        });

        var lamaPeriod = form.addField({
            id: 'custpage_lama_period_slip_gaji',
            type: serverWidget.FieldType.SELECT,
            label: 'Lama Period'
        });
        lamaPeriod.addSelectOption({
            value: '',
            text: ''
        });
        lamaPeriod.addSelectOption({
            value: '1',
            text: '1 Bulanan'
        });
        lamaPeriod.addSelectOption({
            value: '2',
            text: '1 Mingguan'
        });
        lamaPeriod.addSelectOption({
            value: '3',
            text: 'N Harian'
        });
        var hariAwalPeriod = form.addField({
            id: 'custpage_hari_awal_period_slip_gaji',
            type: serverWidget.FieldType.SELECT,
            label: 'Hari Awal Perion'
        });
        hariAwalPeriod.addSelectOption({
            value: '',
            text: ''
        });
        hariAwalPeriod.addSelectOption({
            value: 'Senin',
            text: 'Senin'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Selasa',
            text: 'Selasa'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Rabu',
            text: 'Rabu'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Kamis',
            text: 'Kamis'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Jumat',
            text: 'Jumat'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Sabtu',
            text: 'Sabtu'
        });
        hariAwalPeriod.addSelectOption({
            value: 'Minggu',
            text: 'Minggu'
        });

        var tangglAwalPeriod = form.addField({
            id: 'custpage_tanggal_awal_period',
            type: serverWidget.FieldType.SELECT,
            label: 'Tanggal Awal Period'
        });
        tangglAwalPeriod.addSelectOption({
            value: '',
            text: ''
        })
        tangglAwalPeriod.addSelectOption({
            value: '1',
            text: '1'
        });
        tangglAwalPeriod.addSelectOption({
            value: '2',
            text: '2'
        });
        tangglAwalPeriod.addSelectOption({
            value: '3',
            text: '3'
        });
        tangglAwalPeriod.addSelectOption({
            value: '4',
            text: '4'
        });
        tangglAwalPeriod.addSelectOption({
            value: '5',
            text: '5'
        });
        tangglAwalPeriod.addSelectOption({
            value: '6',
            text: '6'
        });
        tangglAwalPeriod.addSelectOption({
            value: '7',
            text: '7'
        });
        tangglAwalPeriod.addSelectOption({
            value: '8',
            text: '8'
        });
        tangglAwalPeriod.addSelectOption({
            value: '9',
            text: '9'
        });
        tangglAwalPeriod.addSelectOption({
            value: '10',
            text: '10'
        });
        tangglAwalPeriod.addSelectOption({
            value: '11',
            text: '11'
        });
        tangglAwalPeriod.addSelectOption({
            value: '12',
            text: '12'
        });
        tangglAwalPeriod.addSelectOption({
            value: '13',
            text: '13'
        });
        tangglAwalPeriod.addSelectOption({
            value: '14',
            text: '14'
        });
        tangglAwalPeriod.addSelectOption({
            value: '15',
            text: '15'
        });
        tangglAwalPeriod.addSelectOption({
            value: '16',
            text: '16'
        });
        tangglAwalPeriod.addSelectOption({
            value: '17',
            text: '17'
        });
        tangglAwalPeriod.addSelectOption({
            value: '18',
            text: '18'
        });
        tangglAwalPeriod.addSelectOption({
            value: '19',
            text: '19'
        });
        tangglAwalPeriod.addSelectOption({
            value: '20',
            text: '20'
        });
        tangglAwalPeriod.addSelectOption({
            value: '21',
            text: '21'
        });
        tangglAwalPeriod.addSelectOption({
            value: '22',
            text: '22'
        });
        tangglAwalPeriod.addSelectOption({
            value: '23',
            text: '23'
        });
        tangglAwalPeriod.addSelectOption({
            value: '24',
            text: '24'
        });
        tangglAwalPeriod.addSelectOption({
            value: '25',
            text: '25'
        });
        tangglAwalPeriod.addSelectOption({
            value: '26',
            text: '26'
        });
        tangglAwalPeriod.addSelectOption({
            value: '27',
            text: '27'
        });
        tangglAwalPeriod.addSelectOption({
            value: '28',
            text: '28'
        });

        

        var jumlahHariPeriod = form.addField({
            id: 'custpage_jumlah_hari_period',
            type: serverWidget.FieldType.INTEGER,
            label: 'Jumlah Hari Dalam Period (Harus Lebih Dari 31 Hari)'
        });

        var tanggalSlipSebelumnya = form.addField({
            id: 'custpage_tanggal_slip_sebelumnya',
            type: serverWidget.FieldType.DATE,
            label: 'Tanggal Slip Sebelumnya'
        })

        var absensiTerahir = form.addField({
            id: 'custpage_absensi_terahir',
            type: serverWidget.FieldType.SELECT,
            label: 'Untuk komponen pendapatan tergantung kehadiran, tentukan hari absensi terakhir yang masuk hitungan gaji:'
        });
        absensiTerahir.addSelectOption({
            value: '',
            text: ''
        });
        absensiTerahir.addSelectOption({
            value: '0',
            text: '0 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '1',
            text: '1 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '2',
            text: '2 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '3',
            text: '3 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '4',
            text: '4 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '5',
            text: '5 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '6',
            text: '6 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '7',
            text: '7 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '8',
            text: '8 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '9',
            text: '9 Hari sebelum akhir period'
        });
        absensiTerahir.addSelectOption({
            value: '10',
            text: '10 Hari sebelum akhir period'
        });

        var komponenPendapatan = form.addSublist({
          id: 'custrecord_komponen_pendapatan',
          type: serverWidget.SublistType.INLINEEDITOR,
          label: 'Komponen Pendapatan'
        });
        var komponenPendapatanSublist = komponenPendapatan.addField({
            id: 'custpage_komponen_pendapatan_name',
            type: serverWidget.FieldType.SELECT,
            label: 'Nama Komponen'
        })
        var komponenPendapatanSearch = search.create({
            type : 'customrecord_komponen_pendapatan',
            columns : ['internalid', 'custrecord_komponen_name'], 
        });
        var searchResults = komponenPendapatanSearch.run();
        searchResults.each(function(result) {
            var id = result.getValue({ name: 'internalid' });
            var name = result.getValue({ name: 'custrecord_komponen_name' });
            
            komponenPendapatanSublist.addSelectOption({
                value: '',
                text: ''
            });
            komponenPendapatanSublist.addSelectOption({
                value: id,
                text: name
            });
        
            return true;
        });
        // komponenPendapatan.addField({
        //     id: 'custpage_komponen_name',
        //     type: serverWidget.FieldType.TEXT,
        //     label: 'Nama Komponen'
        // });

        var komponenPemotongan = form.addSublist({
            id: 'custrecord_komponen_potongan',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'Komponen Potongan'
          });
        var komponenPotonganSub =  komponenPemotongan.addField({
              id: 'custpage_komponen_potongan_name',
              type: serverWidget.FieldType.SELECT,
              source : '',
              label: 'Nama Komponen'
          });
          var komponenpotonganSearch = search.create({
            type : 'customrecord_abj_komponen_potongan',
            columns : ['internalid', 'custrecord_potongan_name'], 
        });
        var resultPotongan = komponenpotonganSearch.run();
        resultPotongan.each(function(result){
            var idPotongan = result.getValue({ name: 'internalid'});
            var namaPotongan = result.getValue({ name: 'custrecord_potongan_name'});

            komponenPotonganSub.addSelectOption({
                value: '',
                text: ''
            });
            komponenPotonganSub.addSelectOption({
                value: idPotongan,
                text: namaPotongan
            });
        
            return true;

        }
        
        )
          form.addSubmitButton({
            label: 'Simpan'
        });
        form.clientScriptModulePath = 'SuiteScripts/abj_cs_slip_gaji.js';
        context.response.writePage(form);
      }
    }
  
    return {
      onRequest: onRequest
    };
});
