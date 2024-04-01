/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/message', 'N/error'],

function(search, message, error) {
    function showError(otherRefNum){
        log.debug('masuk searchCOunt')
        var myCustomError = error.create({
            name: 'PO/Customer# Already Exist',
            message: 'PO/Customer# '+otherRefNum+ ' already exist in Sales Order.' ,
            notifyOff: false
        });
        throw myCustomError.name + '<br \><br \>' + myCustomError.message + '<br \><br \>';
    }

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE) {
            var newRecord = context.newRecord;
            var otherRefNum = newRecord.getValue({
                fieldId: 'otherrefnum'
            });
            log.debug('otherRefNum', otherRefNum)
            if (otherRefNum) {
                log.debug('masuk kondisi')
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters: [
                        ["type","anyof","SalesOrd"], 
                        "AND", 
                        ["otherrefnum","isnotempty",""], 
                        "AND", 
                        ["otherrefnum","equalto",otherRefNum]
                    ],
                    columns: [
                        search.createColumn({
                            name: "otherrefnum",
                            label: "PO/Check Number"
                        })
                    ]
                });
    
                var searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug('searchResultCount', searchResultCount)
                if (searchResultCount > 0) {
                    showError(otherRefNum);
                }
            }
        }
        
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
