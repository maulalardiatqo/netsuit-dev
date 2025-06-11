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
                var successExceute = false
                var messge = ''
                var requestBody = JSON.parse(context.request.body);
                var ifId = requestBody.ifId;
                log.debug('ifId', ifId)
    
                if (!ifId) {
                    throw new Error('Parameter "ifId" is required.');
                }
                
                var newRec = record.load({
                    type : 'itemfulfillment',
                    id : ifId,
                    isDynamic : false
                });
                var subsId = newRec.getValue('subsidiary');
                var cekDoNO = newRec.getValue('custbody_rda_do_trf_to_gs');
                log.debug('cekDoNo', cekDoNO);
                if(cekDoNO == ''){
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
                    log.debug('goodStock', goodStock);
                    log.debug('outbound',Outbound);
                    var department = ''
                    var classId = ''
                    var soDate = newRec.getValue('trandate');
                    log.debug('soDate', soDate)
                    var location = ''
                    var itemfulfillmentSearchObj = search.create({
                        type: "itemfulfillment",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                        filters:
                        [
                            ["type","anyof","ItemShip"], 
                            "AND", 
                            ["taxline","is","F"], 
                            "AND", 
                            ["mainline","is","T"], 
                            "AND", 
                            ["internalid","anyof",ifId]
                        ],
                        columns:
                        [
                            search.createColumn({name: "department", label: "Department"}),
                            search.createColumn({name: "class", label: "Division"}),
                            search.createColumn({name: "location", label: "Location"})
                        ]
                    });
                    var searchResults = itemfulfillmentSearchObj.run().getRange({ start: 0, end: 1 });
                    if (searchResults.length > 0) {
                        department = searchResults[0].getValue({ name: "department" }) 
                        classId = searchResults[0].getValue({ name: "class" })
                        location = searchResults[0].getValue({ name: "location" })
                    } 
                    log.debug('data', {
                        department: department,
                        classId: classId,
                        location : location
                    })
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
                                fieldId: 'unitconversion',
                                line: i
                            });
                            log.debug('unitRate', unitRate)
                            log.debug('item', item)
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
                            
                            var searchOnHand = itemSearchObj.run().getRange({ start: 0, end: 1 });
                            log.debug('searchOnHand', searchOnHand)
                            
                            if (searchOnHand.length > 0) {
                                var quantityOnHand = searchOnHand[0].getValue({ name: "locationquantityonhand" }) * Number(unitRate);
                                log.debug("Quantity On Hand", quantityOnHand);
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
                            
                            if(qty > quantityOnHand){
                                log.debug('quantity lebih besar', qty);
                                successExceute = false
                                messge = 'Failed! Quantity is more than available on hand.';
                                validateOnhand = false;
                                newRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_rda_it_error_for_do_line',
                                    line: i,
                                    value: 'Sales order quantity is greater than the quantity on hand'
                                });
                            }else{
                                log.debug('quantity lebih kecil', i);
                                var cekerror = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId : 'custcol_rda_it_error_for_do_line',
                                    line : i
                                })
                                if(cekerror){
                                    newRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_rda_it_error_for_do_line',
                                        line: i,
                                        value: ''
                                    });
                                }
                                
                            }
                            allItem.push({ item: item, units: units, qty: qty });
                            
                        }
                    }
                    log.debug('allItem', allItem)
                    log.debug('validateOnhand', validateOnhand)
                    newRec.save();
                    log.debug('afterSave IF')
                    if (!validateOnhand) {
                        var msg = 'One of the lines in transaction has a Quantity Onhand that is smaller than the Quantity Transfer.';
                            record.submitFields({
                                type: 'itemfulfillment',
                                id: ifId,
                                values: { custbody_rda_it_error_for_do_header: msg },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                    }
                    if (validateOnhand == true && allItem.length > 0) {
                        try {
                            log.debug('masuk kondisi')
                            var createRecord = record.create({
                                type: 'inventorytransfer',
                                isDynamic: true
                            });
                            createRecord.setValue({ fieldId: 'subsidiary', value: subsId });
                            createRecord.setValue({ fieldId: 'department', value: department });
                            createRecord.setValue({ fieldId: 'class', value: classId });
                            createRecord.setValue({ fieldId: 'trandate', value: currentDate });
                            createRecord.setValue({ fieldId: 'custbody_rda_if_number_inv_tran', value: ifId });
                            createRecord.setValue({ fieldId: 'custbody_rda_inventory_transfer_type', value: '2' });
                            createRecord.setValue({ fieldId: 'location', value: Outbound });
                            createRecord.setValue({ fieldId: 'transferlocation', value: goodStock });
                
                            allItem.forEach(function (data) {
                                createRecord.selectNewLine({ sublistId: 'inventory' });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: data.item });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'units', value: data.units });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: data.qty });
                                createRecord.commitLine({ sublistId: 'inventory' });
                            });
                
                            var saveCreate = createRecord.save();
                            log.debug('saveCreate', saveCreate);
                            if (saveCreate) {
                                successExceute = true;
                                messge = 'Success Create Inventory Transfer';

                                record.submitFields({
                                    type: 'itemfulfillment',
                                    id: ifId,
                                    values: {
                                        custbody_rda_do_trf_to_gs: saveCreate,
                                        custbody_rda_it_error_for_do_header: '',
                                        custbody_rda_done__it: true
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                            }
                
                        } catch (e) {
                            log.error('Error creating Inventory Transfer', e);
                
                            record.submitFields({
                                type: 'itemfulfillment',
                                id: ifId,
                                values: { custbody_rda_it_error_for_do_header: e.message },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                    }
                   
        
                    context.response.write(JSON.stringify({ success: successExceute, message: messge }));
                }
               
            } catch (e) {
                log.debug('Error in Suitelet', e.message);
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
