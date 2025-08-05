/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
  ) {
    function beforeSubmit(context){
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var soRec = context.newRecord;
                var typeRec = soRec.type
                log.debug('typeRec', typeRec)
                var cekCustomform = soRec.getValue('customform');
                log.debug('cekCustomform', cekCustomform);
                if( typeRec == "creditmemo" ||  typeRec == "invoice"){
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
                            var amtAsf = soRec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_asf_pembobotan',
                                line: i
                            });
                            if (!groupedData[lineId]) {
                                groupedData[lineId] = [];
                            }

                            groupedData[lineId].push({
                                amount: amount,
                                asfProsent: asfProsent,
                                amtAsf : amtAsf
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
                                    log.debug('isDataCocok', { itemLineId: itemLineId, lineKey: lineKey });
                                    
                                    if (itemLineId == lineKey) {
                                        var qty = parseFloat(soRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'quantity',
                                            line: j
                                        })) || 0;

                                        var totalAmount = 0;
                                        var totalProsent = 0;
                                        var totalAmtAsf = 0;
                                        groupedData[lineKey].forEach(function (item) {
                                            totalAmount += parseFloat(item.amount) || 0;
                                            totalProsent += parseFloat(item.asfProsent) || 0;
                                            totalAmtAsf += parseFloat(item.amtAsf) || 0;
                                        });

                                        var rate = qty > 0 ? (totalAmount / qty) : 0;
                                        var amountPembobotan = rate * qty;
                                        var prorateASF = qty > 0 ? (totalAmtAsf / qty) : 0;
                                        var rateToset = rate + prorateASF;
                                        var amountToset = rateToset * qty;
                                        var amtTax = soRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'tax1amt',
                                            line: j
                                        }) || 0;
                                        var discountAmt = soRec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_abj_disc_line',
                                            line: j
                                        }) || 0;
                                        var grossAmt = (amountToset - discountAmt) + amtTax;

                                        // Set semua field langsung ke line item ke-j
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'price',
                                            line: j,
                                            value: '-1'
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_rate_pembobotan',
                                            line: j,
                                            value: rate
                                        });
                                        log.debug('amountPembobotan set', amountPembobotan)
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_amount_pembobotan',
                                            line: j,
                                            value: amountPembobotan
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_total_amount_asf',
                                            line: j,
                                            value: totalAmtAsf
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_alvaprorateasf',
                                            line: j,
                                            value: prorateASF
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'grossamt',
                                            line: j,
                                            value: grossAmt
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            line: j,
                                            value: rateToset
                                        });
                                        soRec.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            line: j,
                                            value: amountToset
                                        });
                                    }
                                }

                            }
                        }
                        
                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
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
                    (typeRec === "estimate" && cekCustomform == 156) || typeRec == "creditmemo" || typeRec == "returnauthorization" || typeRec == "invoice"){
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
                            var amtAsf = soRec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_asf_pembobotan',
                                line: i
                            });
                            if (!groupedData[lineId]) {
                                groupedData[lineId] = [];
                            }

                            groupedData[lineId].push({
                                amount: amount,
                                asfProsent: asfProsent,
                                amtAsf : amtAsf
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
                                        var totalProsent = 0;
                                        var totalAmtAsf = 0;
                                        log.debug('qty', qty)
                                        groupedData[lineKey].forEach(function(item){
                                            totalAmount += parseFloat(item.amount) || 0;
                                            totalProsent += parseFloat(item.asfProsent) || 0;
                                            totalAmtAsf += parseFloat(item.amtAsf) || 0;
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
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'price',
                                            value: '-1'
                                        })
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
                                        log.debug('totalAmtAsf', totalAmtAsf)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_total_amount_asf',
                                            value: totalAmtAsf
                                        });
                                        var prorateASF = Number(totalAmtAsf) / Number(qty);
                                        log.debug('prorateASF', prorateASF)
                                        var rateToset = (Number(amountPembobotan) / Number(qty)) + Number(prorateASF);
                                        log.debug('rateToset', rateToset)
                                        log.debug('qty', qty)
                                        var amountToset = Number(rateToset) * Number(qty);
                                        log.debug('amountToset 1', amountToset)
                                        
                                        
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_alvaprorateasf',
                                            value: prorateASF
                                        });
                                        var amtTax = soRec.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId : 'tax1amt'
                                        }) || 0;
                                        
                                        var discountAmt = soRec.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId : 'custcol_abj_disc_line'
                                        }) || 0;
                                        log.debug('amtTax', amtTax);
                                        log.debug('discountAmt', discountAmt)
                                        log.debug('amountToset', amountToset)
                                        var grossAmt = (Number(amountToset) - Number(discountAmt)) +(Number(amtTax));
                                        log.debug('grossAmt', grossAmt)
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'grossamt',
                                            value: grossAmt
                                        });
                                        var cekAmount = soRec.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount'
                                        })
                                        log.debug('cekAmount', cekAmount)
                                         soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            value: rateToset,
                                            ignoreFieldChange : true
                                        });
                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            value: amountToset,
                                            ignoreFieldChange : true
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
        afterSubmit : afterSubmit,
        beforeSubmit : beforeSubmit
    };
});