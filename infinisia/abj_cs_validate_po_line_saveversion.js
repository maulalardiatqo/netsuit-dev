/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    function pageInit(context) {
       log.debug('init masuk');
    }

    function saveRecord(context) {
        var currentRecordObj = context.currentRecord;
        var cForm = currentRecordObj.getValue('customform');
       log.debug('cForm', cForm)
        if (cForm == '138') {
            var countLine = currentRecordObj.getLineCount({ sublistId: 'item' });
            var currentId = currentRecordObj.getValue('id');
            var allDataItem = [];
            for (var i = 0; i < countLine; i++) {
                var soNumber = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_no_so',
                    line: i
                });
               log.debug('soNumber', soNumber)
                if(soNumber && soNumber != ""){
                    var soNumberText = currentRecordObj.getSublistText({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_no_so',
                        line: i
                    });
                    var itemLine = currentRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var itemLineText = currentRecordObj.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var packSizeSo = currentRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_pack_size_order',
                        line: i
                    });
                    var isDuplicateInAllDataItem = allDataItem.some(function (data) {
                        return data.soNumber === soNumber && data.itemLine === itemLine && data.packSizeSo === packSizeSo;
                    });
    
                    if (isDuplicateInAllDataItem) {
                       log.debug('isDuplicateInAllDataItem', {soNumberText : soNumberText, itemLineText : itemLineText})
                        alert('Duplicated Sales Order Number in Item Line');
                        return false;
                    }
                    allDataItem.push({
                        soNumber: soNumber,
                        itemLine : itemLine,
                        packSizeSo : packSizeSo
                    })
                   log.debug('allDataItem', allDataItem)
                    var cekSORec = soNumber + "-" + itemLine + "-" + packSizeSo;
    
                    if (soNumber === '') {
                        continue; 
                    }
    
                    var arrSoNumber = [];
                    var arrItem = [];
                    var cekValidasi = true
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
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custcol_abj_no_so", label: "No SO" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "custcol_abj_pack_size_order", label: "Pack Size" })
                        ]
                    });
                    purchaseorderSearchObj.run().each(function (result) {
                        var numberSO = result.getValue({ name: 'custcol_abj_no_so' });
                        var itemId = result.getValue({ name: "item" });
                        var packSizeSoSearch = result.getValue({ name: "custcol_abj_pack_size_order" });
                        var internalId = result.getValue({
                            name: 'internalid'
                        });
                        if(internalId == currentId){
                            cekValidasi = false
                        }
    
                        var soCekSearch = numberSO + "-" + itemId + "-" + packSizeSoSearch;
                        arrSoNumber.push(soCekSearch);
                        arrItem.push(itemId);
    
                        return true;
                    });
                   log.debug('arrSoNumber', arrSoNumber)
                    var isSoNumberExist = arrSoNumber.indexOf(cekSORec) !== -1;
                   log.debug('isSoNumberExist', isSoNumberExist)
                    if (isSoNumberExist) {
                        if(cekValidasi == true){
                            alert('Duplicated Sales Order Number In item Line!');
                            return false;  
                        }
                       
                    }
                }
                
            }

            var countRecMachLine = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_iss_pr_parent' });
            var allDataPRSum = [];
            for (var j = 0; j < countRecMachLine; j++) {
                var soNumberRecMach = currentRecordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_iss_pr_parent',
                    fieldId: 'custrecord_iss_no_po',
                    line: j
                });
                var itemLineRecMach = currentRecordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_iss_pr_parent',
                    fieldId: 'custrecord_iss_pr_item',
                    line: j
                });
                var cekSORecMach = soNumberRecMach + "-" + itemLineRecMach;

                var isDuplicateInAllDataPRSum = allDataItem.some(function (data) {
                    return data.soNumberRecMach === soNumberRecMach && data.itemLineRecMach === itemLineRecMach
                });

                if (isDuplicateInAllDataPRSum) {
                    alert('Duplicated Sales Order Number in Item Line');
                    return false;
                }
                allDataPRSum.push({
                    soNumberRecMach : soNumberRecMach,
                    itemLineRecMach : itemLineRecMach
                })

                if (soNumberRecMach === '') {
                    continue;
                }

                var arrSoNumberRecMach = [];
                var arrItemRecMach = [];
                var cekValidasiPRSum = true
                var purchaseorderRecMachSearchObj = search.create({
                    type: "purchaseorder",
                    filters: [
                        ["type", "anyof", "PurchOrd"],
                        "AND",
                        ["customform", "anyof", "138"],
                        "AND",
                        ["custrecord_iss_pr_parent.custrecord_iss_no_po", "noneof", "@NONE@"]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
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

                purchaseorderRecMachSearchObj.run().each(function (result) {
                    var numberSORecMach = result.getValue({
                        name: "custrecord_iss_no_po",
                        join: "CUSTRECORD_ISS_PR_PARENT",
                    });
                    var itemSavedIdRecMach = result.getValue({
                        name: "custrecord_iss_pr_item",
                        join: "CUSTRECORD_ISS_PR_PARENT",
                    });
                    var internalId = result.getValue({
                        name: 'internalid'
                    });
                    if(internalId == currentId){
                        cekValidasiPRSum = false
                    }
                    var soCekSearchRecMach = numberSORecMach + "-" + itemSavedIdRecMach;
                    arrSoNumberRecMach.push(soCekSearchRecMach);
                    arrItemRecMach.push(itemSavedIdRecMach);

                    return true;
                });

                var isSoNumberExistRecMach = arrSoNumberRecMach.indexOf(cekSORecMach) !== -1;

                if (isSoNumberExistRecMach) {
                    if(cekValidasiPRSum == true){
                        alert('Duplicated Sales Order Number in PR summary Line!');
                        return false;
                    }
                    
                }
            }
        }else{
           log.debug('masuk else')
            return true
        }

        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});
