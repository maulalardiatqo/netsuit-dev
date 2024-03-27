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
    function setItem(currentRecordObj, iteminCostom, amountLine, context){
        
        var itemExists = false;
        var itemCount = currentRecordObj.getLineCount({ sublistId: 'item' });
        var newCol = Number(itemCount) + 1
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
        var amountSet = parseFloat(amountLine)
        if (!itemExists) {
            console.log('newCol', newCol);
            console.log('amountSet', amountSet)
            currentRecordObj.selectNewLine({
                sublistId: "item",
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: iteminCostom
            });
         
            // currentRecordObj.setCurrentSublistText({
            //     sublistId: 'item',
            //     fieldId: 'amount',
            //     text: 1,
            // });
            // currentRecordObj.setCurrentSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'amount',
            //     value: '1',
            // });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                value: '5'
            });
          
            currentRecordObj.setCurrentSublistText({
                sublistId: 'item',
                fieldId: 'grossamt',
                text: '1'
            });
           
            currentRecordObj.commitLine({ sublistId: 'item' });
            // currentRecordObj.commitLine({ sublistId: 'item' });
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
            if(typeTrans == 'estimate' && customForm == '97' && subsidiary == '46'){
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
                setItem(currentRecordObj, iteminCostom, amountLine, context);
            }

        }
    }
    
    return {
        pageInit: pageInit,
        sublistChanged : sublistChanged,
    };
});