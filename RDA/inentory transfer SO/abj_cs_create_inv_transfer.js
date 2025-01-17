/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        console.log('init masuk');
    }
    function createRec(context) {
        var processMsg = message.create({
            title: "Processing",
            message: "On Process. Please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            try {
                processTransaction(processMsg);
            } catch (e) {
                processMsg.hide(); 
                log.error("Error", e);
                dialog.alert({
                    title: "Error",
                    message: "An unexpected error occurred: " + e.message
                });
            }
        }, 500); 
    }
    function processTransaction(processMsg){
        var rec = records;
        var soId = rec.id;
        var newRec = record.load({
            type : record.Type.SALES_ORDER,
            id : soId,
            isDynamic : false
        });
        console.log('soId', soId);
        var subsId = newRec.getValue('subsidiary');
        console.log('subsId', subsId);
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
        console.log('goodStock', goodStock);
        console.log('outbound',Outbound);
        var department = newRec.getValue('department');
        console.log('department', department);
        var classId = newRec.getValue('class');
        console.log('classId', classId);
        var soDate = newRec.getValue('trandate');
        var location = newRec.getValue('location');
        console.log('soDate', soDate);
    
        var validateOnhand = true;
        var allItem = [];
        var cekLineCount = newRec.getLineCount('item');
        console.log('cekLineCount', cekLineCount);
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
                    console.log("Quantity On Hand", quantityOnHand);
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
                
                var isFulfill = newRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'fulfillable',
                    line: i
                });
    
                if (isFulfill == true) {
                    if(qty > quantityOnHand){
                        console.log('quantity lebih besar', {qty : qty, quantityOnHand : quantityOnHand});
                        console.log('cekLine ke', i)
                        validateOnhand = false;
                        newRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_rda_error_message_line',
                            line: i,
                            value: 'Sales order quantity is greater than the quantity on hand'
                        });
                    }else{
                        console.log('quantity lebih kecil');
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
            processMsg.hide();
            dialog.alert({
                title: "Error",
                message: msg
            }).then(function () {
                window.location.reload(); 
            });
            return; 
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
                createRecord.setValue({ fieldId: 'trandate', value: soDate });
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
                console.log('saveCreate', saveCreate);
                if(saveCreate){
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
                    processMsg.hide();
                    dialog.alert({
                        title: "Success",
                        message: "Process completed successfully."
                    }).then(function () {
                        window.location.reload();
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
                processMsg.hide();
                dialog.alert({
                    title: "Error",
                    message: "Quantity on hand is insufficient."
                }).then(function () {
                    window.location.reload(); 
                });
            }
        }
    }
    
    return {
        pageInit: pageInit,
        createRec: createRec
    };
});
