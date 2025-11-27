/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
  function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW){
            try {
                var rec = context.newRecord;
                var cekApprovalLevel = rec.getValue('custrecord_approval_level');
                log.debug('cekApprovalLevel', cekApprovalLevel)
                if(cekApprovalLevel != '3' && cekApprovalLevel != '4'){
                    context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_pengajuan_dana.js';
                }
                
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    function afterSubmit(context){
        var rec = context.newRecord;
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY){
            var recordCust = record.load({
                type : 'customrecord_request_for_fund',
                id : rec.id
            })
            var totalAMount = 0;
            var cekLine = recordCust.getLineCount({
                sublistId : 'recmachcustrecord_fund_head'
            })
            log.debug('cekLine', cekLine)
            if(cekLine > 0){
                for(var i = 0; i < cekLine; i++){
                    var amt = recordCust.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_head',
                        fieldId : 'custrecord_fund_amount',
                        line : i
                    })
                    if(amt){
                        totalAMount = Number(totalAMount) + Number(amt)
                    }
                }
            }
            log.debug('totalAMount', totalAMount);
            if(totalAMount){
                recordCust.setValue({
                    fieldId : 'custrecord_total_pengajuan_dana',
                    value : totalAMount
                })
            }
            recordCust.save()
        }
    }
    return{
        beforeLoad : beforeLoad,
        afterSubmit : afterSubmit
    }
});