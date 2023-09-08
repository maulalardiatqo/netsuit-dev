/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/record'], function (serverWidget, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Form Komponen Potongan'
            });

            var namaPendapatanField = form.addField({
                id: 'custpage_nama_potongan',
                type: serverWidget.FieldType.TEXT,
                label: 'Nama Potongan'
            });

            var tipeField = form.addField({
                id: 'custpage_tipe',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipe',
                source: 'customlist_tipe_potongan' 
            });

            tipeField.addSelectOption({
                value: 'tetap',
                text: 'Jumlah Tetap'
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
                label: 'Apakah Pengurangan PPh?'
            });
              
            form.addSubmitButton({
                label: 'Simpan'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var namaPendapatan = context.request.parameters.custpage_nama_potongan;
            var tipe = context.request.parameters.custpage_tipe;
            var pph21 = context.request.parameters.custpage_pph21;

            var komponenPendapatanRecord = record.create({
                type: 'customrecord_abj_komponen_potongan'
            });

            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_potongan_name',
                value: namaPendapatan
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_abj_type_potongan',
                value: tipe
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_pengurangan_pph',
                value: pph21
            });
            komponenPendapatanRecord.setValue({
                fieldId: 'custrecord_abj_status_potongan',
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
