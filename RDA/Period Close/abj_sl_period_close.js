/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message'], function (serverWidget, task, search, log, record, message) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            log.debug('masuk')
            var form = serverWidget.createForm({
                title: 'Generate Accounting And Tax Period'
            });
            
            
            form.addSubmitButton({
                label: 'Generate'
            });
            context.response.writePage(form);

        } else {
            try{
                    var id = 122
                    var recLoad = record.load({
                        type: "accountingperiod",
                        id : id
                    });
                    recLoad.setValue({
                        fieldId : "aplocked",
                        value : true
                    })
                    var save = recLoad.save();
                    log.debug('save', save)
                
            }catch(e){
                log.debug('error', e)
            }
           

        }
    }

    return {
        onRequest: onRequest
    };
});