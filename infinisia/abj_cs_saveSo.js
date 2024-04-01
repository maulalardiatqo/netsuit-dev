/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/record', 'N/search', 'N/ui/dialog'], function(record, search, dialog) {
    
    function validateOtherRefNum(context) {
        var currentRecord = context.currentRecord;
        var otherRefNum = currentRecord.getValue({
            fieldId: 'otherrefnum'
        });
        console.log('otherRefNum', otherRefNum)

        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters:
            [
                ["type", "anyof", "SalesOrd"],
                "AND",
                ["otherrefnum","isnotempty",""],
                "AND", 
                ["otherrefnum", "is", otherRefNum]
      
            ],
            columns:
            [
                search.createColumn({name: "otherrefnum", label: "PO/Check Number"})
            ]
        });
        
        var searchResultCount = salesorderSearchObj.runPaged().count;
        console.log("salesorderSearchObj result count", searchResultCount);
        
        if (searchResultCount > 0) {
            dialog.alert({
                title: 'Duplicate Reference Number',
                message: 'The reference number entered already exists in another sales order.'
            });
            return false; 
        }

        return true; 
    }

    function saveRecord(context) {
        if (validateOtherRefNum(context)) {
            return true; 
        } else {
            return false;
        }
    }

    return {
        saveRecord: saveRecord
    };
});
