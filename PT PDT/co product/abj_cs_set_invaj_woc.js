/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([], function() {

    function saveRecord(context) {
        var rec = context.currentRecord;
        
        // Cek apakah custom field qty per lot diisi oleh user
        // Jika tidak, biarkan validasi bawaan NetSuite berjalan normal
        var qtyString = rec.getValue({ fieldId: 'custbody_abj_pdt_qty_per_lot_woc' });
        if (!qtyString) {
            return true; 
        }

        try {
            var completedQty = rec.getValue({ fieldId: 'completedquantity' });
            if (!completedQty || completedQty <= 0) return true;

            // Buka inventory detail secara background
            var invDetail = rec.getSubrecord({ fieldId: 'inventorydetail' });
            
            // Cek jika user belum mengisi inventory detail sama sekali
            var lineCount = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
            if (lineCount === 0) {
                invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                
                invDetail.setCurrentSublistValue({ 
                    sublistId: 'inventoryassignment', 
                    fieldId: 'receiptinventorynumber', 
                    value: 'TEMP-LOT' 
                });
                invDetail.setCurrentSublistValue({ 
                    sublistId: 'inventoryassignment', 
                    fieldId: 'quantity', 
                    value: completedQty 
                });
                
                invDetail.commitLine({ sublistId: 'inventoryassignment' });
            }
            return true; // Izinkan Save

        } catch (e) {
            console.log('Error in Client Script saveRecord:', e.message);
            return true; // Tetap izinkan save agar dieksekusi oleh User Event
        }
    }

    return {
        saveRecord: saveRecord
    };
});