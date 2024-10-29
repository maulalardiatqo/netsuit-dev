/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/config"], function(
    record,
    search,
    config
    ) {
        function afterSubmit(context) {
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                    var rec = context.newRecord;
                    var recLoad = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: true,
                    });
                    var cekLine = recLoad.getLineCount({sublistId: 'item'});
                    var vend1 = '<div style="color: yellow;">Test Vendor1</div>';
                    if (cekLine > 0) {
                        for (var i = 0; i < cekLine; i++) {
                            recLoad.selectLine({
                                sublistId: "item",
                                line: i
                            });
                            
                            recLoad.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_test_po_inline",
                                value: 'test'
                            });
                            
                            recLoad.commitLine({
                                sublistId: "item"
                            });
                        }
                        
                        // Save the record after processing all lines
                        var isSave = recLoad.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        
                        log.debug('isSave', isSave);
                    }
                    
                }
            }catch(e){
                log.debug('err', e)
            }
    }
    return{
        afterSubmit: afterSubmit
    }
});