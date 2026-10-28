/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Deskripsi: Menampilkan tombol di View Mode dan Update IA saat Edit Mode beserta update field Lot Number
 */
define(['N/record', 'N/log', 'N/search'], (record, log, search) => {

    const CLIENT_SCRIPT_FILE_ID = 'SuiteScripts/abj_cs_create_ia.js'; 

    const beforeLoad = (context) => {
        if (context.type !== context.UserEventType.VIEW) return;

        try {
            const form = context.form;
            const rec = context.newRecord;
            
            form.clientScriptModulePath = CLIENT_SCRIPT_FILE_ID;

            const cbCollection = rec.getValue('custrecord_ps_cb_collection');
            const vialCount = rec.getValue('custrecord_ps_vial_count');
            const account = rec.getValue('custrecord_ps_inv_adjust_account');
            const lineItem = rec.getValue('custrecord_ps_cell_line_item');
            const iaLink = rec.getValue('custrecord_ps_ia_link');

            // Kondisi: Ke-4 field ada nilainya dan IA Link masih kosong
            if (cbCollection && vialCount && account && lineItem && !iaLink) {
                form.addButton({
                    id: 'custpage_btn_create_ia',
                    label: 'Create Inventory Adjustment',
                    functionName: 'createIA' // Nama fungsi yang di-return di Client Script
                });
            }
        } catch (error) {
            log.error('Error in Before Load', error.message);
        }
    };

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.EDIT) return;

        try {
            const oldRec = context.oldRecord;
            const newRec = context.newRecord;
            const iaLink = newRec.getValue('custrecord_ps_ia_link');
            
            if (!iaLink) return;

            const isItemChanged = oldRec.getValue('custrecord_ps_cell_line_item') !== newRec.getValue('custrecord_ps_cell_line_item');
            const isVialChanged = oldRec.getValue('custrecord_ps_vial_count') !== newRec.getValue('custrecord_ps_vial_count');
            const isAccountChanged = oldRec.getValue('custrecord_ps_inv_adjust_account') !== newRec.getValue('custrecord_ps_inv_adjust_account');

            // Jika ada perubahan pada 3 field tersebut
            if (isItemChanged || isVialChanged || isAccountChanged) {
                log.audit('Updating IA', `IA ID: ${iaLink}`);
                
                const account = newRec.getValue('custrecord_ps_inv_adjust_account');
                const item = newRec.getValue('custrecord_ps_cell_line_item');
                const vialCount = newRec.getValue('custrecord_ps_vial_count');
                const recName = newRec.getValue('name');
                
                // --- AWAL PENAMBAHAN LOGIC LOT NUMBER ---
                const cbCollectionId = newRec.getValue('custrecord_ps_cb_collection');
                const parentBankId = newRec.getValue('custrecord_ps_parent_bank');
                const wcbId = newRec.id; 
                log.debug('wcbId', wcbId)
                let donorId = '';
                let mcbCreationDate = '';

                // 1. Ambil Donor ID dengan load customrecord_ps_collection
                if (cbCollectionId) {
                    const collectionRec = record.load({
                        type: 'customrecord_ps_collection',
                        id: cbCollectionId
                    });
                    donorId = collectionRec.getValue('custrecord_ps_coll_donor');
                }

                // 2. Ambil Date Created dengan search ke customrecord_ps_cellbank
                if (parentBankId) {
                    const customrecord_ps_cellbankSearchObj = search.create({
                        type: "customrecord_ps_cellbank",
                        filters: [
                            ["internalid", "anyof", parentBankId]
                        ],
                        columns: [
                            search.createColumn({name: "created", label: "Date Created"})
                        ]
                    });
                    
                    customrecord_ps_cellbankSearchObj.run().each(function(result){
                        mcbCreationDate = result.getValue({name: "created"});
                        return false; // Berhenti setelah menemukan hasil pertama (limit 1)
                    });
                }
                // --- AKHIR PENAMBAHAN LOGIC LOT NUMBER ---

                const today = new Date();
                const yy = today.getFullYear().toString().slice(-2);
                const mm = ('0' + (today.getMonth() + 1)).slice(-2);
                const dd = ('0' + today.getDate()).slice(-2);
                const lotNumber = `${yy}-${mm}-${dd}/${recName}`;

                // Load record IA
                const iaRec = record.load({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    id: iaLink,
                    isDynamic: true
                });

                if (isAccountChanged) iaRec.setValue({ fieldId: 'account', value: account });

                // Update sublist inventory
                iaRec.selectLine({ sublistId: 'inventory', line: 0 });
                iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
                iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: vialCount });

                // Update inventory detail
                const invDetail = iaRec.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                
                // Clear existing assignment
                const lineCount = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
                for (let i = lineCount - 1; i >= 0; i--) {
                    invDetail.removeLine({ sublistId: 'inventoryassignment', line: i });
                }

                // Add new assignment
                invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: lotNumber });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: vialCount });
                
                // --- SET CUSTOM FIELDS UNTUK LOT NUMBER RECORD ---
                if (donorId) {
                    invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pst_donor_id', value: donorId });
                }
                
                if (mcbCreationDate) {
                    invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pst_mcb_creation_date', value: mcbCreationDate });
                }
                
                if (wcbId) {
                    log.debug('masuk kondisi',wcbId )
                    invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pst_wcb_id', value: wcbId });
                }
                // ------------------------------------------------

                invDetail.commitLine({ sublistId: 'inventoryassignment' });

                iaRec.commitLine({ sublistId: 'inventory' });
                iaRec.save();
                
                log.audit('Success', `Updated IA ID: ${iaLink}`);
            }
        } catch (error) {
            log.error('Error in After Submit', error.message);
        }
    };

    return { beforeLoad, afterSubmit };
});