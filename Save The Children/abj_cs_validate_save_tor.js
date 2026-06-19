/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], 
function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    
    function saveRecord(context){
        try {
            var rec = context.currentRecord;
            var sublistId = 'recmachcustrecord_tori_id';
            
            var cekLine = rec.getLineCount({
                sublistId : sublistId
            });
            
            if (cekLine > 0) {
                for (var i = 0; i < cekLine; i++) {
                    var itemCost = 0;
                    var itemId = rec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_tori_item',
                        line : i
                    });
                    
                    if (itemId) {
                        var itemLookup = search.lookupFields({
                            type: search.Type.ITEM, 
                            id: itemId,
                            columns: ['cost'] 
                        });
                        
                        var rawCost = itemLookup.cost;
                        if (Array.isArray(rawCost) && rawCost.length > 0) {
                            itemCost = parseFloat(rawCost[0].value) || 0;
                        } else {
                            itemCost = parseFloat(rawCost) || 0;
                        }
                    }
                    
                    var costInItem = parseFloat(rec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_tor_unit_cost',
                        line : i
                    })) || 0;
                    
                    var justification = rec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_stc_tor_justification',
                        line : i
                    });
                    
                    console.log(`Line ${i} -> itemCost: ${itemCost}, costInItem: ${costInItem}, justification: "${justification}"`);
                    if(itemCost > 0){
                        if (costInItem > itemCost && (!justification || justification.toString().trim() === '')) {
                            alert('Harap isi field justification jika mau merubah itemcost lebih besar dari data di item (Baris ' + (i + 1) + ')');
                            
                            return false; 
                        }
                    }
                    
                }
            }
            
        } catch (e) {
            console.log('error', e);
            log.error({
                title: 'Error di saveRecord',
                details: e
            });
        }
        
        return true;
    }

    return {
        saveRecord: saveRecord
    };
});