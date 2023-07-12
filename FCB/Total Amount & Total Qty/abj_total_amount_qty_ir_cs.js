/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/currentRecord'], function(currentRecord) {
    var exports = {};
    function calculateTotals() {
    var currentRecordObj = currentRecord.get();
    var itemCount = currentRecordObj.getLineCount({ sublistId: 'item' });
    var totalAmount = 0;
    var totalQuantity = 0;
    
    for (var i = 0; i < itemCount; i++) {
        var amount = currentRecordObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_grr_amount', line: i });
        var quantity = currentRecordObj.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
        console.log('quantity', quantity);
        console.log('amount', amount);
            if (!isNaN(amount)) {
                totalAmount += amount;
            }
        
            if (!isNaN(quantity)) {
                totalQuantity += quantity;
            }
        }
        console.log('totalQuantity', totalQuantity);
        console.log('totalAmount', totalAmount);
        currentRecordObj.setValue({ fieldId: 'custbodycustbody_total_amount', value: totalAmount });
        currentRecordObj.setValue({ fieldId: 'custbody_total_quantity', value: totalQuantity });
    }
    
    function pageInit(context) {
        calculateTotals();
    }
    
    function sublistChanged(context) {
        if (context.sublistId === 'item') {
            console.log('fieldChanged');
            calculateTotals();
        return true;
        }
    }
    
    exports.pageInit = pageInit;
    exports.sublistChanged = sublistChanged;
    return exports
    });
