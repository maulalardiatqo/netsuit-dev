/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/search',"./abj_script_iseller_integration"], (log, record, search,apiISeller) => {

    function createInventoryAdjustment (data){
        try {
            // Create Inventory Adjustment
            const invAdjustment = record.create({
                type: "customrecord_inventory_adjustment",
                isDynamic: true,
            });

            
           
            
            invAdjustment.setValue({
                fieldId: 'customform',
                value: 562, // Replace with the internal ID of your adjustment account
            });
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_adjustment_acc',
                value: data.account, // Replace with the internal ID of your adjustment account
            });

            
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_subsidiary',
                value: data.subsidiary, // Replace with your subsidiary internal ID
            });
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_date',
                value: data.date, // Replace with your subsidiary internal ID
            });
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_location',
                value: data.location, // Replace with your subsidiary internal ID
            });
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_memo',
                value: data.memo, // Replace with your subsidiary internal ID
            });
            invAdjustment.setValue({
                fieldId: 'custrecord_ia_memo_iseller',
                value: data.memoIseller, // Replace with your subsidiary internal ID
            });

            log.debug('NAME', data.name)
            invAdjustment.setValue({
                fieldId : 'name',
                value : data.name
            });

           
            

            data.items.forEach((item) => {
                invAdjustment.selectNewLine({ sublistId: 'recmachcustrecord_iad_id' });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_class',
                    value: item.class, // Replace with your item internal ID
                });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_department',
                    value: item.department, // Replace with your item internal ID
                });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_item',
                    value: item.itemId, // Replace with your item internal ID
                });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_location',
                    value: data.location, // Replace with your item internal ID
                });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_qty',
                    value: item.quantity,
                });
                invAdjustment.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_iad_id',
                    fieldId: 'custrecord_iad_unit',
                    value: item.unit,
                });
                invAdjustment.commitLine({ sublistId: 'recmachcustrecord_iad_id' });
            });

            // Save the inventory adjustment record
            const invAdjId = invAdjustment.save();
            log.debug('Inventory Adjustment Created', `ID: ${invAdjId}`);
            return invAdjId;
        } catch (e) {
            log.error('Error Creating Inventory Adjustment', e.message);
            return null;
        }
    }

    function saveInventoryDetail(invAdjustmentRec,quantity){
        try {
            let inventoryDetailSubrecord = invAdjustmentRec.getCurrentSublistSubrecord({
                sublistId: 'inventory',
                fieldId: 'inventorydetail',
            });

            var lineAssignmentCount = inventoryDetailSubrecord.getLineCount({
                sublistId : "inventoryassignment"
            });
            log.debug('lineAssignmentCount', lineAssignmentCount);
            if(lineAssignmentCount > 0){
                for(var j = 0; j < lineAssignmentCount; j++){
                    inventoryDetailSubrecord.selectLine({
                        sublistId: 'inventoryassignment',
                        line: j,
                    });
                    inventoryDetailSubrecord.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'inventorystatus',
                        value: 1, // Replace with the appropriate status ID
                    });
            
                    // Update Quantity
                    inventoryDetailSubrecord.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: quantity, // Ensure this matches your logic
                    });
            
                    // Commit the changes for the current line
                    inventoryDetailSubrecord.commitLine({
                        sublistId: 'inventoryassignment',
                    });
                    // inventoryDetailSubrecord.commitLine({ sublistId: 'inventoryassignment' });
                }
            }
    
            // // Add a new inventory assignment
            // inventoryDetailSubrecord.selectNewLine({ sublistId: 'inventoryassignment' });
    
            // // inventoryDetailSubrecord.setCurrentSublistValue({
            // //     sublistId: 'inventoryassignment',
            // //     fieldId: 'binnumber', // Bin number (if applicable)
            // //     value: 123 // Replace with a valid bin number
            // // });
            // inventoryDetailSubrecord.setCurrentSublistValue({
            //     sublistId: 'inventoryassignment',
            //     fieldId: 'inventorystatus', // Bin number (if applicable)
            //     value: 1 // Replace with a valid bin number
            // });
    
            // inventoryDetailSubrecord.setCurrentSublistValue({
            //     sublistId: 'inventoryassignment',
            //     fieldId: 'quantity', // Quantity to assign
            //     value: quantity // Replace with your desired quantity
            // });
    
            // inventoryDetailSubrecord.commitLine({ sublistId: 'inventoryassignment' });
        } catch (error) {
            log.debug('ERR : set inv detail', error)
        }
    }

    function createRealInventoryAdjustment(data) {
        try {
            // Create a new Inventory Adjustment record
            const inventoryAdjustment = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });
    
            // Set header-level fields (adjust these based on your data structure)
            inventoryAdjustment.setValue({
                fieldId: 'customform',
                value: 10 // Adjust with your subsidiary internal ID
            });
            inventoryAdjustment.setValue({
                fieldId: 'subsidiary',
                value: data.subsidiary // Adjust with your subsidiary internal ID
            });
            inventoryAdjustment.setValue({
                fieldId: 'account',
                value: data.account // Adjust with your account internal ID
            });
            inventoryAdjustment.setValue({
                fieldId: 'trandate',
                value: data.date // Adjust with your transaction date
            });
            inventoryAdjustment.setValue({
                fieldId: 'adjlocation',
                value: data.location // Adjust with your location internal ID
            });
            inventoryAdjustment.setValue({
                fieldId: 'memo',
                value: data.memo // Adjust with your memo text
            });
    
            // Loop through items in the data
            data.items.forEach(item => {
                inventoryAdjustment.selectNewLine({ sublistId: 'inventory' });
    
                // Set sublist fields for each item
                inventoryAdjustment.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    value: item.itemId // Adjust with your item internal ID
                });

                // const isInventoryItem = inventoryAdjustment.getSublistValue({
                //     sublistId: 'inventory',
                //     fieldId: 'isinventory',
                //     line: i
                // });
                // log.debug('IS INVENTORY', isInventoryItem);

                inventoryAdjustment.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'location',
                    value: data.location // Adjust with your item internal ID
                });
                inventoryAdjustment.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby',
                    value: item.quantity // Adjust with your item quantity
                });

                if(item.quantity < 0){
                    var subrecord = inventoryAdjustment.getCurrentSublistSubrecord({
                        sublistId: 'inventory',
                        fieldId: 'inventorydetail'
                    });
                    
                    subrecord.selectNewLine({sublistId:'inventoryassignment'});
                    subrecord.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: item.quantity});
                    subrecord.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1});
                    subrecord.commitLine({sublistId: 'inventoryassignment'});
                    
                    subrecord.removeLine({sublistId: 'inventoryassignment', line: 1});
                }
                // inventoryAdjustment.setCurrentSublistValue({
                //     sublistId: 'inventory',
                //     fieldId: 'units',
                //     value: item.unit // Adjust with your unit internal ID
                // });
    
                // Commit line
                inventoryAdjustment.commitLine({ sublistId: 'inventory' });
            });
    
            // Save the Inventory Adjustment record
            const inventoryAdjustmentId = inventoryAdjustment.save({
                enableSourcing: false, // Disable sourcing to ignore mandatory fields
                ignoreMandatoryFields: true // Bypass mandatory field validation
            });
            log.debug('REAL Inventory Adjustment Created', `ID: ${inventoryAdjustmentId}`);
            return {
                status : true,
                id : inventoryAdjustmentId,
                message : 'Success create inventory adjustment'
            };
        } catch (e) {
            log.error('Error Creating REAL Inventory Adjustment', e);
            return {
                status : false,
                message : e.message
            };
        }
    }

    function searchItem(sku){
        try {
            var dataSeacrh = search.create({
                type : 'item',
                filters : [
                    ['internalid','is',sku]
                ],
                columns : ['internalid']
            })
    
            var res = dataSeacrh.run().getRange({ start : 0, end:100});
    
            if(res.length == 0){
                return null;
            }
            return res[0].getValue({ name : 'internalid'});
        } catch (error) {
            log.debug('ERR Search Item', error)
            return sku
        }
    }

    function updateCustomInventoryAdjustment(id,data){
        try {
            const invAdjustment = record.load({
                type: "customrecord_inventory_adjustment",
                id : id,
                isDynamic: true,
            });

            if(data.status && data.id){
                invAdjustment.setValue({
                    fieldId: 'custrecord_ia_transaction_no',
                    value: data.id, // Replace with your subsidiary internal ID
                });
            }

            invAdjustment.setValue({
                fieldId: 'custrecord_ia_memo_iseller',
                value: data.message, // Replace with your subsidiary internal ID
            });

            const invAdjId = invAdjustment.save();
            log.debug('Inventory Adjustment Updated', `ID: ${invAdjId}`);
            return invAdjId;
            
        } catch (error) {
            log.debug('Err Update Custom Inventory Adjustment', error)
        }


    }
    function updateCustRecordIR(id,data){
        try {
            const irRecUpdate = record.load({
                type: "customrecord_item_receipt",
                id : id,
                isDynamic: true,
            });

            if(data.status && data.id){
                irRecUpdate.setValue({
                    fieldId: 'custrecord_ir_no_ns',
                    value: data.id, 
                });
            }

            irRecUpdate.setValue({
                fieldId: 'custrecord_ir_memo_iseller',
                value: data.message
            });

            const irCustId = irRecUpdate.save();
            log.debug('Cust IR updated', irCustId);
            return irCustId;
            
        } catch (error) {
            log.debug('Err Update Custom Item Receipt', error)
        }


    }

    function searchCustomInventoryByName(name){
        try {
            var dataSeacrh = search.create({
                type : 'customrecord_inventory_adjustment',
                filters : [
                    ['name','is',name]
                ],
                columns : ['internalid']
            })
    
            var res = dataSeacrh.run().getRange({ start : 0, end:100});
    
            if(res.length == 0){
                return false;
            }else{
                return true;
            }
            
        } catch (error) {
            log.debug('ERR Search Item', error)
        }
    }
    function searchCustomTOByName(name) {
        try {
            var dataSearch = search.create({
                type: 'transferorder',
                filters: [
                    ['tranid', 'is', name],
                    "AND", 
                    ["status","noneof","TrnfrOrd:H","TrnfrOrd:G"]
                ],
                columns: ['internalid']
            });
    
            var res = dataSearch.run().getRange({ start: 0, end: 1 });
    
            if (res.length > 0) {
                var result = res[0];
                var idItem = result.getValue({ name: 'internalid' });
                
                return idItem;
            }else{
                return null
            }
        } catch (error) {
            log.error('Error in searchCustomTOByName', error.message);
            return null; // Kembalikan null jika terjadi kesalahan
        }
    }
    
    function convertToNetSuiteDate(dateTimeString) {
        if (!dateTimeString) {
            throw new Error("Invalid date string");
        }
    
        const dateObject = new Date(dateTimeString);
    
        if (isNaN(dateObject)) {
            throw new Error("Invalid date format");
        }
    
        return dateObject;
    }
    function createCustomItemReceive(data){
        try {
            log.debug('DATA Cust Item Receive',data)
            var extRef = data.ExternalReference
            if(extRef){
                var toId = searchCustomTOByName(extRef);
                if(toId || toId != null){
                    var recCreate = record.create({
                        type : 'customrecord_item_receipt',
                        isDynamic: true,
                    })
                    var nameIr = 'Cust Item Receipt ' + extRef
                    recCreate.setValue({
                        fieldId : 'name',
                        value : nameIr 
                    });
                    var dateIr = convertToNetSuiteDate(data.Date)
                    log.debug('dateIr', dateIr)
                    recCreate.setValue({
                        fieldId : 'custrecord_ir_date',
                        value : data.dateIr 
                    });
                    recCreate.setValue({
                        fieldId : 'custrecord_ir_created_from',
                        value : toId
                    });
                    
                    recCreate.setValue({
                        fieldId : 'custrecord_ir_subsidiary',
                        value : 7
                    });
                    data.Items.forEach((detail => {
                        recCreate.selectNewLine({ sublistId: 'recmachcustrecord_ird_id' });
                        recCreate.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_ird_id',
                            fieldId: 'custrecord_ird_item',
                            value: detail.SKU || ''
                        });
                        recCreate.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_ird_id',
                            fieldId: 'custrecord_ird_quantity',
                            value: detail.AcceptedQuantity || ''
                        });
                        recCreate.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_ird_id',
                            fieldId: 'custrecord_ird_unit',
                            value: 1
                        });
                        recCreate.commitLine({ sublistId: 'recmachcustrecord_ird_id' });
                    }));
                    var saveCustRec = recCreate.save();
                    log.debug('saveCustRec', saveCustRec)
                    return saveCustRec;
                }

            }else{
                return null
            }
        } catch (error) {
            log.debug('ERROR CREEATING CUSTOM ITEM RECEIVE',error)
            return null
        }
    }
    function createRealItemReceive(data){
        try {
            var extRef = data.ExternalReference
            log.debug('extRef', extRef)
            if(extRef){
                var toId = searchCustomTOByName(extRef);
                if(toId || toId != null){
                    var itemsarr = data.Items;
                    log.debug('itemsarr', itemsarr)
                    let itemReceipt = record.transform({
                        fromType: record.Type.TRANSFER_ORDER,
                        fromId: toId,
                        toType: record.Type.ITEM_RECEIPT
                    });
                    itemReceipt.setValue({
                        fieldId: 'memo',
                        value: 'Item Receipt created from Transfer Order via script'
                    });
                    let lineCount = itemReceipt.getLineCount({ sublistId: 'item' });
        
                    for (let i = 0; i < lineCount; i++) {
                        const itemId = itemReceipt.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

                        const matchingItem = itemsarr.find(item => item.SKU === itemId);
                        log.debug('matchingItem', matchingItem)
                        if (matchingItem) {
                            itemReceipt.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                line: i,
                                value: true 
                            });
            
                            itemReceipt.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: matchingItem.AcceptedQuantity
                            });
                        }
                        
                    }
        
                    let itemReceiptId = itemReceipt.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: false
                    });
        
                    log.debug('Item Receipt Created', itemReceiptId);
                    return {
                        status : true,
                        id : itemReceiptId,
                        message : 'Success create Item Receipt'
                    };
                }
            }else{
                return {
                    status : false,
                    message : 'Item Receipt Not Created'
                };
            }

           
        } catch (error) {
            log.error('Error Creating Item Receipt', error);
            return {
                status : false,
                message : error.message
            };
        }
    }

    const execute = (context) => {
        try {
            log.debug('Script Execution Started', { context });

            // Example: Search and update records
            const data = apiISeller.getInventoryAdjustment();
            log.debug('DATA', data);
            data.InventoryAdjustments.forEach((dt) => {

                var dateTime = dt.Date;
                var [year, month, day] = dateTime.split(" ")[0].split("-");
                var date = new Date(`${month}/${day}/${year}`);
                let dataInvAdjustment = {
                    account : 140,
                    date : date,
                    subsidiary:7,
                    name: dt.TransferId,
                    // location : 130,//Jakarta
                    location : 130,// HQ
                    memo : "TEST",
                    memoIseller: "TEST",
                    items :[]
                }
                
                dt.Items.forEach((item)=>{
                    var searchValues = ["6645768127-RED-LRG", "1235716523","6645768127-BLK-SML"];
                    if(searchValues.includes(item.SKU)){
                        return ;
                    }
                    // var itemID = searchItem(item.SKU);
                    var itemID = item.SKU;
                    if(!itemID || itemID == null) return;
                    log.debug('ITEM FOUND', itemID)
                    dataInvAdjustment.items.push({
                        class : 29,
                        department : 1,
                        itemId : itemID,
                        location : 130,
                        quantity : item.Quantity || item.AcceptedQuantity,
                        unit : 1,
                    })
                });

                if(dataInvAdjustment.items == 0) return;
                if(dt.Type == 'opname'){
                    var isExist = searchCustomInventoryByName(dt.TransferId);
                    if(isExist) {
                        log.debug('DATA EXIST','DATA EXIST');
                        return;
                    };
                    var customInvAdj = createInventoryAdjustment(dataInvAdjustment);
                    if(customInvAdj !== null){
                        // dataInvAdjustment.account = 146;
                        var realInvAdj = createRealInventoryAdjustment(dataInvAdjustment);
                        updateCustomInventoryAdjustment(customInvAdj, realInvAdj)
                    }
                }

                if(dt.Type == 'in'){
                    // your code will be here
                    var customItemReceive = createCustomItemReceive(dt);
                    log.debug('customItemReceive', customItemReceive)
                    if(customItemReceive){
                        // dataInvAdjustment.account = 146;
                        var realItemReceive = createRealItemReceive(dt);
                        updateCustRecordIR(customItemReceive, realItemReceive)
                    }
                }
            })
            // results.forEach((result) => {
            //     const internalId = result.getValue({ name: 'internalid' });
            //     log.debug('Processing Item', { internalId });

            //     // Example: Update the item description
            //     record.submitFields({
            //         type: record.Type.INVENTORY_ITEM,
            //         id: internalId,
            //         values: {
            //             custitem_custom_field: 'Updated by Scheduler Script'
            //         }
            //     });
            // });

            // log.audit('Script Execution Completed', `Processed ${results.length} items.`);
        } catch (e) {
            log.error('Error in Scheduler Script', e);
        }
    };

    return { execute };
});
