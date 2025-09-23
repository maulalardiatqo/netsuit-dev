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
                var rec = context.newRecord;
                var cekLinePembobotan = rec.getLineCount('recmachcustrecord_transaction_id');
                log.debug('cekLinePembobotan', cekLinePembobotan)
                 if (cekLinePembobotan > 0) {
                    for (var i = 0; i < cekLinePembobotan; i++) {
                        var isAsf = rec.getSublistValue({
                            sublistId: 'recmachcustrecord_transaction_id',
                            fieldId: 'custrecord_asf_pembobotan',
                            line: i
                        });
                        log.debug('isAsf', isAsf)
                        if (isAsf === true) {
                            var accountAsf = rec.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_alva_accountratecard',
                                line: i
                            });
                            log.debug('accountAsf', accountAsf)
                            if (!accountAsf) {
                                var message = 'Please configure the account in rate card for line ASF';
                                throw message
                            }
                        }
                    }
                }
            }
        }catch(e){
            log.debug('error', e);
            throw e;
        }
    }
return{
        beforeSubmit : beforeSubmit
    };
});