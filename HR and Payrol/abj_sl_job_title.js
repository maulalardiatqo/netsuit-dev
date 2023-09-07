/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/record'], function(serverWidget, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Form Job Title'
            });

            var namaBagianField = form.addField({
                id: 'custpage_nama_job_teitle',
                label: 'Nama Job Title',
                type: serverWidget.FieldType.TEXT
            });

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var namaJobTitle = context.request.parameters.custpage_nama_job_teitle;
            log.debug('namaJobTitle', namaJobTitle);
            try{
                if (!namaJobTitle) {
                    context.response.write('Nama Job Title tidak boleh kosong.');
                    return;
                }
    
                var jobTitleRecord = record.create({
                    type: 'customrecord_abj_job_title',
                    isDynamic: true
                });
    
                jobTitleRecord.setValue({
                    fieldId: 'custrecord_job_title',
                    value: namaJobTitle
                });
    
                var jobTitleRecordId = jobTitleRecord.save();
    
                context.response.write('Catatan Bagian baru telah dibuat dengan ID: ' + jobTitleRecordId);
            }catch(e){
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
