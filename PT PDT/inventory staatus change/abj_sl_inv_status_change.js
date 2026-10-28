/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/url'], function(record, search, url) {
    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                let body = JSON.parse(context.request.body);
                let rec;

                // Jika mode Edit, load record. Jika mode Create, buat record baru.
                if (body.recordId) {
                    rec = record.load({ 
                        type: record.Type.INVENTORY_STATUS_CHANGE, 
                        id: body.recordId, 
                        isDynamic: true 
                    });
                } else {
                    rec = record.create({ 
                        type: record.Type.INVENTORY_STATUS_CHANGE, 
                        isDynamic: true 
                    });
                }

                // Set Header Fields
                rec.setValue('location', body.location);
                rec.setValue('previousstatus', body.status);
                rec.setValue('revisedstatus', body.revisedStatus);
                rec.setValue('subsidiary', body.subsidiary);
                rec.setValue('custbody_pdt_item', body.item);
                rec.setValue('custbody_pdt_initial_lot_number', body.initialLot);

                // Jalankan Saved Search
                let searchObj = search.create({
                    type: "invtnumberitembalance",
                    filters: [
                        ["item", "anyof", body.item], "AND",
                        ["location", "anyof", body.location], "AND",
                        ["status", "anyof", body.status]
                    ],
                    columns: ["inventorynumber", "onhand"]
                });

                let detailData = [];
                let sumQty = 0;

                searchObj.run().each(function(result) {
                    let invNumText = result.getText("inventorynumber");
                    let invNumValue = result.getValue("inventorynumber");
                    let onHand = parseFloat(result.getValue("onhand")) || 0;

                    if (invNumText && invNumText.indexOf(body.initialLot) !== -1 && onHand > 0) {
                        sumQty += onHand;
                        detailData.push({ lot: invNumValue, qty: onHand });
                    }
                    return true;
                });

                if (detailData.length === 0) {
                    context.response.write(JSON.stringify({ success: false, message: 'Data Lot tidak ditemukan atau Qty On Hand kosong.' }));
                    return;
                }

                // Hapus baris lama jika ada (untuk mode Edit)
                let lineCount = rec.getLineCount({ sublistId: 'inventory' });
                for (let i = lineCount - 1; i >= 0; i--) {
                    rec.removeLine({ sublistId: 'inventory', line: i });
                }

                // Set Sublist dan Inventory Detail di sisi server
                rec.selectNewLine({ sublistId: 'inventory' });
                rec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: body.item });
                rec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'quantity', value: sumQty });

                let invDetail = rec.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                
                detailData.forEach(function(d) {
                    invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                    
                    // Gunakan fallback untuk memastikan ID masuk ke field Lot yang tepat
                    let lotSet = false;
                    let fieldsToTry = ['issueinventorynumber', 'inventorynumber', 'receiptinventorynumber'];
                    
                    for (let i = 0; i < fieldsToTry.length; i++) {
                        try {
                            // Coba set nilai ke field
                            invDetail.setCurrentSublistValue({ 
                                sublistId: 'inventoryassignment', 
                                fieldId: fieldsToTry[i], 
                                value: d.lot 
                            });
                            
                            // Validasi apakah nilai berhasil masuk
                            let checkVal = invDetail.getCurrentSublistValue({ 
                                sublistId: 'inventoryassignment', 
                                fieldId: fieldsToTry[i] 
                            });
                            
                            if (checkVal) {
                                lotSet = true;
                                break; // Jika sukses terisi, hentikan pencarian field
                            }
                        } catch (e) {
                            // Abaikan error dan coba field berikutnya
                        }
                    }

                    if (!lotSet) {
                        throw new Error('Gagal memetakan Lot ID: ' + d.lot + ' ke dalam Inventory Detail.');
                    }
                    
                    invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: d.qty });
                    invDetail.commitLine({ sublistId: 'inventoryassignment' });
                });

                rec.commitLine({ sublistId: 'inventory' });
                
                let savedId = rec.save({ ignoreMandatoryFields: true });
                
                context.response.write(JSON.stringify({ success: true, recordId: savedId }));

            } catch (e) {
                context.response.write(JSON.stringify({ success: false, message: e.message }));
            }
        }
    }
    return { onRequest: onRequest };
});