/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
        function roundToTwoDigits(value) {
            return Math.round(value * 100) / 100;
        }
    function countFromCSV(recordTRans){
        var totalAmountAfterDiscount = 0
        var countLine = recordTRans.getLineCount({ sublistId: 'item' });
        if(countLine > 0){
            for (var i = 0; i < countLine; i++) {
                recordTRans.selectLine({
                    sublistId: 'item',
                    line: i
                });
                var totalDiscLine = 0
                var totalAfterDisc = 0
                var amountLine1 = 0
                var amountLine2 = 0
                var amountLine3 = 0
                var amountItem =  recordTRans.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });
                var discountLine1 = recordTRans.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_disc1_so',
                    line: i
                });
                if(discountLine1){
                    var amountDiscLine1 = (Number(discountLine1)/100)*Number(amountItem);
                    amountLine1 = amountDiscLine1
                    totalDiscLine += Number(amountDiscLine1)
                    log.debug('amountDiscLine1', amountDiscLine1);
                    recordTRans.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_disc1_amount_so',
                        value : roundToTwoDigits(amountDiscLine1),
                    });
                    
                }
                var discountLine2 = recordTRans.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_disc2_so',
                    line: i
                });
                if(discountLine2){
                    
                    
                    recordTRans.selectLine({
                        sublistId: 'item',
                        line: i
                    });
                    var currentAmount = Number(amountItem) - Number(amountLine1)
                    var amountDiscLine2 = (Number(discountLine2)/100)*Number(currentAmount);
                    totalDiscLine += Number(amountDiscLine2)
                    amountLine2 = amountDiscLine2
                    log.debug('amountDiscLine2', amountDiscLine2);
                    recordTRans.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_disc2_amount',
                        value : roundToTwoDigits(amountDiscLine2),
                    });
                    
                }

                var discountLine3 = recordTRans.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_disc3_so',
                    line: i
                });
                if(discountLine3){
                    recordTRans.selectLine({
                        sublistId: 'item',
                        line: i
                    });
                    var currentAmount = Number(amountItem) - Number(amountLine1) - Number(amountLine2)
                    var amountDiscLine3 = (Number(discountLine2)/100)*Number(currentAmount);
                    totalDiscLine += Number(amountDiscLine3)
                    log.debug('amountDiscLine2', amountDiscLine2);
                    amountLine3 = amountDiscLine3
                    recordTRans.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_disc3_amount_so',
                        value : roundToTwoDigits(amountDiscLine3),
                    });
                    
                }
                recordTRans.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_total_line_disc_so',
                    value : roundToTwoDigits(totalDiscLine),
                });
                totalAfterDisc = Number(amountItem) - Number(totalDiscLine)
                totalAmountAfterDiscount += Number(totalAfterDisc)
                recordTRans.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_after_disc_line_so',
                    value : roundToTwoDigits(totalAfterDisc),
                });
                recordTRans.commitLine({ sublistId: 'item' });
            }
            log.debug('totalAmountAfterDiscount', totalAmountAfterDiscount)
            var discHead1 = recordTRans.getValue('custbody_abj_disc1_so');
            var discHead1Amount = 0
            var discHead2Amount = 0
            var discHead3Amount = 0
            if(discHead1){
                discHead1Amount = (Number(discHead1)/100)*Number(totalAmountAfterDiscount)
                recordTRans.setValue({
                    fieldId: 'custbody_abj_total_disc1_so',
                    value: roundToTwoDigits(discHead1Amount),
                    ignoreFieldChange: true
                })
            }
            var discHead2 = recordTRans.getValue('custbody_abj_disc2_so');
            if(discHead2){
                discHead2Amount = (Number(discHead2)/100) * (Number(totalAmountAfterDiscount) - Number(discHead1Amount))
                recordTRans.setValue({
                    fieldId: 'custbody_abj_total_disc2_so',
                    value: roundToTwoDigits(discHead2Amount),
                    ignoreFieldChange: true
                })
            }
            var discHead3 = recordTRans.getValue('custbody_abj_disc3_so');
            if(discHead3){
                discHead3Amount = (Number(discHead2)/100) * (Number(totalAmountAfterDiscount) - Number(discHead1Amount) - Number(discHead3Amount))
                recordTRans.setValue({
                    fieldId: 'custbody_abj_total_disc3_so',
                    value: roundToTwoDigits(discHead3Amount),
                    ignoreFieldChange: true
                })
            }
            var totalDiscHead = Number(discHead1Amount) + Number(discHead2Amount) + Number(discHead3Amount)
            recordTRans.setValue({
                fieldId: 'custbody_total_header_disc',
                value: roundToTwoDigits(totalDiscHead),
                ignoreFieldChange: true
            })
            var afterDiscHead = Number(totalAmountAfterDiscount) - Number(totalDiscHead)
            recordTRans.setValue({
                fieldId: 'custbody_abj_total_head_after_disc',
                value: roundToTwoDigits(afterDiscHead),
                ignoreFieldChange: true
            })
        }
    }
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {

                var rec = context.newRecord;
    
                var recordTRans = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: true
                });
                var source = recordTRans.getValue('source');
                log.debug('source', source);
                if(source == 'CSV'){
                    log.debug('masuk kondisi csv')
                    countFromCSV(recordTRans);
                }
                var countLine = recordTRans.getLineCount({ sublistId: 'item' });
                log.debug('countLine', countLine);
               
                if(countLine > 0){
                    var totalLineDisc = 0
                    var lineToRemove = [];
                    for (var i = 0; i < countLine; i++) {
                        var lineDisc = recordTRans.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_abj_total_line_disc_so',
                            line: i
                        });
                        totalLineDisc += Number(lineDisc);
                        var itemId = recordTRans.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        if (itemId == "1545" || itemId == "1546") {
                            lineToRemove.push(i);
                        }
                    }
                    
                    for (var i = lineToRemove.length - 1; i >= 0; i--) {
                        recordTRans.removeLine({
                            sublistId: 'item',
                            line: lineToRemove[i]
                        });
                    }
                    totalLineDisc *= -1;

                    recordTRans.selectNewLine({
                        sublistId: "item",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: "1546",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "price",
                        value: "-1",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        value: totalLineDisc,
                    });
                    recordTRans.commitLine("item");

                    var head1 = recordTRans.getValue('custbody_abj_total_disc1_so') || 0
                    var head2 = recordTRans.getValue('custbody_abj_total_disc2_so') || 0
                    var head3 = recordTRans.getValue('custbody_abj_total_disc3_so') || 0
                    var totalHead = Number(head1) + Number(head2) + Number(head3)
                    totalHead *= -1;
                    recordTRans.selectNewLine({
                        sublistId: "item",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: "1545",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "price",
                        value: "-1",
                    });
                    recordTRans.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        value: totalHead,
                    });
                    recordTRans.commitLine("item");
                }
                var recId = recordTRans.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true,
                });
                log.debug('recId', recId);
            }
        }catch(e){
            log.debug('error', e)
        }
    }

    return {
        afterSubmit: afterSubmit,
    };
});