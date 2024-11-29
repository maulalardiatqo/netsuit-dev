/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var currentRecordObj = currentRecord.get();

    function pageInit(context) {
        console.log('test')
    }

    function validateLine(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;
            
            

            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) + Number(amtLine);
            log.debug('total after add line', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true; 
    }
    function lineInit(context) {

        if (context.sublistId === 'recmachcustrecord_rda_giro_id') {
            var headerCustomer = currentRecordObj.getValue('custbody_rda_giro_customer')
            log.debug('headerCustomer', headerCustomer)
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rda_giro_id',
                fieldId: 'custrecord_rda_girodetail_customer',
                value: headerCustomer
            });

            log.debug('Line Initialized', 'Set custrecord_rda_girodetail_customer to 24');
        }

        return true;
    }
    function validateDelete(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;

           
            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) - Number(amtLine);
            log.debug('total after delete', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true;
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
        // currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_rda_giro_id' });
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
        fieldChanged : fieldChanged,
        lineInit : lineInit
    };
});
