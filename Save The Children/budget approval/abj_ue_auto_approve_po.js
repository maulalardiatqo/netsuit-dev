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
                    const typeRec = rec.type
                    const poType = rec.getValue('custbody_stc_po_type');
                    log.debug('typeRec', typeRec);
                    log.debug('poType', poType)
                    if(typeRec == "purchaseorder" && poType == "1"){
                        var oldApprFA = recOld.getValue('custbody_stc_approved_by_finance');
                        var newApprFA = rec.getValue('custbody_stc_approved_by_finance');
                        const apprStatus = rec.getValue('approvalstatus')
                        log.debug('oldApprFA', oldApprFA)
                        log.debug('newApprFA', newApprFA)
                        if(oldApprFA == false && newApprFA == true && apprStatus != "2"){
                            log.debug('masuk Kondisi')
                            var recLoad = record.load({
                                type : rec.type,
                                id : rec.id
                            })
                            recLoad.setValue({
                                fieldId : "approvalstatus",
                                value : "2"
                            })
                            var cekApproval = recLoad.getValue('approvalstatus');
                            log.debug('cekApproval', cekApproval)
                            recLoad.save();
                        }
                    }
                    
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return{
            afterSubmit : afterSubmit
        }
    })