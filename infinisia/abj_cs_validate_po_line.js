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


            var employee_id = currentRecordObj.getValue('employee') || null;
            console.log('employee_id', employee_id);

            // var is_saleprep = false;
            // var salesRepId 
            // if (employee_id == null) {
            //     var user_id = runtime.getCurrentUser().id || null;
            //     console.log('user_id', user_id);
            //     var fieldLookUp = search.lookupFields({
            //         type: search.Type.EMPLOYEE,
            //         id: user_id,
            //         columns: ['issalesrep']
            //     });
            //     console.log('fieldLookUp', fieldLookUp);
            //     is_saleprep = fieldLookUp.issalesrep;
            //     if(is_saleprep == true){
            //         salesRepId = user_id
            //     }
            // } else {
            //     var fieldLookUp = search.lookupFields({
            //         type: search.Type.EMPLOYEE,
            //         id: employee_id,
            //         columns: ['issalesrep']
            //     });
            //     console.log('fieldLookUp', fieldLookUp);
            //     is_saleprep = fieldLookUp.issalesrep;
            //     if(is_saleprep == true){
            //         salesRepId = employee_id
            //     }
            // }
            // console.log('is_saleprep', is_saleprep)

            var soNumber = currentRecordObj.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_abj_no_so'
            });
            console.log('soNumber', soNumber);
            // if(is_saleprep == true){
            //     if(soNumber == ''){
            //         alert('employee is salesrep, please fill the No SO line Column');
            //         return false
            //     }
            // }else{
            //     if(soNumber == ''){
            //         return true
            //     }
            // }
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
                    ["custcol_abj_no_so", "isnotempty", ""]
                ],
                columns: [
                    search.createColumn({ name: "internalid" }),
                    search.createColumn({ name: "custcol_abj_no_so", label: "ABJ - Sales Order Number" })
                ]
            });
            var searchResultCount = purchaseorderSearchObj.runPaged().count;
            log.debug("purchaseorderSearchObj result count", searchResultCount);
            var cekValidasi = true
            purchaseorderSearchObj.run().each(function(result) {
                var numberSO = result.getValue({
                    name: 'custcol_abj_no_so'
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
                        fieldId: 'custcol_abj_no_so',
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