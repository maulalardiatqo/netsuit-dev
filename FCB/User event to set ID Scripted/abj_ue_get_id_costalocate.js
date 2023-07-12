/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
){
    function afterSubmit(context) {
    try {
    if (context.type == context.UserEventType.CREATE || 
        context.type == context.UserEventType.EDIT) {
        var rec = context.newRecord;
        var recid = rec.id;
        log.debug('recid', recid);
        var itemName = rec.getValue("custrecord_ca_item_name");
        var inboundShipment = rec.getValue("custrecord_ca_ib_number");
        var grrNumb = rec.getValue("custrecord_ca_grr_number");
        var costCategory = rec.getValue("custrecord_ca_cost_category_name");
            log.debug('details', {
                itemName : itemName,
                inboundShipment : inboundShipment,
                grrNumb : grrNumb,
                costCategory : costCategory
            });
        if(itemName){
            var findItem = search.create({
                type: 'item',
                columns: ['internalid'],
                filters: [{name: 'itemid', operator: 'is',values: itemName},]}).run().getRange(0, 1);	
                log.debug('findItem', findItem);

                var itemId = 0;	

                if(findItem.length>0){
                    itemId = findItem[0].getValue({name: 'internalid'});
                }
                log.debug('itemId', itemId);
        }
        		
       if(inboundShipment){
            var findInbound = search.create({
                type: 'inboundshipment',
                columns: ['internalid'],
                filters: [{name: 'shipmentnumber', operator: 'is',values: inboundShipment},]}).run().getRange(0, 1);	
                log.debug('findInbound', findInbound);

                var inboundID = 0;	

                if(findInbound.length>0){
                    inboundID = findInbound[0].getValue({name: 'internalid'});
                }
                log.debug('inboundID', inboundID);
       }
       if(grrNumb){
            var findGRR = search.create({
                type: 'itemreceipt',
                columns: ['internalid'],
                filters: [{name: 'tranid', operator: 'is',values: grrNumb},]}).run().getRange(0, 1);	
                log.debug('findGRR', findGRR);

                var grrID = 0;	

                if(findGRR.length>0){
                    grrID = findGRR[0].getValue({name: 'internalid'});
                }
                log.debug('grrID', grrID);
        }
        if(costCategory){
            var costID = 0;
            if(costCategory === 'Custom Duties'){
                costID = 3;
            }else if(costCategory === 'Freight Charges'){
                costID = 2;
            }else if(costCategory === 'Handling Charges'){
                costID = 1;
            }else if(costCategory === 'Insurance'){
                costID = 4;
            }
            log.debug('costID', costID)
        }
        costAllocated = record.load({
                            type : 'customrecord330',
                            id : recid,         
                            isDynamic : true
                        });
        
            costAllocated.setValue({
                fieldId: 'custrecord_ca_id_item',
                value: itemId,
            });
            costAllocated.setValue({
                fieldId: 'custrecord_grr_number_iw',
                value: grrID,
            });
            costAllocated.setValue({
                fieldId: 'custrecord_inboundshipitemwise',
                value: inboundID,
            });
            if(costID != 0){
                costAllocated.setValue({
                    fieldId: 'custrecord_item_ca_cost_category',
                    value: costID,
                });
            }
        
        costAllocated.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
        });  
    }
    } catch (e) {
        err_messages = 'error in after submit ' + e.name + ': ' + e.message;
        log.debug(err_messages);
    }
    }
    return {
    afterSubmit: afterSubmit,
    };
});