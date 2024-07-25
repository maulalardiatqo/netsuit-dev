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
    function validasiLine(context) {
        var currentRecordObj = context.currentRecord;
        var cForm = currentRecordObj.getValue('customform');
        var currentId = currentRecordObj.getValue('id');
        console.log('currentId', currentId);
        if (cForm == '138') {
            var countLine = currentRecordObj.getLineCount({
                sublistId: 'item'
            });
            if (countLine > 0) {
                var allSoInPO = [];
                for (var index = 0; index < countLine; index++) {
                    var soNo = currentRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_no_so',
                        line: index
                    });
                    var forCase = currentRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol9',
                        line: index
                    })
                    console.log('soNo', soNo);
                    console.log('forCase', forCase);
                    if(!soNo && forCase == 0 || !forCase){
                        alert('Please fill in the Forecast Buffer Busdev field if the No SO field is empty');
                        return false;
                    }
                    if(!soNo && forCase > 0 || forCase){
                        console.log('lolos validasi')
                    }else{
                        allSoInPO.push({
                            currentId : currentId,
                            soNo : soNo
                        });
                    }
                    
                }
                console.log('allSOinPO', allSoInPO);
    
                // Check for duplicates within allSoInPO
                var uniqueSoInPO = new Set(allSoInPO);
                if (uniqueSoInPO.size !== allSoInPO.length) {
                    alert('Duplicated SO NO');
                    return false;
                }
    
                var arrSoNumber = [];
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    filters: [
                        ["type", "anyof", "PurchOrd"],
                        "AND",
                        ["customform", "anyof", "138"],
                        "AND",
                        ["custcol_abj_no_so", "noneof", "@NONE@"]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_abj_no_so", label: "ABJ - Sales Order Number" })
                    ]
                });
                var searchResultCount = purchaseorderSearchObj.runPaged().count;
                purchaseorderSearchObj.run().each(function (result) {
                    var idFormSavedSearch = result.getValue({
                        name: "internalid"
                    })
                    var numberSO = result.getValue({
                        name: 'custcol_abj_no_so'
                    });
                    arrSoNumber.push({
                        idFormSavedSearch : idFormSavedSearch,
                        numberSO : numberSO
                    });
                    return true;
                });
                console.log('arrSoNumber', arrSoNumber);
    
                for (var so of allSoInPO) {
                    for (var savedRecord of arrSoNumber) {
                        if (so === savedRecord.numberSO && currentId !== savedRecord.idFromSavedSearch) {
                            alert('Ada data yang sama antara allSoInPO dan arrSoNumber');
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    
    function saveRecord(context) {
        console.log('masuk function save');
        if (validasiLine(context)) {
            return true;
        } else {
            return false;
        }
    }
    return {
        pageInit: pageInit,
        saveRecord : saveRecord
    };
});