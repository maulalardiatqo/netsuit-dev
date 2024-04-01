/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/message', 'N/error'],

function(search, message, error) {
    function showError(otherRefNumText){
        log.debug('masuk searchCOunt')
        var myCustomError = error.create({
            name: 'Delivery Order No Already Exist',
            message: 'Delivery Order No '+otherRefNumText+ ' already exist in Invoice.' ,
            notifyOff: false
        });
        throw myCustomError.name + '<br \><br \>' + myCustomError.message + '<br \><br \>';
    }

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE) {
            var newRecord = context.newRecord;
            var otherRefNum = newRecord.getValue({
                fieldId: 'custbody3'
            });
            
            log.debug('otherRefNum', otherRefNum)
            if (otherRefNum) {
                var otherRefNumText = newRecord.getText({
                    fieldId: 'custbody3'
                });
                log.debug('masuk kondisi')
                var salesorderSearchObj = search.create({
                    type: "invoice",
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["custbody3","noneof","@NONE@"], 
                        "AND", 
                        ["mainline","is","T"],
                        "AND",
                        ["custbody3","anyof",otherRefNum]
                    ],
                    columns:
                    [
                        search.createColumn({name: "custbody3", label: "Delivery Order No"})
                    ]
                });
    
                var searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug('searchResultCount', searchResultCount)
                if (searchResultCount > 0) {
                    showError(otherRefNumText);
                }
            }
        }
        
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
