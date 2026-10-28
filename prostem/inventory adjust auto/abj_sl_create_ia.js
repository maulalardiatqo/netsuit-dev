/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// 1. Tambahkan modul 'N/format'
define(['N/record', 'N/search', 'N/format'], (record, search, format) => {
    const onRequest = (context) => {
        if (context.request.method === 'POST') {
            try {
                const body = JSON.parse(context.request.body);
                const recId = body.recId;
                const recType = body.recType;

                const sourceRec = record.load({ type: recType, id: recId });
                
                const subsidiary = 12; 
                const location = 247;
                const account = sourceRec.getValue({ fieldId: 'custrecord_ps_inv_adjust_account' });
                const item = sourceRec.getValue({ fieldId: 'custrecord_ps_cell_line_item' });
                const vialCount = sourceRec.getValue({ fieldId: 'custrecord_ps_vial_count' });
                const recName = sourceRec.getValue({ fieldId: 'name' });

                if (!account || !item || !vialCount) {
                    throw new Error('Salah satu field wajib (Account, Item, atau Vial Count) kosong.');
                }

                const cbCollectionId = sourceRec.getValue({ fieldId: 'custrecord_ps_cb_collection' });
                const parentBankId = sourceRec.getValue({ fieldId: 'custrecord_ps_parent_bank' });
                const wcbId = recId; 

                let donorId = '';
                let mcbCreationDate = '';
                let mcbId = parentBankId;
                if (cbCollectionId) {
                    const collectionRec = record.load({ type: 'customrecord_ps_collection', id: cbCollectionId });
                    donorId = collectionRec.getValue({ fieldId: 'custrecord_ps_coll_donor' });
                }

                if (parentBankId) {
                    const cbSearch = search.create({
                        type: "customrecord_ps_cellbank",
                        filters: [ ["internalid", "anyof", parentBankId] ],
                        columns: [ 
                            search.createColumn({name: "created"}) 
                        ]
                    });
                    cbSearch.run().each(result => {
                        const rawDateTime = result.getValue({ name: "created" });
                        if (rawDateTime) {
                            // 2. Konversi Date/Time menjadi Date murni
                            try {
                                // Parse string DateTime menjadi object JS Date
                                const parsedDateTime = format.parse({
                                    value: rawDateTime,
                                    type: format.Type.DATETIME
                                });
                                
                                // Format kembali object JS Date menjadi string tipe DATE yang diterima sistem
                                mcbCreationDate = format.format({
                                    value: parsedDateTime,
                                    type: format.Type.DATE
                                });
                            } catch (dateError) {
                                log.error('Format Date Error', dateError.message);
                                // Fallback jika format error
                                mcbCreationDate = new Date(rawDateTime); 
                            }
                        }
                        return false;
                    });
                }

                // Format Lot Number
                const today = new Date();
                const yy = today.getFullYear().toString().slice(-2);
                const mm = ('0' + (today.getMonth() + 1)).slice(-2);
                const dd = ('0' + today.getDate()).slice(-2);
                const lotNumber = `${yy}-${mm}-${dd}/${recName}`;

                // CREATE INVENTORY ADJUSTMENT
                const iaRec = record.create({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    isDynamic: true
                });

                iaRec.setValue({ fieldId: 'subsidiary', value: subsidiary });
                iaRec.setValue({ fieldId: 'account', value: account });
                iaRec.setValue({ fieldId: 'trandate', value: today });

                iaRec.selectNewLine({ sublistId: 'inventory' });
                iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
                iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: location });
                iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: vialCount });

                const invDetail = iaRec.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: lotNumber });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: vialCount });
                invDetail.commitLine({ sublistId: 'inventoryassignment' });
                
                iaRec.commitLine({ sublistId: 'inventory' });

                // SAVE IA
                const iaId = iaRec.save();

                // UPDATE INVENTORY NUMBER (LOT NUMBER)
                const lotSearch = search.create({
                    type: search.Type.INVENTORY_NUMBER,
                    filters: [
                        ['inventorynumber', 'is', lotNumber], 'AND', ['item', 'anyof', item]
                    ],
                    columns: ['internalid']
                });

                lotSearch.run().each(result => {
                    const invNumberId = result.id;
                    const valuesToUpdate = {};

                    if (donorId) valuesToUpdate['custitemnumber_abj_pst_donor_id'] = donorId;
                    if (cbCollectionId) valuesToUpdate['custitemnumber_abj_pst_collection_id'] = cbCollectionId;
                    log.debug('mcbId', mcbId)   
                    if (mcbId) valuesToUpdate['custitemnumber_abj_pst_mcb_id'] = mcbId;
                    
                    // Karena mcbCreationDate sekarang bernilai Date (bukan DateTime), sistem akan menerimanya
                    if (mcbCreationDate) valuesToUpdate['custitemnumber_abj_pst_mcb_creation_date'] = mcbCreationDate;
                    
                    if (wcbId) valuesToUpdate['custitemnumber_abj_pst_wcb_id'] = wcbId;

                    if (Object.keys(valuesToUpdate).length > 0) {
                        record.submitFields({
                            type: record.Type.INVENTORY_NUMBER,
                            id: invNumberId,
                            values: valuesToUpdate
                        });
                    }
                    return false;
                });

                // UPDATE SOURCE RECORD
                record.submitFields({
                    type: recType,
                    id: recId,
                    values: { 'custrecord_ps_ia_link': iaId }
                });

                context.response.write(JSON.stringify({ success: true, iaId: iaId }));

            } catch (e) {
                context.response.write(JSON.stringify({ success: false, error: e.message }));
            }
        }
    };
    return { onRequest };
});