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
            function hapusDesimal(angka) {
                return Math.trunc(angka);
            }
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var currPosition = rec.getValue('custrecord_abj_manhour_position');
                var currRate = rec.getValue('custrecord_abj_manhour_rate');
                var currTier = rec.getValue('custrecord__abj_manhour_tier');
                var dataCek = currPosition + '-' + currRate + '-' + currTier 
                log.debug('dataCek', dataCek);
                
                var allDataReady = [];
                var customrecord_abj_man_hour_rateSearchObj = search.create({
                    type: "customrecord_abj_man_hour_rate",
                    filters: [
                        ["custrecord_abj_manhour_position","anyof",currPosition]
                    ],
                    columns: [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custrecord_abj_manhour_position", label: "Position"}),
                        search.createColumn({name: "custrecord_abj_manhour_rate", label: "Rate"}),
                        search.createColumn({name: "custrecord__abj_manhour_tier", label: "Tier"})
                    ]
                });
                var searchResultCount = customrecord_abj_man_hour_rateSearchObj.runPaged().count;
                log.debug("customrecord_abj_man_hour_rateSearchObj result count", searchResultCount);
                
                customrecord_abj_man_hour_rateSearchObj.run().each(function(result) {
                    var position = result.getValue({ name: "custrecord_abj_manhour_position" });
                    var rate = result.getValue({ name: "custrecord_abj_manhour_rate" });
                    if(rate){
                        rate = hapusDesimal(rate)
                    }
                    var tier = result.getValue({ name: "custrecord__abj_manhour_tier" });
                    var data = position + '-' + rate + '-' + tier;
                    allDataReady.push(data);
                    return true;
                });
                log.debug('allDataReady', allDataReady);
                if (allDataReady.includes(dataCek)) {
                    log.debug('dataCek', dataCek);
                    throw new Error('Duplicated data found');
                }
                
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