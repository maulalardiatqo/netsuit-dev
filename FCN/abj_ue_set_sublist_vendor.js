/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE ||  context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
  
                var vendRecord = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                });
                var isAllSub = vendRecord.getValue('custentity_vendor_all');
                if(isAllSub == true){
                    var allIdSub = [];
                    var subsidiarySearchObj = search.create({
                        type: "subsidiary",
                        filters:
                        [
                            ["name","doesnotcontain","xElimination"], 
                            "AND", 
                            ["internalid","noneof","47","48","46","49","50","43","44","45","22"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "legalname", label: "Legal Name"})
                        ]
                    });
                    var searchResultCount = subsidiarySearchObj.runPaged().count;
                    log.debug("subsidiarySearchObj result count",searchResultCount);
                    subsidiarySearchObj.run().each(function(result){
                        var internalIdSub = result.getValue({
                            name : 'internalid'
                        })
                        if(internalIdSub){
                            allIdSub.push(internalIdSub);
                        }
                    return true;
                    });
                    var subCount = vendRecord.getLineCount({
                        sublistId: 'submachine'
                    });
                    if(subCount > 0){
                        for(var index = 0; index < subCount; index++ ){
                            vendRecord.removeLine({
                                sublistId: 'submachine',
                                line: index
                            });
                            
                        }
                    }
                    for (var i = 0; i < allIdSub.length; i++) {
                        log.debug('idsub', allIdSub[i])
                        vendRecord.selectNewLine({
                            sublistId: 'submachine'
                        });
                    
                        vendRecord.setCurrentSublistValue({
                            sublistId: 'submachine',
                            fieldId: 'subsidiary', 
                            value: allIdSub[i]
                        });
                    
                        vendRecord.commitLine({
                            sublistId: 'submachine'
                        });
                    }
                }
                vendRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
            }
            
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});