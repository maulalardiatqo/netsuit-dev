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
                value: '6'
            });
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'grossamt',
                value: '1.11'
            });
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
            if(typeTrans == 'salesord' && customForm == '134' && isParent == true){
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
    return {
        pageInit: pageInit,
        sublistChanged : sublistChanged
    };
});