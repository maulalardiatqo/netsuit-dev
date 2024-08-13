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
            if(context.sublistId === 'item'){
                console.log('sublist adalah item');
                var currentId = currentRecordObj.getValue('id');
                console.log('currentId', currentId)
                var soNumber = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_no_so'
                });
                var itemLine = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });
                var id_line = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'id'
                });
                console.log('soNumber', soNumber);
                if(soNumber == ''){
                    return true
                }
                var countLine = currentRecordObj.getLineCount({ sublistId: 'item' });
                // cek 1
                
                var arrSoNumber = [];
                var arrItem = [];
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    filters: [
                        ["type","anyof","PurchOrd"], 
                        "AND", 
                        ["customform","anyof","138"], 
                        "AND", 
                        ["custcol_abj_no_so","noneof","@NONE@"]
                    ],
                    columns: [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custcol_abj_no_so", label: "No SO"}),
                        search.createColumn({name: "item", label: "Item"})
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
                    var itemId = result.getValue({
                        name: "item"
                    })
                    console.log('internalid', internalId)
                    if(internalId == currentId){
                        cekValidasi = false
                    }
                    arrSoNumber.push(numberSO)
                    arrItem.push(itemId)
                    return true;
                });
                console.log('arrSoNumber', arrSoNumber);
                console.log('cekValidasi', cekValidasi)
                var isSoNumberExist = arrSoNumber.indexOf(soNumber) !== -1;
                var isItemExist = arrItem.indexOf(itemLine) !== -1;
                console.log('Apakah soNumber ada di dalam arrSoNumber?', isSoNumberExist);
                if (countLine > 0) {
                    for (var i = 0; i < countLine; i++) {
                        var cekSo = currentRecordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_abj_no_so',
                            line: i
                        });
                        var cekItem = currentRecordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        console.log('cekSo', cekSo);
                        if(cekValidasi == false){
                            var cekLineId = currentRecordObj.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'id',
                                line: i
                            });
                            log.debug('id_line', id_line)
                            log.debug('cekLineId', cekLineId)
                            if(id_line == cekLineId){
                                console.log('cek line id sama')
                                return true
                            }else{
                                if (cekSo === soNumber) {
                                    if(cekItem === itemLine){
                                        alert('Duplicated Sales Order Number!');
                                        return false;
                                    }
                                    
                                }
                            }
                            
                        }else{
                            if (cekSo === soNumber) {
                                if(cekItem === itemLine){
                                    alert('Duplicated Sales Order Number!');
                                    return false;
                                }
                                
                            }else{
                                return true;
                            }
                            
                        }
                        
                    }
                }
                if(cekValidasi == true){
                    if (isSoNumberExist) {
                        if(isItemExist){
                            alert('Duplicated Sales Order Number!');
                            return false;
                        }else{
                            return true;
                        }
                        
                    } else {
                        return true;
                    }
                }else{
                    return true;
                }
            
            }
            if(context.sublistId === 'recmachcustrecord_iss_pr_parent'){
                console.log('sublist id adalah recmach')
                var currentId = currentRecordObj.getValue('id');
                console.log('currentId', currentId)
                var soNumber = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iss_pr_parent',
                    fieldId: 'custrecord_iss_no_po'
                });
                var itemLine = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iss_pr_parent',
                    fieldId: 'custrecord_iss_pr_item'
                });
                var id_line = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iss_pr_parent',
                    fieldId: 'id'
                });
                console.log('soNumber', soNumber);
                if(soNumber == ''){
                    return true
                }
                var countLine = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                var arrSoNumber = [];
                var arrItem = [];
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    filters:
                    [
                        ["type","anyof","PurchOrd"], 
                        "AND", 
                        ["customform","anyof","138"], 
                        "AND", 
                        ["custrecord_iss_pr_parent.custrecord_iss_no_po","noneof","@NONE@"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({
                            name: "custrecord_iss_no_po",
                            join: "CUSTRECORD_ISS_PR_PARENT",
                            label: "No SO"
                        }),
                        search.createColumn({
                            name: "custrecord_iss_pr_item",
                            join: "CUSTRECORD_ISS_PR_PARENT",
                            label: "Item"
                         })
                    ]
                });
                var searchResultCount = purchaseorderSearchObj.runPaged().count;
                log.debug("purchaseorderSearchObj result count",searchResultCount);
                var cekValidasi = true
                purchaseorderSearchObj.run().each(function(result){
                    var numberSO = result.getValue({
                        name: "custrecord_iss_no_po",
                        join: "CUSTRECORD_ISS_PR_PARENT",
                    });
                    var internalId = result.getValue({
                        name: 'internalid'
                    });
                    var itemSavedId = result.getValue({
                        name: "custrecord_iss_pr_item",
                            join: "CUSTRECORD_ISS_PR_PARENT",
                    });
                    console.log('internalid', internalId)
                    if(internalId == currentId){
                        cekValidasi = false
                    }
                    arrSoNumber.push(numberSO)
                    arrItem.push(itemSavedId)
                    return true;
                });
                console.log('arrSoNumber', arrSoNumber)
                var isSoNumberExist = arrSoNumber.indexOf(soNumber) !== -1;
                var isItemExist = arrItem.indexOf(itemLine) !== -1;
                console.log('Apakah soNumber ada di dalam arrSoNumber?', isSoNumberExist);
                if (countLine > 0) {
                    for (var i = 0; i < countLine; i++) {
                        var cekSo = currentRecordObj.getSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_no_po',
                            line: i
                        });
                        var cekItem = currentRecordObj.getSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_pr_item',
                            line: i
                        });
                        console.log('cekSo', cekSo);
                        
                        if(cekValidasi == false){
                            var cekLineId = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'id',
                                line: i
                            });
                            log.debug('id_line', id_line)
                            log.debug('cekLineId', cekLineId)
                            if(id_line == cekLineId){
                                console.log('cek line id sama')
                                return true
                            }else{
                                if (cekSo === soNumber) {
                                    if(cekItem === itemLine){
                                        alert('Duplicated Sales Order Number!');
                                        return false;
                                    }
                                    
                                }
                            }
                            
                        }else{
                            if (cekSo === soNumber) {
                                if(cekItem === itemLine){
                                    alert('Duplicated Sales Order Number!');
                                    return false;
                                }
                            }else{
                                return true;
                            }
                            
                        }
                        
                        
                    }
                }
                if(cekValidasi == true){
                    if (isSoNumberExist) {
                        if(isItemExist){
                            alert('Duplicated Sales Order Number!');
                            return false;
                        }
                        
                    } else {
                        return true;
                    }
                }else{
                    return true;
                }
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