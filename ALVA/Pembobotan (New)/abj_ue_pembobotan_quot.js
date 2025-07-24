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
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
  
                var soRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                });
                var typeRec = rec.type
                log.debug('typeRec', typeRec)
                var cekCustomform = soRec.getValue('customform');
                log.debug('cekCustomform', cekCustomform);
                if((typeRec === "salesorder" && cekCustomform == 157) ||
                    (typeRec === "estimate" && cekCustomform == 156)){
                    var lineCOunt = soRec.getLineCount({
                        sublistId : "recmachcustrecord_transaction_id"
                    })
                    log.debug('linePembobotanCount', lineCOunt)
                    if(lineCOunt > 0){
                        var groupedData = {};
                        for(var i = 0; i < lineCOunt; i++){
                            var lineId = soRec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_id_line',
                                line: i
                            });
                            var amount = soRec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_pembobotan',
                                line: i
                            });
                            var asfProsent = soRec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_asf_prosent',
                                line: i
                            });
                            if (!groupedData[lineId]) {
                                groupedData[lineId] = [];
                            }

                            groupedData[lineId].push({
                                amount: amount,
                                asfProsent: asfProsent
                            });
                            
                        }
                        log.debug('groupedData', groupedData)
                        var itemLineCount = soRec.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug('itemLineCount', itemLineCount)
                        for (var lineKey in groupedData) {
                            
                            log.debug('groupedData.hasOwnProperty(lineKey)', groupedData.hasOwnProperty(lineKey))
                            if (groupedData.hasOwnProperty(lineKey)) {
                                for (var j = 0; j < itemLineCount; j++) {
                                    var itemLineId = soRec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_item_id_pembobotan',
                                        line: j
                                    });
                                    log.debug('isDataCocok', {itemLineId : itemLineId, lineKey : lineKey})
                                    if (itemLineId == lineKey) {
                                        var qty = parseFloat(soRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'quantity',
                                            line: j
                                        })) || 0;

                                        var totalAmount = 0;
                                        var totalProsent = 0
                                        log.debug('qty', qty)
                                        groupedData[lineKey].forEach(function(item){
                                            totalAmount += parseFloat(item.amount) || 0;
                                            totalProsent += parseFloat(item.asfProsent) || 0;
                                        });
                                        log.debug('totalAmount', totalAmount);
                                        log.debug('totalProsent', totalProsent)
                                        var rate = qty > 0 ? (totalAmount / qty) : 0;
                                        log.debug('rate', rate)
                                        log.debug('Set Rate', 'Line: ' + itemLineId + ', Qty: ' + qty + ', Amount: ' + totalAmount + ', Rate: ' + rate);

                                        soRec.selectLine({
                                            sublistId: 'item',
                                            line: j
                                        });
                                        log.debug('rate', rate)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_rate_pembobotan',
                                            value: rate
                                        });
                                        var amountPembobotan = Number(rate) * Number(qty);
                                        log.debug('amountPembobotan', amountPembobotan)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_amount_pembobotan',
                                            value: amountPembobotan
                                        });
                                        var settotalAsf = (Number(amountPembobotan) * Number(totalProsent)) / 100;
                                        log.debug('settotalAsf', settotalAsf)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_total_amount_asf',
                                            value: settotalAsf
                                        });
                                        var prorateASF = Number(settotalAsf) / Number(qty);
                                        var rateToset = (Number(amountPembobotan) / Number(qty)) + Number(prorateASF);
                                        log.debug('rateToset', rateToset)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            value: rateToset
                                        });
                                        var amountToset = Number(rateToset) * Number(qty);
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            value: amountToset
                                        });
                                        
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_alvaprorateasf',
                                            value: prorateASF
                                        });
                                        var grossAmt = Number(amountToset) +(Number(prorateASF) * Number(qty));
                                        log.debug('grossAmt', grossAmt)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'grossamt',
                                            value: amountToset
                                        });
                                        soRec.commitLine({
                                            sublistId: 'item'
                                        });
                                    }
                                }
                            }
                        }
                        soRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                    }
                }
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    };
});