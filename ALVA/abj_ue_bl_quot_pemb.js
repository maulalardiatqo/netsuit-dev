/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
  ) {
    function beforeSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
  
                var soRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                });
                var lineCOunt = soRec.getLineCount({
                    sublistId : "recmachcustrecord_ajb_pembobotan_so_id"
                })
                if(lineCOunt > 0){
                    var groupedData = {};
                    for (var i = 0; i < lineCOunt; i++) {
                        var soItem = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_abj_pembobotan_item',
                            line: i
                        });
                        var soAmount = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_alva_fix_amount',
                            line: i
                        });
                
                        log.debug('allLineSO', {soItem: soItem, soAmount: soAmount});
                        
                        if (!groupedData[soItem]) {
                            groupedData[soItem] = { soItem: soItem, soAmount: 0 }; 
                        }
                        groupedData[soItem].soAmount += soAmount;
                    }
                    
                    var result = [];
                    for (var key in groupedData) {
                        result.push(groupedData[key]);
                    }
                    log.debug('groupedData', result);
                    for (var j = 0; j < result.length; j++) {
                        var itemData = result[j];
                        var itemId = itemData.soItem
                        var totalAmount = itemData.soAmount;
                        log.debug('dataSet', {itemId : itemId, totalAmount : totalAmount})

                        soRec.selectNewLine({ sublistId: 'item'})
                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: itemId
                        });
                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: '1'
                        });
                        soRec.setCurrentSublistText({
                            sublistId: 'item',
                            fieldId: 'rate',
                            text: totalAmount
                        });
                        soRec.commitLine({ sublistId: 'item' });
                    }
                }
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return{
        beforeSubmit : beforeSubmit
    };
});