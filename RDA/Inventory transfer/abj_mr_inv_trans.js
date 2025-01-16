/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/task'], function(record, search, log, runtime, task) {

    function getInputData(context) {
        var currentScript = runtime.getCurrentScript();
        var dataToProcess = currentScript.getParameter({ name: 'custscript_id_if' });
        log.debug('dataToProcess', dataToProcess)
        return [
            {
                dataToProcess : dataToProcess,
                cekData : 'cek data'
            }
        ]
        
    }

    function map(context){
        var infoData = JSON.parse(context.value); 
        var ifId = JSON.parse(infoData.dataToProcess);
        log.debug('ifId', ifId)
        var newRec = record.load({
            type : 'itemfulfillment',
            id : ifId,
            isDynamic : false
        });
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
        log.debug('goodStock', goodStock);
        log.debug('outbound',Outbound);
        var department = ''
        var classId = ''
        var soDate = newRec.getValue('trandate');
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
                    log.debug('quantity lebih besar');
                    validateOnhand = false;
                    newRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_it_error_for_do_line',
                        line: i,
                        value: 'Sales order quantity is greater than the quantity on hand'
                    });
                }else{
                    log.debug('quantity lebih kecil');
                    newRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rda_it_error_for_do_line',
                        line: i,
                        value: ''
                    });
                }
                allItem.push({ item: item, units: units, qty: qty });
                
            }
        }
        log.debug('allItem', allItem)
        log.debug('validateOnhand', validateOnhand)
        newRec.save();
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
                createRecord.setValue({ fieldId: 'trandate', value: soDate });
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
                if(saveCreate){
                    record.submitFields({
                        type: 'itemfulfillment',
                        id: ifId,
                        values: { custbody_rda_do_trf_to_gs: saveCreate},
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    record.submitFields({
                        type: 'itemfulfillment',
                        id: ifId,
                        values: { custbody_rda_it_error_for_do_header: '' },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
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
    }

    function reduce(context) {
        
    }

    function summarize(summary) {
        summary.mapSummary.errors.iterator().each(function(key, error, executionNo) {
            log.error({
                title: 'Error with key: ' + key + ', execution number: ' + executionNo,
                details: error
            });
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
