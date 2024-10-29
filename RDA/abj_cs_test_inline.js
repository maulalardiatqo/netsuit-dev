/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search"],
    function(error,dialog,url,record,currentRecord,log, search) {
        function pageInit(context) {
            console.log("masuk client test");
            var currentRecord = context.currentRecord;
            var lineCount = currentRecord.getLineCount({ sublistId: 'item' });
    
            for (var i = 0; i < lineCount; i++) {
                var fieldElement = currentRecord.getSublistField({
                    sublistId: 'item',
                    fieldId: 'custcol_test_po_inline',
                    line: i
                });
                console.log('fieldElement', fieldElement)
                if (fieldElement) {
                    fieldElement.style.backgroundColor = 'yellow';
                }
            }
        }
        return {
            pageInit: pageInit,
        };
    }); 