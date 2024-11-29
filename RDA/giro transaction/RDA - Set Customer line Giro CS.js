/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/log', 'N/search', 'N/record'], function (currentRecord, log, search, record) {
    var currentRecordObj = currentRecord.get();
    function pageInit(context) {
        log.debug('test page')
    }
    
    function fieldChanged(context){
        var fieldNam = context.fieldId;
        if (fieldNam == 'custbody_rda_giro_customer') {
            console.log('trigerred')
            var rec = currentRecord.get();

            var custId = rec.getValue('custbody_rda_giro_customer');
            console.log('custId', custId)
            if(custId){
                setSublist(custId)
            }
        }
        
    }
    function setSublist(custId){
        currentRecordObj.selectNewLine({ sublistId: 'recmachcustrecord_rda_giro_id' });
        currentRecordObj.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_rda_giro_id',
            fieldId: 'custrecord_rda_girodetail_customer',
            value: custId
        });
        currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_rda_giro_id' });
    }
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
