/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    var flag = false
    function pageInit(context) {
        console.log('init masuk')
    }
    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        var record = context.currentRecord;
        var cFrom = record.getValue('customform');
        var cekTrigger = records.getValue('custbody_abj_trigger_client')
        if (sublistName == 'recmachcustrecord_iss_pr_parent'){
            if(sublistFieldName == 'custrecord_iss_avg_busdev'){
                var currentRecordObj = context.currentRecord;
                var leadTimeKirim = currentRecordObj.getCurrentSublistValue({
                    sublistId: "recmachcustrecord_iss_pr_parent",
                    fieldId: "custrecord_iss_lead_time",
                });
                console.log('leadTimeKirim', leadTimeKirim)
                log.debug('leadTimeKirim', leadTimeKirim)
                if(leadTimeKirim){
                    var valueRumus = 0
                    var avgBusdev = currentRecordObj.getCurrentSublistValue({
                        sublistId: "recmachcustrecord_iss_pr_parent",
                        fieldId: "custrecord_iss_avg_busdev",
                    });
                    valueRumus = Number(leadTimeKirim) * Number(avgBusdev)
                    console.log('valueRumus', valueRumus);
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_iss_pr_parent",
                        fieldId: "custrecord_iss_rumus_perhitungan",
                        value: valueRumus,
                    });
                }

            } 
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'quantity'){
                console.log('cekTrigger', cekTrigger)
                if(cekTrigger == false){
                    console.log('cForm', cFrom);
                    if(cFrom == '104'){
                        if(flag){
                            return false
                        }
                        var quantity = record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "quantity"
                        });
                        var ratePack = 0

                        var convRate = record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "custcol_abj_ratepacksize"
                        });
                        if(convRate != null && convRate != '' && convRate != undefined){
                            ratePack = convRate
                        }else{
                            ratePack =  record.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId : "custcol_abj_rate_units_decimal"
                            });
                        }
                        console.log('ratePack', ratePack);
                        log.debug('ratePack', ratePack)
                        console.log('quantity', quantity);
                        log.debug('quantity', quantity);
                        var setOrder = Number(quantity) *  Number(ratePack);
                        console.log('setOrder', setOrder);
                        log.debug('setOrder', setOrder)
                        flag = true
                        record.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_pr_total_order",
                            value: setOrder,
                        });
                        flag = false

                    }
                }
                
            }
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_pr_total_order'){
                console.log('cekTrigger', cekTrigger)
                if(cekTrigger == false){
                    console.log('cForm', cFrom);
                    if(cFrom == '104'){
                        if(flag){
                            return false
                        }
                        var order = record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "custcol_pr_total_order"
                        });
                        var ratePack = 0

                        var convRate = record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "custcol_abj_ratepacksize"
                        });
                        if(convRate != null && convRate != '' && convRate != undefined){
                            ratePack = convRate
                        }else{
                            ratePack =  record.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId : "custcol_abj_rate_units_decimal"
                            });
                        }
                        console.log('convRate', convRate);
                        log.debug('convRate' , convRate);
                        console.log('order', order);
                        var setQty = Number(order) /  Number(ratePack);
                        console.log('setQty', setQty);
                        log.debug('setQty', setQty);
                        flag = true
                        record.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: setQty,
                        });
                        flag = false

                    }
                }
                
            }
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_abj_pack_size_order'){
                console.log('cForm', cFrom);
                if(cekTrigger == false){
                    if(cFrom == '104'){
                        if(flag){
                            return false
                        }
                        var order = record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "custcol_pr_total_order"
                        });
                        var packSizeOrder = record.getCurrentSublistText({
                            sublistId: "item",
                            fieldId : "custcol_abj_pack_size_order"
                        });
                        console.log('packSizeOrder', packSizeOrder);
                        console.log('order', order);
                        log.debug('packSizeOrder', packSizeOrder);
                        log.debug('order', order);
                        var rateUnit = 1
                        var unitstypeSearchObj = search.create({
                            type: "unitstype",
                            filters:
                            [
                                ["unitname","is",packSizeOrder]
                            ],
                            columns:
                            [
                                search.createColumn({name: "conversionrate", label: "Rate"})
                            ]
                        });
                        var searchResultUnit = unitstypeSearchObj.run().getRange({start: 0, end: 1});
                        
                        if (searchResultUnit.length > 0) {
                            var rUnit = searchResultUnit[0].getValue({name: "conversionrate"});
                            if(rUnit){
                                rateUnit = rUnit
                            }
                        } 
                        console.log('rateUnit', rateUnit)
                        log.debug('rateUnit', rateUnit)
                        var setQty = Number(order) /  Number(rateUnit);
                        console.log('setQty', setQty);
                        log.debug('setQty', setQty);
                        flag = true
                        record.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: setQty,
                        });
                        record.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_abj_rate_units_decimal",
                            value: rateUnit,
                        });
                        flag = false
                    }
                }
                
            }
        }
        if (sublistName == 'item'){
            if(sublistFieldName == 'custcol_abj_purchase_price_per_kg'){
                console.log('cForm', cFrom);
                if(cFrom == '104'){
                    var priceKg = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_pr_total_order"
                    });
                    var ratePack = 0

                    var convRate = record.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId : "custcol_abj_ratepacksize"
                    });
                    if(convRate != null && convRate != '' && convRate != undefined){
                        ratePack = convRate
                    }else{
                        ratePack =  record.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId : "custcol_abj_rate_units_decimal"
                        });
                    }

                    console.log('convRate', convRate)
                    console.log('priceKg', priceKg)
                    var pricePacking = Number(priceKg) * Number(ratePack);
                    console.log('pricePacking', pricePacking)
                    record.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        value: pricePacking,
                    });
                }
            }
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});