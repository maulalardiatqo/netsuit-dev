/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    function validateLine(context) {
        var currentRecordObj = context.currentRecord;
        var cForm = currentRecordObj.getValue('customform');
        if(cForm == '138'){
            var currentId = currentRecordObj.getValue('id');
            console.log('currentId', currentId)
            var soNumber = currentRecordObj.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_abj_sales_order_number'
            });
            console.log('soNumber', soNumber);
            if(soNumber == ''){
                return true
            }
            var countLine = currentRecordObj.getLineCount({ sublistId: 'item' });
            // cek 1
            
            var arrSoNumber = [];
            var purchaseorderSearchObj = search.create({
                type: "purchaseorder",
                filters: [
                    ["type", "anyof", "PurchOrd"],
                    "AND",
                    ["customform", "anyof", "138"],
                    "AND",
                    ["custcol_abj_sales_order_number", "isnotempty", ""]
                ],
                columns: [
                    search.createColumn({ name: "internalid" }),
                    search.createColumn({ name: "custcol_abj_sales_order_number", label: "ABJ - Sales Order Number" })
                ]
            });
            var searchResultCount = purchaseorderSearchObj.runPaged().count;
            log.debug("purchaseorderSearchObj result count", searchResultCount);
            var cekValidasi = true
            purchaseorderSearchObj.run().each(function(result) {
                var numberSO = result.getValue({
                    name: 'custcol_abj_sales_order_number'
                });
                var internalId = result.getValue({
                    name: 'internalid'
                });
                console.log('internalid', internalId)
                if(internalId == currentId){
                    cekValidasi = false
                }
                
                return true;
            });
            var isSoNumberExist = arrSoNumber.indexOf(soNumber) !== -1;
            console.log('Apakah soNumber ada di dalam arrSoNumber?', isSoNumberExist);
            if (countLine > 0) {
                for (var i = 0; i < countLine; i++) {
                    var cekSo = currentRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_sales_order_number',
                        line: i
                    });
                    console.log('cekSo', cekSo);
                    if(cekValidasi == true){
                        if (cekSo === soNumber) {
                            alert('Duplicated Sales Order Number!');
                            return false;
                        }
                    }else{
                        return true;
                    }
                    
                }
            }
            if(cekValidasi == true){
                if (isSoNumberExist) {
                    alert('Duplicated Sales Order Number!');
                    return false;
                } else {
                    return true;
                }
            }else{
                return true;
            }
            
        }else{
            return true
        }
        
    }
    return {
        pageInit: pageInit,
        validateLine : validateLine
    };
});