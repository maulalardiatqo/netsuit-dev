/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/record'], function (serverWidget, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Form Komponen Pendapatan'
            });

            var namaPendapatanField = form.addField({
                id: 'custpage_nama_pendapatan',
                type: serverWidget.FieldType.TEXT,
                label: 'Nama Pendapatan'
            });

            var tipeField = form.addField({
                id: 'custpage_tipe',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipe',
                source: 'customlist_tipe_pendapatan' 
            });

            tipeField.addSelectOption({
                value: 'tetap',
                text: 'Jumlah Tetap'
            });
            tipeField.addSelectOption({
                value: 'kehadiran',
                text: 'Tergantung Kehadiran'
            });
            tipeField.addSelectOption({
                value: 'output',
                text: 'Tergantung Output'
            });
            tipeField.addSelectOption({
                value: 'manual',
                text: 'Manual'
            });

            var pph21Field = form.addField({
                id: 'custpage_pph21',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Apakah Komponen ini Terpotong PPh 21'
            });

            var tipeA1Field = form.addField({
                id: 'custpage_tipe_a1',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipe A1',
                source: 'customlist_tipe_a1' 
            });

            tipeA1Field.addSelectOption({
                value: 'tunjangan',
                text: 'Tunjangan Lainya, Uang Lembur, dsb.'
            });
            tipeA1Field.addSelectOption({
                value: 'honorarium',
                text: 'Honorariom dan Imbalan Lain'
            });
            tipeA1Field.addSelectOption({
                value: 'asuransi',
                text: 'Premi Asuransi Yang Dibayar Pemberi Kerja'
            });
            tipeA1Field.addSelectOption({
                value: 'natura',
                text: 'Penerimaan Dalam Bentuk Natura'
            });
              form.clientScriptModulePath = 'SuiteScripts/abj_cs_field_komponen.js';
              
            form.addSubmitButton({
                label: 'Simpan'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var namaPendapatan = context.request.parameters.custpage_nama_pendapatan;
            var tipe = context.request.parameters.custpage_tipe;
            var pph21 = context.request.parameters.custpage_pph21 === 'T';
            var tipeA1 = context.request.parameters.custpage_tipe_a1;

            var komponenPendapatanRecord = record.create({
                type: 'customrecord_komponen_pendapatan'
            });

            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_komponen_name',
                value: namaPendapatan
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_komponen_type',
                value: tipe
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_is_pph_21',
                value: pph21
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_tipe_pajak',
                value: tipeA1
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_komponen_status',
                value: true
            });

            var komponenPendapatanId = komponenPendapatanRecord.save();

            context.response.write('Komponen Pendapatan berhasil disimpan dengan ID: ' + komponenPendapatanId);
        }
    }

    return {
        onRequest: onRequest
    };
});
