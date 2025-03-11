/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log'], function (serverWidget, record, log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Collection Management'
            });
            form.addSubmitButton({
                label: 'Submit'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            try {
                var transactionUpdates = {
                    88621: 'DOT/RDA-008/250300022',
                    88622: 'DOT/RDA-008/250300023',
                    89113: 'DOK/RDA-012/250300011',
                    89117: 'DOT/RDA-012/250300021',
                    89125: 'DOT/RDA-012/250300022'
                };
                
                Object.keys(transactionUpdates).forEach(function (transactionId) {
                    var newDocNum = transactionUpdates[transactionId];
                    log.debug('newDocNum', newDocNum)
                    log.debug('transactionId', transactionId)
                    var rec = record.load({
                        type: "itemfulfillment",
                        id: transactionId,
                        isDynamic: true
                    });
                    
                    rec.setValue({
                        fieldId: 'tranid',
                        value: newDocNum,
                        ignoreFieldChange: true,
                    });
                    
                    rec.save();
                    log.debug('Updated Transaction', 'ID: ' + transactionId + ', New DocNum: ' + newDocNum);
                });
                
                context.response.write('Document numbers updated successfully');
            } catch (e) {
                log.error('Error updating transactions', e);
                context.response.write('Error updating document numbers: ' + e.message);
            }
        }
    }
    
    return {
        onRequest: onRequest
    };
});