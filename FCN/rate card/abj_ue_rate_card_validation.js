/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
) {
    function beforeSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var curItem = rec.getValue('custrecord_abj_rate_card_item_name');
                var curComplexLevel = rec.getValue('custrecord_abj_ratecard_complexity_level');
                var curRatePerHour  = rec.getValue('custrecord_abj_rate_hour_type');
                var countLine = rec.getLineCount({
                    sublistId : 'recmachcustrecord_abj_ratecard_id'
                });
                var currCek = []
                var allIItem = []
                if(countLine > 0){
                    for(var i = 0; i < countLine; i++){
                        var position = rec.getSublistValue({
                            sublistId : 'recmachcustrecord_abj_ratecard_id',
                            fieldId : 'custrecord_abj_ratecard_hours_position',
                            line : i
                        });
                        var rateHour = rec.getSublistValue({
                            sublistId : 'recmachcustrecord_abj_ratecard_id',
                            fieldId : 'custrecord_abj_ratecard_hours_position',
                            line : i
                        })
                        allIItem.push({
                            position : position,
                            rateHour : rateHour
                        })
                    }
                }
                currCek.push({
                    curItem : curItem,
                    curComplexLevel : curComplexLevel,
                    curRatePerHour : curRatePerHour,
                    allIItem : allIItem
                });
                var customrecord_abj_ratecardSearchObj = search.create({
                    type: "customrecord_abj_ratecard",
                    filters:
                    [
                        ["custrecord_abj_rate_card_item_name","anyof",curItem]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custrecord_abj_rate_card_item_name", label: "Item Name"}),
                        search.createColumn({name: "custrecord_abj_rate_card_desc", label: "Description"}),
                        search.createColumn({name: "custrecord_abj_ratecard_complexity_level", label: "Complexity Level"}),
                        search.createColumn({name: "custrecord_abj_rate_hour_type", label: "Rate/Hour Type"}),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours_position",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Position"
                        }),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Hours"
                        })
                    ]
                });
                var searchResultCount = customrecord_abj_ratecardSearchObj.runPaged().count;
                log.debug("customrecord_abj_ratecardSearchObj result count",searchResultCount);
                var allDataToCek = []
                customrecord_abj_ratecardSearchObj.run().each(function(result){
                    var item = result.getValue({
                        name: "custrecord_abj_rate_card_item_name"
                    })

                    var compLevel = result.getValue({
                        name: "custrecord_abj_ratecard_complexity_level"
                    })

                    var ratePerHour = result.getValue({
                        name: "custrecord_abj_rate_hour_typecustrecord_abj_rate_hour_type"
                    })

                    var position = result.getValue({
                        name: "custrecord_abj_ratecard_hours_position",
                        join: "CUSTRECORD_ABJ_RATECARD_ID",
                    })

                    var hour = result.getValue({
                        name: "custrecord_abj_ratecard_hours",
                        join: "CUSTRECORD_ABJ_RATECARD_ID",
                    });
                    allDataToCek.push({
                        item : item,
                        compLevel : compLevel,
                        ratePerHour : ratePerHour,
                        position : position,
                        hour : hour
                    })
                    return true;
                });
            }
        } catch (e) {
            log.error('error', e);
            throw e;
        }
    }

return {
    beforeSubmit:beforeSubmit,
};
});