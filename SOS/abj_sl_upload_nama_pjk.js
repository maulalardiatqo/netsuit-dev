/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/file', 'N/record'], function (serverWidget, file, record) {

    function onRequest(context) {
        if (context.request.method === 'GET') {

            var form = serverWidget.createForm({
                title: 'Import CSV Nama & Kode Pajak'
            });

            form.addField({
                id: 'custpage_csvfile',
                type: serverWidget.FieldType.FILE,
                label: 'Upload CSV'
            }).isMandatory = true;

            form.addSubmitButton('Import CSV');
            context.response.writePage(form);

        } else {

            var csvFile = context.request.files.custpage_csvfile;
            var content = csvFile.getContents();
            var lines = content.split(/\r?\n/);

            // header
            lines.shift();

            var created = [];

            lines.forEach(function (line) {
                if (!line.trim()) return;

                var parts = line.split(',');

                var nameVal = parts[0] ? parts[0].trim() : '';
                var kodePajakVal = parts[1] ? parts[1].trim() : '';

                // create record
                var rec = record.create({
                    type: 'customrecord_nama_kode_pajak',
                    isDynamic: true
                });

                // set NAME field
                rec.setValue({
                    fieldId: 'name',
                    value: nameVal
                });

                // set KODE PAJAK
                rec.setValue({
                    fieldId: 'custrecord_kode_pajak',
                    value: kodePajakVal
                });

                var id = rec.save();
                created.push(id);
            });

            var form = serverWidget.createForm({
                title: 'Import Completed'
            });

            form.addField({
                id: 'custpage_msg',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Result'
            }).defaultValue = `
                <p style="color:green;">
                    Import selesai.<br>
                    Total data dibuat: <b>${created.length}</b><br>
                    ID baru: ${created.join(', ')}
                </p>
            `;

            context.response.writePage(form);
        }
    }

    return { onRequest };
});
