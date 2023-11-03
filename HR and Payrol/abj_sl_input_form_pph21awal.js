/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file"
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file
){
    
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "Upload Masal PPh 21/26 Awal",
        });
        try{
            if (context.request.method === 'GET') {
                var choseFile = form.addField({
                    id: 'custpage_pph_select_month',
                    type: serverWidget.FieldType.FILE,
                    label: 'Pilih File',
                });
                form.addSubmitButton({
                    label: 'Upload File'
                });
                context.response.writePage(form);
            }else{

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        onRequest: onRequest
    };
});