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
            log.debug('context.type', context.type)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var idRec = rec.id;
                var recBill = record.load({
                    type : "vendorbill",
                    id : idRec,
                });
                var cekLineCount = recBill.getLineCount({
                    sublistId : "item"
                })
                var whtValue = "";
                if (cekLineCount > 0) {
                    for (var i = 0; i < cekLineCount; i++) {
                        var whtRate = recBill.getSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_4601_witaxrate",
                            line: i
                        });
                        log.debug('whtRate', whtRate)
                        if (whtRate) {
                            whtValue = whtRate;
                            break;
                        }
                    }
                }
                if(whtValue){
                    log.debug('whtValue', whtValue)
                    recBill.setValue({
                        fieldId : "custbody_sos_tarif",
                        value : whtValue,
                        ignoreFieldChange : true
                    })
                }
                var saveBill = recBill.save();
                log.debug('saveBill', saveBill)
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});