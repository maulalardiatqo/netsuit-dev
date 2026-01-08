/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search'], function (record, search) {

    function afterSubmit(context) {
        try {
            if (
                context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT
            ) {
                return;
            }

            var rec = context.newRecord;

            var recordLoad = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: false
            });
            var cekitem = recordLoad.getLineCount({
                sublistId : 'item'
            });
            log.debug('cekItem', cekitem)
            if(cekitem > 0){
                for(var i = 0; i <cekitem; i++){
                    var amountWht = recordLoad.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_4601_witaxamount',
                        line : i
                    })
                    log.debug('amountWht', amountWht)
                    if(amountWht){
                        recordLoad.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_stc_pph_amount',
                            line : i,
                            value : Math.abs(amountWht)
                        })
                    }
                }
            }
            var cekExpense =  recordLoad.getLineCount({
                sublistId : 'expense'
            })
            log.debug('cekExpense', cekExpense)
            if(cekExpense > 0){
                for(var j = 0; j < cekExpense; j++){
                    var amtWhtExp = recordLoad.getSublistValue({
                        sublistId : 'expense',
                        fieldId : 'custcol_4601_witaxamt_exp',
                        line : i
                    });
                    log.debug('amtWhtExp', amtWhtExp)
                    if(amtWhtExp){
                        recordLoad.setSublistValue({
                            sublistId : 'expense',
                            fieldId : 'custcol_stc_pph_amount',
                            line : i,
                            value : Math.abs(amtWhtExp)
                        })
                    }
                }
            }
            var saveRec = recordLoad.save()
            log.debug('saveRec', saveRec)
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});