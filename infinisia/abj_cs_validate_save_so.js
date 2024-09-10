/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/record', 'N/search'], function (message, record, search) {

    function saveRecord(context) {
        try {
            var currentRecord = context.currentRecord;
            var idSo = currentRecord.getValue('id');
            console.log('internalid', idSo)
            var isHaveFile
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                    ["type","anyof","SalesOrd"], 
                    "AND", 
                    ["mainline","is","T"], 
                    "AND", 
                    ["internalid","anyof",idSo]
                ],
                columns:
                [
                    search.createColumn({name: "tranid", label: "Document Number"}),
                    search.createColumn({
                        name: "formulatext",
                        formula: "case when {file.internalid} is Null then '0' Else '1' End",
                        label: "is have file"
                    })
                ]
            });
            var searchResult = salesorderSearchObj.run().getRange({start: 0, end: 1});
            if (searchResult.length > 0) {
                var file = searchResult[0].getValue({
                    name: "formulatext",
                    formula: "case when {file.internalid} is Null then '0' Else '1' End",
                });
                console.log('file', file)
                if(file){
                    isHaveFile = file
                }
            } 
            if(isHaveFile == '0'){
                alert('harap lampirkan dokumen PO Customer terlebih dahulu');
                return false
            }else{
                return true
            }
        } catch (error) {
            console.error('Error validating attached file:', error);
            return false;
        }
    }

    return {
        saveRecord: saveRecord
    };
});
