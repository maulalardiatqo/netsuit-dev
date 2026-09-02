/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/url", "N/https"], function(
    record,
    search,
    serverWidget,
    runtime,
    url,
    https
    ) {
        function afterSubmit(context) {
            try {
                if (context.type === context.UserEventType.EDIT){
                    const rec  = context.newRecord;
                    const recOld = context.oldRecord;
                    const cekPoType = rec.getValue('custbody_stc_po_type')

                    const bhOld = recOld.getValue('custbody_stc_approval_budget_holder');
                    const bhNew  = rec.getValue('custbody_stc_approval_budget_holder');

                    const faOld = recOld.getValue('custbody_stc_approved_by_finance');
                    const faNew = rec.getValue('custbody_stc_approved_by_finance');
                    const apprStatus = rec.getValue('approvalstatus')
                    if(cekPoType == "3"){
                        var recLoad = record.load({
                            type : rec.type,
                            id : rec.id
                        })
                        log.debug('bhOld', bhOld);
                        log.debug('bhNew', bhNew);
                        if(bhOld == false && bhNew == true && apprStatus != "2"){
                            log.debug('masuk kondisi')
                            recLoad.setValue({
                                fieldId : "approvalstatus",
                                value : "2"
                            })
                        }
                        if(faOld == false && faNew == true && apprStatus != "2"){
                            log.debug('masuk kondisi')
                            recLoad.setValue({
                                fieldId : "approvalstatus",
                                value : "2"
                            })
                        }
                        recLoad.save();
                    }

                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return{
        afterSubmit : afterSubmit
    }
});