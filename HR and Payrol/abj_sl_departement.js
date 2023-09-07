/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/record'], function(serverWidget, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Form Tambah Departement'
            });

            var namaBagianField = form.addField({
                id: 'custpage_nama_departement',
                label: 'Nama Departement',
                type: serverWidget.FieldType.TEXT
            });

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var namaJDepartement = context.request.parameters.custpage_nama_departement;
            log.debug('namaJDepartement', namaJDepartement);
            try{
                if (!namaJDepartement) {
                    context.response.write('Nama Job Title tidak boleh kosong.');
                    return;
                }
    
                var departementRecord = record.create({
                    type: 'customrecord_departement',
                    isDynamic: true
                });
    
                departementRecord.setValue({
                    fieldId: 'custrecord_nama_departement',
                    value: namaJDepartement
                });
    
                var departementRecordId = departementRecord.save();
    
                context.response.write('Catatan Bagian baru telah dibuat dengan ID: ' + departementRecordId);
            }catch(e){
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
