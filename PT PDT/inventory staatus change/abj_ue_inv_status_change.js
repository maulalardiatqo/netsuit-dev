/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function(record, log) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE) {
            let form = context.form;
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_inv_status_change.js'; 
            
            form.addButton({
                id: 'custpage_btn_set_inv_item',
                label: 'Set Inventory Item',
                functionName: 'setInventoryItemAction()'
            });
        }
    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            let newRec = context.newRecord;
            let recType = newRec.type;
            let recId = newRec.id;

            // Mapping field body ke master lot
            let mappingMap = {
                'custbody_pdt_bi': 'custitemnumber_abj_pdt_bi',
                'custbody_pdt_pb': 'custitemnumber_abj_pdt_pb',
                // ... (Masukkan sisa mapping lengkap Anda di sini) ...
                'custbody_pdt_lane_mtm': 'custitemnumber_abj_pdt_lane_mtm'
            };

            let fieldsToUpdate = {};
            let hasDataToUpdate = false;

            for (let sourceField in mappingMap) {
                let val = newRec.getValue({ fieldId: sourceField });
                if (val !== '' && val !== null && val !== undefined) {
                    fieldsToUpdate[mappingMap[sourceField]] = val;
                    hasDataToUpdate = true;
                }
            }

            if (!hasDataToUpdate) return;

            try {
                let loadedRec = record.load({ type: recType, id: recId });
                let lineCount = loadedRec.getLineCount({ sublistId: 'inventory' });
                let processedLots = []; 

                for (let i = 0; i < lineCount; i++) {
                    if (loadedRec.hasSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail', line: i })) {
                        let invDetail = loadedRec.getSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail', line: i });
                        let assignCount = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
                        
                        for (let j = 0; j < assignCount; j++) {
                            let lotId = invDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j }) ||
                                        invDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: j }) ||
                                        invDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorynumber', line: j });

                            if (lotId && processedLots.indexOf(lotId) === -1) {
                                processedLots.push(lotId);
                                record.submitFields({
                                    type: record.Type.INVENTORY_NUMBER,
                                    id: lotId,
                                    values: fieldsToUpdate,
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                log.error('Error in afterSubmit Update Lot', e.message);
            }
        }
    }

    return { beforeLoad: beforeLoad, afterSubmit: afterSubmit };
});