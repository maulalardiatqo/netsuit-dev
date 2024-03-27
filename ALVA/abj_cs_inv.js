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
    function setItem(currentRecordObj, iteminCostom, amountLine){
        
        var itemExists = false;
        var itemCount = currentRecordObj.getLineCount({ sublistId: 'item' });
        console.log('itemCount', itemCount)
        if(itemCount > 0){
            for (var i = 0; i < itemCount; i++) {
                var existingItem = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var amount = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });
                console.log('existingItem', existingItem);
                
                if (existingItem == iteminCostom) {
                    
                    console.log('amount', amount)
                    console.log('amountLine', amountLine)
                    var newRate = parseFloat(amount) + parseFloat(amountLine)
                    console.log('newRate', newRate)
                    currentRecordObj.selectLine({
                        sublistId: "item",
                        line: i,
                      });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: newRate,
                    });
                    currentRecordObj.commitLine({ sublistId: 'item' });
                    itemExists = true;
                    break;
                    
                }
            }
        }
        
        if (!itemExists) {
            currentRecordObj.selectNewLine({ sublistId: 'item'})
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: iteminCostom
            });
            // console.log('terset setItem', setItem)
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: amountLine
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: '-1'
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'pricelevels',
                value: '-1'
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                value: amountLine
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                value: '5'
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'grossamt',
                value: amountLine
            });
            // console.log('terset setTax', setTax)
            currentRecordObj.commitLine({ sublistId: 'item' });
        }
    }
    function sublistChanged(context){
        var sublistId = context.sublistId;
        if (sublistId === 'recmachcustrecord_ajb_pembobotan_so_id'){
            var currentRecordObj = context.currentRecord;
            var typeTrans = currentRecordObj.getValue({
                fieldId :'type'
            });
            console.log('transType', typeTrans);
            
            var customForm = currentRecordObj.getValue({
                fieldId :'customform'
            });
            console.log('customForm', customForm);
            var subsidiary = currentRecordObj.getValue({
                fieldId :'subsidiary'
            });
            console.log('subsidiary', subsidiary);
            var isParent = false
            if(subsidiary){
                if(subsidiary != '46'){
                    var recSubs = record.load({
                        type : 'subsidiary',
                        id : subsidiary
                    });
                    var parent = recSubs.getValue('parent');
                    console.log('parent', parent)
                    if(parent ==  "46"){
                        isParent =true
                    }
                }else{
                    isParent = true
                }

            }
            if(typeTrans == 'invoice' || typeTrans == 'custinvc' && customForm == '137' && isParent == true){
                var countLine = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_ajb_pembobotan_so_id' });
                console.log('countLine', countLine);
                var iteminCostom = currentRecordObj.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_ajb_pembobotan_so_id',
                    fieldId : 'custrecord_abj_pembobotan_item'
                });
                var amountLine = currentRecordObj.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_ajb_pembobotan_so_id',
                    fieldId : 'custrecord_alva_fix_amount'
                });
                console.log('iteminCostom', iteminCostom)
                setItem(currentRecordObj, iteminCostom, amountLine);
            }
            
        }
    }
    
    // function fieldChanged(context) {
    //     if (context.sublistId === 'recmachcustrecord_ajb_pembobotan_so_id') {
    //         var currentRecord = context.currentRecord;
    //         var sublistFieldName = 'custrecord_abj_pembobotan_item';
    //         var amountFieldName = 'custrecord_alva_fix_amount';
    //         var percentageFieldName = 'custrecord_abj_pembobotan_persen';
    
    //         if (context.fieldId == amountFieldName) {
    //             var currentLine = context.line;
    
    //             var currentItem = currentRecord.getCurrentSublistValue({
    //                 sublistId: context.sublistId,
    //                 fieldId: sublistFieldName,
    //                 line: currentLine
    //             });
    
    //             var currentAmount = parseFloat(currentRecord.getCurrentSublistValue({
    //                 sublistId: context.sublistId,
    //                 fieldId: amountFieldName,
    //                 line: currentLine
    //             }));
    //             console.log('currentAmount', currentAmount)
    //             var totalAmount = 0;
    //             var totalPercentage = 0;
    //             var countLine = currentRecord.getLineCount({ sublistId: context.sublistId });
                
    //             if(countLine > 0){
    //                 for (var line = 0; line < countLine; line++) {
    //                     var item = currentRecord.getSublistValue({
    //                         sublistId: context.sublistId,
    //                         fieldId: sublistFieldName,
    //                         line: line
    //                     });
    //                     var amount = parseFloat(currentRecord.getSublistValue({
    //                         sublistId: context.sublistId,
    //                         fieldId: amountFieldName,
    //                         line: line
    //                     }));
    //                     console.log('amount', amount)
                        
    //                     if (item === currentItem) {
    //                         console.log('kondisi item = currrent item', {item : item, currentItem:currentItem })
                            
    //                         totalAmount = Number(currentAmount) + Number(amount)
    //                         console.log('totalAmount', totalAmount)
    //                         var newPercentage = Number(amount / totalAmount) * 100
    //                         var currentProsent = Number(currentAmount / totalAmount) * 100
    //                         console.log('newPercentage', newPercentage)
    //                         console.log('currentLine', currentLine)
    //                         console.log('line', line)
    //                         currentRecord.setCurrentSublistValue({
    //                             sublistId: context.sublistId,
    //                             fieldId: percentageFieldName,
    //                             value: currentProsent,
    //                             line: currentLine
    //                         });
                            
                            
    //                     }
    //                 }
                    
    //                 // var remainingAmount = 100 - totalPercentage;
    //                 // console.log('remainingAmount', remainingAmount)
    //                 // var newPercentage = (currentAmount / totalAmount) * remainingAmount;
    //                 // console.log('newPercentage', newPercentage)
    //                 // currentRecord.setCurrentSublistValue({
    //                 //     sublistId: context.sublistId,
    //                 //     fieldId: percentageFieldName,
    //                 //     value: newPercentage.toFixed(2),
    //                 //     line: currentLine
    //                 // });
        
    //                 // currentRecord.setCurrentSublistValue({
    //                 //     sublistId: context.sublistId,
    //                 //     fieldId: amountFieldName,
    //                 //     value: currentAmount,
    //                 //     line: currentLine
    //                 // });
        
    //                 // currentRecord.commitLine({ sublistId: context.sublistId });
    //             }else{
    //                 console.log('masuk else', currentLine)
    //                 // currentRecord.selectNewLine({
    //                 //     sublistId : context.sublistId
    //                 // })
        
    //                 currentRecord.setCurrentSublistValue({
    //                     sublistId: context.sublistId,
    //                     fieldId: percentageFieldName,
    //                     value: 100,
    //                     line: currentLine
    //                 });
        
    //                 currentRecord.commitLine({ sublistId: context.sublistId });
    //             }
                
                
    //         }
    //     }
    // }
    return {
        pageInit: pageInit,
        sublistChanged : sublistChanged,
        fieldChanged : fieldChanged
    };
});