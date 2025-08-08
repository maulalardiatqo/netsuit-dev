/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/log', 'N/task', 'N/record', 'N/search'], function (log, task, record, search) {
    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                function sysDate() {
                    var date = new Date();
                    var tdate = date.getUTCDate();
                    var month = date.getUTCMonth();
                    var year = date.getUTCFullYear();
                
                    return new Date(year, month, tdate);
                }
                
                var currentDate = sysDate();
                log.debug('currentDate', currentDate);
                var requestBody = JSON.parse(context.request.body);
                var successExecute = false
                var soId = requestBody.soId;
                log.debug('soId', soId)
    
                if (!soId) {
                    throw new Error('Parameter "SoId" is required.');
                }
    
                var newRec = record.load({
                    type : record.Type.SALES_ORDER,
                    id : soId,
                    isDynamic : false
                });
                log.debug('soId', soId);
                var subsId = newRec.getValue('subsidiary');
                log.debug('subsId', subsId);
                var goodStock;
                var Outbound;
            
                if (subsId) {
                    var recSubs = record.load({
                        type: 'subsidiary',
                        id: subsId
                    });
                    goodStock = recSubs.getValue('custrecordcustrecord_rda_location_gs');
                    Outbound = recSubs.getValue('custrecord_rda_location_intransit_out');
                }
                var department = newRec.getValue('department');
                var classId = newRec.getValue('class');
                var soDate = newRec.getValue('trandate');
                var location = newRec.getValue('location');
            
                var validateOnhand = true;
                var allItem = [];
                var cekLineCount = newRec.getLineCount('item');
                log.debug('cekLineCount', cekLineCount);
                if (cekLineCount > 0) {
                    for (var i = 0; i < cekLineCount; i++) {
                        var item = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        var unitRate = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitconversionrate',
                            line: i
                        });
                        var itemSearchObj = search.create({
                            type: "item",
                            filters: [
                                ["internalid","anyof",item], 
                                "AND", 
                                ["inventorylocation","anyof",location]
                            ],
                            columns: [
                                search.createColumn({name: "itemid", label: "Name"}),
                                search.createColumn({name: "displayname", label: "Display Name"}),
                                search.createColumn({name: "quantityonhand", label: "On Hand"}),
                                search.createColumn({name: "inventorylocation", label: "Inventory Location"}),
                                search.createColumn({name: "locationquantityonhand", label: "Location On Hand"})
                            ]
                        });
                        
                        var searchResults = itemSearchObj.run().getRange({ start: 0, end: 1 });
                        
                        if (searchResults.length > 0) {
                            var quantityOnHand = searchResults[0].getValue({ name: "locationquantityonhand" }) * Number(unitRate);
                        } 
                        
                        var units = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: i
                        });
                        var qty = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
                        var qtyCommited = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantitycommitted',
                            line: i
                        });
                        
                        var isFulfill = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'fulfillable',
                            line: i
                        });
                        log.debug('quantityOnHand', quantityOnHand);
                        log.debug('qtyCommited', qtyCommited)
                        var dataBanding = Number(quantityOnHand)
                        log.debug('dataBanding', dataBanding)
                        if (isFulfill == true) {
                            if(qty > dataBanding){
                                log.debug('quantity lebih besar', {qty : qty, quantityOnHand : quantityOnHand, dataBanding : dataBanding, qtyCommited : qtyCommited});
                                log.debug('cekLine ke', i)
                                validateOnhand = false;
                                newRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_rda_error_message_line',
                                    line: i,
                                    value: 'Sales order quantity is greater than the quantity on hand'
                                });
                            }else{
                                log.debug('quantity lebih kecil');
                                newRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_rda_error_message_line',
                                    line: i,
                                    value: ''
                                });
                            }
                            allItem.push({ item: item, units: units, qty: qty });
                        }
                    }
                }
                if (!validateOnhand) {
                    var msg = 'One of the lines in transaction has a Quantity Onhand that is smaller than the Quantity Transfer.';
                    record.submitFields({
                        type: 'salesorder',
                        id: soId,
                        values: { custbody_rda_error_message_ivnt_trf: msg },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    
                }
            
                if (validateOnhand == true && allItem.length > 0) {
                    try {
                        var createRecord = record.create({
                            type: 'inventorytransfer',
                            isDynamic: true
                        });
            
                        createRecord.setValue({ fieldId: 'subsidiary', value: subsId });
                        createRecord.setValue({ fieldId: 'department', value: department });
                        createRecord.setValue({ fieldId: 'class', value: classId });
                        createRecord.setValue({ fieldId: 'trandate', value: currentDate });
                        createRecord.setValue({ fieldId: 'custbody_rda_so_number', value: soId });
                        createRecord.setValue({ fieldId: 'custbody_rda_inventory_transfer_type', value: '2' });
                        createRecord.setValue({ fieldId: 'location', value: goodStock });
                        createRecord.setValue({ fieldId: 'transferlocation', value: Outbound });
            
                        allItem.forEach(function (data) {
                            createRecord.selectNewLine({ sublistId: 'inventory' });
                            createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: data.item });
                            createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'units', value: data.units });
                            createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: data.qty });
                            createRecord.commitLine({ sublistId: 'inventory' });
                        });
            
                        var saveCreate = createRecord.save();
                        log.debug('saveCreate', saveCreate);
                        if(saveCreate){
                                var salesorderSearchObj = search.create({
                                type: "salesorder",
                                settings: [
                                    { name: "consolidationtype", value: "ACCTTYPE" },
                                    { name: "includeperiodendtransactions", value: "F" }
                                ],
                                filters: [
                                    ["type", "anyof", "SalesOrd"],
                                    "AND",
                                    ["internalid", "anyof", soId],
                                    "AND",
                                    ["mainline", "is", "T"]
                                ],
                                columns: [
                                    search.createColumn({ name: "custbody_rda_inventory_trf_number", label: "RDA - Inventory Transfer Number" })
                                ]
                            });

                            var invTrvId;
                            var searchResultCount = salesorderSearchObj.runPaged().count;
                            log.debug("salesorderSearchObj result count", searchResultCount);

                            salesorderSearchObj.run().each(function (result) {
                                invTrvId = result.getValue({
                                    name: "custbody_rda_inventory_trf_number"
                                });
                                return false;
                            });

                            log.debug('invTrvId', invTrvId);

                            if (invTrvId) {
                                try {
                                    record.delete({
                                        type: record.Type.INVENTORY_TRANSFER,
                                        id: invTrvId
                                    });
                                    log.debug('Inventory Transfer Deleted', 'ID: ' + invTrvId);
                                } catch (e) {
                                    log.debug('Gagal hapus Inventory Transfer', e.message);
                                }
                            }

                            successExecute = false
                            record.submitFields({
                                type: 'salesorder',
                                id: soId,
                                values: { custbody_rda_inventory_trf_number: saveCreate },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                            record.submitFields({
                                type: 'salesorder',
                                id: soId,
                                values: { custbody_rda_error_message_ivnt_trf: '' },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                            
                        }
            
                    } catch (e) {
                        log.error('Error creating Inventory Transfer', e);
            
                        // Set the error message on SO
                        record.submitFields({
                            type: 'salesorder',
                            id: soId,
                            values: { custbody_rda_error_message_ivnt_trf: e.message },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                      
                    }
                }
    
                context.response.write(JSON.stringify({ success: true, successExecute: successExecute }));
            } catch (e) {
                log.error('Error in Suitelet', e.message);
                context.response.write(JSON.stringify({ success: false, message: e.message }));
            }
        } else {
            context.response.write(JSON.stringify({ success: false, message: 'Invalid request method.' }));
        }
    }
    

    return {
        onRequest: onRequest
    };
});
