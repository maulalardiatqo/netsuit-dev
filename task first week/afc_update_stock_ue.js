/**
	 * @NApiVersion 2.1
	 * @NScriptType UserEventScript
	 */
define(['N/search', 'N/record'], function(search, record){
    try{
    function afterSubmit(context) {
        log.debug('Chek')
            var recOld = context.oldRecord;
            var stockavail_checks = [];
            var oldValue = recOld.id;
            log.debug('cek', oldValue)

            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
                stockavail_checks = search.create({
                    type: 'customrecord_abj_stock_onhand',
                    columns: ['internalid','custrecord_abj_stock_item','custrecord_abj_stock_location'],
                    filters: [{name: 'custrecord_abj_stock_item', operator: 'is',values:oldValue },
                ]}).run().getRange(0, 1000);
                // if ((item_list.length>0) && (location_list.length>0)) {
                   
                // }
                log.debug('cek', stockavail_checks)
                var rec = context.newRecord;
                var stockavail_id=0;

                for (var i in stockavail_checks) {
                    var stockavail_check = stockavail_checks[i];
                    // var item_to_check = stockavail_check.getValue({name: 'custrecord_abj_stock_item'})||'';
                    // var location_to_check = stockavail_check.getValue({name: 'custrecord_abj_stock_location'})||'';
                    // if ((itemid==item_to_check)
                    // &&(locationid==location_to_check)) {
                    //     log.debug('item_to_check',item_to_check);
                    //     log.debug('location_to_check',location_to_check);
                    //     log.debug('stockavail_id',stockavail_id);
                    //     break;
                    //  }		
                      stockavail_id = stockavail_check.getValue({name: 'internalid'}); 
                      log.debug('stok', stockavail_id);   
                        var itemtype = rec.getValue({fieldId: 'custitem_abj_item_type'});
                        var stockavailrecord;
                        if (stockavail_id) {
                            stockavailrecord=record.load({
                                type : 'customrecord_abj_stock_onhand',
                                id : stockavail_id,         
                                isDynamic : true
                            });
                        }
                        // stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_item', 
                        //                 value: rec.getValue({fieldId: 'itemid' }), 
                        //                 ignoreFieldChange: true});
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_displayname', 
                                        value: rec.getValue({fieldId: 'displayname'}), 
                                        ignoreFieldChange: true});

                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_desc', 
                                        value: rec.getValue({fieldId: 'purchasedescription'}), 
                                        ignoreFieldChange: true});
                var itemtype = rec.getValue({fieldId: 'custitem_abj_item_type'});						   
                log.debug('itemtype',itemtype);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_itemtype', 
                                        value: itemtype, 
                                        ignoreFieldChange: true});              
                var itemcategory = rec.getValue({fieldId: 'custitem_abj_item_category'});					   
                log.debug('itemcategory',itemcategory);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_itemcategory', 
                                        value: itemcategory, 
                                        ignoreFieldChange: true});
                                        
                var itemsubcategory = rec.getValue({fieldId: 'custrecord_abj_stock_itemsubcategory'});							   
                log.debug('itemsubcategory',itemsubcategory);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_itemsubcategory', 
                                        value: itemsubcategory, 
                                        ignoreFieldChange: true});
                                        
                var itemcolor = rec.getValue({fieldId: 'custitem_abj_item_color'});							   
                log.debug('itemcolor',itemcolor);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_color', 
                                        value: itemcolor, 
                                        ignoreFieldChange: true});

                var itemsize = rec.getValue({fieldId: 'custrecord_abj_stock_size'});							   
                log.debug('itemsize',itemsize);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_size', 
                                        value: itemsize, 
                                        ignoreFieldChange: true});

                var stock_line = rec.getValue({fieldId: 'custitem_abj_item_productline'});							   
                log.debug('stock_line',stock_line);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_line', 
                                        value: stock_line, 
                                        ignoreFieldChange: true});

                var stock_usage = rec.getValue({fieldId: 'custitem_abj_item_usage'});							   
                log.debug('stock_usage',stock_usage);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_usage', 
                                        value: stock_usage, 
                                        ignoreFieldChange: true});

                var stock_gender = rec.getValue({fieldId: 'custitem_abj_item_gender'});							   
                log.debug('stock_gender',stock_gender);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_gender', 
                                        value: stock_gender, 
                                        ignoreFieldChange: true});
                                        
                var item_brand = rec.getValue({fieldId: 'custitem_abj_item_brand'});							   
                log.debug('item_brand',item_brand);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_brand', 
                                        value: item_brand, 
                                        ignoreFieldChange: true});
                var dept = rec.getValue({fieldId: 'custrecord_abj_locn_dept', join: 'inventorylocation'});							   
                log.debug('dept',dept);
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_department', 
                                        value: dept, 
                                        ignoreFieldChange: true});

                var item_year = rec.getValue({fieldId: 'custitem_abj_item_year'});							   
                stockavailrecord.setValue({fieldId: 'custrecord_abj_stock_year', 
                                        value: item_year, 
                                        ignoreFieldChange: true});
                    
                }

                var stockavail_id = stockavailrecord.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        });
                log.debug("save record", stockavail_id);
                return true;
            }
    }
}catch(e){
    log.debug("Error in Update Item Availability", e.name +' : '+e.message);
}
    return {
		afterSubmit: afterSubmit,
	  };
});