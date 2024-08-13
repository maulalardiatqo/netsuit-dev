/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define ([], () => {
    function pageInit(context) {
      
        var currentRecord = context.currentRecord;
        var lineCount = currentRecord.getLineCount({
            sublistId: 'item' 
        });

        for (var i = 0; i < lineCount; i++) {
            currentRecord.getSublistField({
                sublistId: 'item',
                fieldId: 'custcol_abj_no_so',
                line: i
            }).isDisabled = true;

            currentRecord.getSublistField({
                sublistId: 'item',
                fieldId: 'custcol_abj_customer_line',
                line: i
            }).isDisabled = true;

            currentRecord.getSublistField({
                sublistId: 'item',
                fieldId: 'custcol_abj_sales_rep_line',
                line: i
            }).isDisabled = true;
        }
        
    }
    
    return {
        pageInit: pageInit
    };
}); 