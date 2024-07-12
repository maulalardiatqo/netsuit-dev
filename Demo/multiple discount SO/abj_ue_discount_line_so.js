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
    
                var recordTRans = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: true
                });
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
                        log.debug('lineDisc', lineDisc);
                        totalLineDisc += Number(lineDisc);
                        var itemId = recordTRans.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        log.debug('itemId', itemId);
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
                    log.debug('totalLineDisc', totalLineDisc)

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