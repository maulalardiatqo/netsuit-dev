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
        var amount = currentRecordObj.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
        var quantity = currentRecordObj.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
        console.log('quantity', quantity);
        console.log('amount', amount);
        if (!isNaN(amount)) {
            totalAmount += amount;
        }
        if (!isNaN(quantity)) {
            totalQuantity += quantity;
        }
    

    }
    
    console.log('total quantity', totalQuantity);
    console.log('total amount', totalAmount);
    currentRecordObj.setValue({ fieldId: 'custbodycustbody_total_amount', value: totalAmount.toFixed(2) });
    currentRecordObj.setValue({ fieldId: 'custbody_total_quantity', value: totalQuantity.toFixed(2) });
}

function pageInit(context) {
    // calculateTotals();
    // window.alert('Real Time');
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
