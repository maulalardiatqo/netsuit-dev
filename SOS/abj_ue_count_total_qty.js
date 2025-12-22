/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const recType = newRec.type;
                const recId = newRec.id;

                const rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                var lineCount = rec.getLineCount({ sublistId: 'item' });
                for (let i = 0; i < lineCount; i++) {
                    var item = rec.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'item',
                        line : i
                    });
                    log.debug('item', item)
                    if(item){
                        
                        var fieldLookUpBank = search.lookupFields({
                            type: "ACCOUNT",
                            id: account,
                            columns: ["baserecordtype"],
                        });
                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});