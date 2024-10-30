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
