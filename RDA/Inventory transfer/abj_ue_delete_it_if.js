/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

    const afterSubmit = (context) => {
        try {
            // Hanya proses saat type adalah 'edit'
            if (context.type !== context.UserEventType.EDIT) return;
    
            const newRec = context.newRecord;
            const oldRec = context.oldRecord;
    
            const oldCancelled = oldRec.getValue({ fieldId: 'custbody_rda_do_cancelled' });
            const newCancelled = newRec.getValue({ fieldId: 'custbody_rda_do_cancelled' });
    
            log.debug('Cancelled Value Changed', `Old: ${oldCancelled}, New: ${newCancelled}`);
    
            // Jika dari true ke false
            if (oldCancelled === true && newCancelled === false) {
            const transferId = newRec.getValue({ fieldId: 'custbody_rda_do_trf_to_gs' });
    
            log.debug('Transfer ID to delete', transferId);
    
                if (transferId) {
                    try {
                    // Hapus record Inventory Transfer
                    record.delete({
                        type: record.Type.INVENTORY_TRANSFER,
                        id: transferId,
                    });
        
                    log.audit('Inventory Transfer Deleted', `ID ${transferId} has been successfully deleted.`);
                    } catch (deleteErr) {
                    log.error('Error deleting Inventory Transfer', deleteErr);
                    }
                } else {
                    log.debug('No Transfer ID', 'custbody_rda_do_trf_to_gs is empty, nothing to delete.');
                }
            }
        } catch (e) {
            log.error('Unexpected Error in afterSubmit', e);
        }
    };
    return { afterSubmit };
  });
  