/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log", "N/format"], function (record, search, log,format) {
    function beforeSubmit(context) {
        log.debug('context.type', context.type)
       
    }
    function beforeLoad(context){
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var cekError = rec.getValue('custbody_rda_error_message_ivnt_trf');
            var cekInvTrans = rec.getValue('custbody_rda_inventory_trf_number');
            var status = rec.getValue('status');
            log.debug('cekInvTrans', cekInvTrans ? cekInvTrans.length : 0);
            log.debug('cekError', cekError)
            log.debug('status', status);
            if(status != 'Closed'){
                log.debug('status tidak sama dengan closed')
                if (cekError && cekError.indexOf('ErrorRe-Validate') === -1){
                    if((!cekInvTrans || cekInvTrans.length < 1)){
                        form.addButton({
                            id: 'custpage_button_recreate',
                            label: "Recreate Inv Transfer",
                            functionName: "createRec()"
                        });
                    }
                    
                }
            }
            
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_create_inv_transfer.js"
        }
        if (context.type === context.UserEventType.COPY) {
            var rec = context.newRecord;
            var cekInvNumb = rec.getValue('custbody_rda_inventory_trf_number');
            log.debug('cekInvNumb', cekInvNumb)
            if(cekInvNumb){
                log.debug('masuk kondisi copy')
                rec.setValue({
                    fieldId : "custbody_rda_so_copy_trans",
                    value : true
                })
           
            }
        }
       
    }
    function afterSubmit(context) {
        try {
           
            if (context.type === context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var soId = rec.id;
                log.debug('soId', soId);
                var cekFlag = rec.getValue('custbody_rda_so_copy_trans');
                log.debug('cekFlag', cekFlag);
                if(cekFlag == true){
                    record.submitFields({
                        type: 'salesorder',
                        id: soId,
                        values: { custbody_rda_inventory_trf_number: null },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                }
            }
            if (context.type === context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var soId = rec.id;
                log.debug('soId', soId);
                var newRec = record.load({
                    type : record.Type.SALES_ORDER,
                    id : soId,
                    isDynamic : false
                })
                
                function sysDate() {
                    var date = new Date();
                    var tdate = date.getUTCDate();
                    var month = date.getUTCMonth() + 1;
                    var year = date.getUTCFullYear();
                
                    return tdate + '/' + month + '/' + year;
                }

                var currentDate = sysDate()
                log.debug('currentDate', currentDate)

                var cekITnumb = newRec.getValue('custbody_rda_inventory_trf_number');
                var cekStatus = newRec.getValue('custbody_rda_so_approved');
                var cekApprovReq = newRec.getValue('custbody_rda_approval_on_inv_required');
                if(cekITnumb.length == 0){
                    log.debug('perlu create')
                }else{
                    log.debug('tidak perlu create')
                }
                if (cekStatus == true && cekITnumb.length == 0) {
                    if (cekITnumb.length == 0) {
                    var subsId = newRec.getValue('subsidiary');
                    var goodStock;
                    var Outbound;

                    if (subsId) {
                        var subsidiarySearchObj = search.create({
                            type: "subsidiary",
                            filters: [
                                ["internalid", "anyof", subsId]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "custrecordcustrecord_rda_location_gs",
                                    label: "RDA - Location GoodStock Default"
                                }),
                                search.createColumn({
                                    name: "custrecord_rda_location_intransit_out",
                                    label: "RDA - Location Intransit Outbound"
                                })
                            ]
                        });

                        var searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });
                        if (searchResult.length > 0) {
                            var result = searchResult[0];
                            goodStock = result.getValue({
                                name: "custrecordcustrecord_rda_location_gs"
                            });
                            Outbound = result.getValue({
                                name: "custrecord_rda_location_intransit_out"
                            });
                        }
                    }

                    var department = newRec.getValue('department');
                    var classId = newRec.getValue('class');
                    var soDate = newRec.getValue('trandate');
                    var location = newRec.getValue('location');
                    log.debug('location', location);

                    var validateOnhand = true
                    var allItem = [];
                    var cekLineCount = newRec.getLineCount('item');
                    if (cekLineCount > 0) {
                        if (cekLineCount >= 200) {
                            var msg = 'Usage Limit Exceeded, Please Click Button Re-Create Inv Transfer';
                            record.submitFields({
                                type: 'salesorder',
                                id: soId,
                                values: {
                                    custbody_rda_error_message_ivnt_trf: msg
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                            log.debug('Line item too many', msg);
                            return;
                        }
                        let allItemIds = [];
                        let itemQtyOnHandMap = {};

                        for (var i = 0; i < cekLineCount; i++) {
                            var itemId = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });
                            if (itemId && allItemIds.indexOf(itemId) === -1) {
                                allItemIds.push(itemId);
                            }
                        }
                        var itemSearchObj = search.create({
                            type: "item",
                            filters: [
                                ["internalid", "anyof", allItemIds],
                                "AND",
                                ["inventorylocation", "anyof", location]
                            ],
                            columns: [
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "locationquantityonhand", label: "Location On Hand" })
                            ]
                        });

                        itemSearchObj.run().each(function (result) {
                            var id = result.getValue({ name: 'internalid' });
                            var qtyOnHand = parseFloat(result.getValue({ name: 'locationquantityonhand' }) || 0);
                            itemQtyOnHandMap[id] = qtyOnHand;
                            return true;
                        });

                        for (var i = 0; i < cekLineCount; i++) {
                            var item = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });

                            var unitRate = parseFloat(newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'unitconversionrate',
                                line: i
                            }) || 1);

                            var units = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: i
                            });
                            var qty = parseFloat(newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            }) || 0);
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

                            if (isFulfill == true) {
                                var quantityOnHand = (itemQtyOnHandMap[item] || 0) * unitRate;
                                log.debug("data banding", {
                                    qty: qty,
                                    quantityOnHand: quantityOnHand
                                });

                                var dataBanding = Number(quantityOnHand); 
                                if (qty > dataBanding) {
                                    validateOnhand = false;
                                    newRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_rda_error_message_line',
                                        line: i,
                                        value: 'Sales order quantity is greater than the quantity on hand'
                                    });
                                }
                                allItem.push({ item: item, units: units, qty: qty });
                            }
                        }
                    }

                    var saveRec = newRec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRec', saveRec)
                    log.debug('validateOnhand', validateOnhand)
                    if(validateOnhand == true){
                        if (allItem.length > 0) {
                            try {
                                var createRecord = record.create({
                                    type: 'inventorytransfer',
                                    isDynamic: true
                                });
                                if(currentDate){
                                    currentDate = format.parse({ value: currentDate, type: format.Type.DATE });
                                }
                                log.debug('cekCurrnetDate', currentDate)
                                
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
                                }
                                record.submitFields({
                                    type: 'salesorder',
                                    id: soId,
                                    values: { 
                                        custbody_rda_inventory_trf_number: saveCreate,
                                        custbody_rda_error_message_ivnt_trf: '' 
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            } catch (e) {
                                log.debug('Error creating Inventory Transfer', e);
                                var msgSet = 'Error creating Inventory Transfer';
                                if(e.message == 'An unexpected SuiteScript error has occurred'){
                                    msgSet = 'Another process with the same item is being processed, please press the recreate inventory transfer button'
                                }
                                record.submitFields({
                                    type: 'salesorder',
                                    id: soId,
                                    values: { custbody_rda_error_message_ivnt_trf: msgSet },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }
                        }
                    }else{
                        log.debug('qty lowwer')
                        var msg = 'One of the lines in transaction has a Quantity Onhand that is smaller than the Quantity Transfer.'
                        record.submitFields({
                            type: 'salesorder',
                            id: soId,
                            values: { custbody_rda_error_message_ivnt_trf: msg },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                    
                }
                }
            }
        } catch (e) {
            log.debug('Error in afterSubmit', e.name + ': ' + e.message);
        }
    }
    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad,
        beforeSubmit : beforeSubmit
    };
});
