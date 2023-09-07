/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/record'], function(serverWidget, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Form Bagian'
            });

            var namaBagianField = form.addField({
                id: 'custpage_nama_bagian',
                label: 'Nama Bagian',
                type: serverWidget.FieldType.TEXT
            });

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var namaBagian = context.request.parameters.custpage_nama_bagian;
            log.debug('nama_bagian', namaBagian);
            try{
                if (!namaBagian) {
                    context.response.write('Nama Bagian tidak boleh kosong.');
                    return;
                }
    
                var bagianRecord = record.create({
                    type: 'customrecord_bagian',
                    isDynamic: true
                });
    
                bagianRecord.setValue({
                    fieldId: 'custrecord_bagian_name',
                    value: namaBagian
                });
    
                var bagianRecordId = bagianRecord.save();
    
                context.response.write('Catatan Bagian baru telah dibuat dengan ID: ' + bagianRecordId);
            }catch(e){
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
