/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/https', 'N/runtime', 'N/file', 'N/log', 'N/search'], (record, https, runtime, file, log, search) => {
    
    const WEBSITE_API_URL = 'https://sbapproval.phintraco.com/api/netsuite/';


    function setReject(rec){
        rec.setValue({
            fieldId : 'approvalstatus',
            value : '1'
        })
        var cekLine = rec.getLineCount({
            sublistId : 'recmachcustrecord_abj_a_id'
        });
        if(cekLine > 0){
            for(var i = 0; i < cekLine; i++){
                rec.setSublistValue({
                    sublistId : 'recmachcustrecord_abj_a_id',
                    fieldId : 'custrecord_abj_status_approve',
                    value : '1',
                    line : i
                })
            }
        }
    }
    const afterSubmit = (context) => {
        try {
            if(context.type === context.UserEventType.EDIT){
                const recordV = context.newRecord;
                const oldRec = context.oldRecord;
                const idRec = recordV.id
                const rec = record.load({
                    type : recordV.type,
                    id : idRec
                })

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    const beforeLoad = (context) => {
        try{
            if(context.type === context.UserEventType.VIEW){
                var form = context.form;
                const rec = context.newRecord;
                const recId = rec.id
                const roleAdmin = 3
                const cekAppralStat = rec.getValue('approvalstatus');
                log.debug('cekAppralStat', cekAppralStat)
                const cekFlagApproval = rec.getValue('custbody_abj_flag_approval');
                const cekIdWeb = rec.getValue('custbody_id_web');
                log.debug('cekFlagApproval', cekFlagApproval)
                const cekResubmit = rec.getValue('custbody_abj_trigger_resubmit');
                const cekAfterRecall = rec.getValue('custbody_after_recall');
                const cekRevision = rec.getValue('custbody_is_revision');
                const currentRole = runtime.getCurrentUser().role;
                const creatorPo = rec.getValue('custbody_abj_creator');
                log.debug("currentRole", currentRole);
                
                var isAttach = false
                var isApprover = false
                const cekLineAttach = search.create({
                    type: 'customrecord_attachment', 
                    filters: [['custrecord_a_id', 'anyof', recId]],
                    count: true
                }).runPaged().count;
                if(cekLineAttach > 0){
                    isAttach = true
                }
                log.debug('cekLineAttach', cekLineAttach)
                const cekApproverLine = search.create({
                    type: 'customrecord_abj_approval',
                    filters: [['custrecord_abj_a_id', 'anyof', recId]],
                    count: true
                }).runPaged().count;
                    
                log.debug('cekApproverLine', cekApproverLine)
                if(cekApproverLine > 0){
                    isApprover = true
                }
                log.debug('cek kondisi submit approval', {cekAppralStat : cekAppralStat, isApprover : isApprover, isAttach : isAttach})
                if(cekAppralStat == '1' && isApprover && isAttach && !cekIdWeb && creatorPo){
                    form.addButton({
                        id: 'custpage_button_submit_app',
                        label: "Submit For Approval",
                        functionName: "submitApp()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
                // if (currentRole == roleAdmin && (cekIdWeb != '' || cekIdWeb != null)) {
                //     return; 
                // }
                if(cekIdWeb && cekAppralStat != '2' && !cekResubmit && cekAppralStat != '3' && cekAfterRecall == false){
                    form.addButton({
                        id: 'custpage_button_recall',
                        label: "Recall",
                        functionName: "recall()"
                    });
                    form.removeButton('edit');
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
                if(cekIdWeb && cekAppralStat != '2' && !cekResubmit && cekAppralStat != '3' && cekAfterRecall == true){
                    form.addButton({
                        id: 'custpage_button_resubmit_data',
                        label: "Resubmit Data",
                        functionName: "resubmitData()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
                if(cekAppralStat == '2' && cekIdWeb){
                    form.addButton({
                        id: 'custpage_button_resubmit_rev',
                        label: "Resubmit Revision",
                        functionName: "resubmitRevission()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
                if(cekAppralStat == '3' && cekIdWeb){
                    form.addButton({
                        id: 'custpage_button_resubmit_app',
                        label: "Resubmit Approval",
                        functionName: "resubmitApproval()"
                    });
                    form.removeButton('edit');
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
                
            }
            if(context.type === context.UserEventType.COPY){
                const rec = context.newRecord;
                const cekFlagApproval = rec.getValue('custbody_abj_flag_approval');
                log.debug('cekFlagApproval on bfload copy', cekFlagApproval)
                const cekIdWeb = rec.getValue('custbody_id_web');
                const triggerResubmit = rec.getValue('custbody_abj_trigger_resubmit');
                log.debug('cekIdWeb', cekIdWeb);
                rec.setValue({
                    fieldId : 'custbody_id_web',
                    value : ''
                })
                if(cekFlagApproval == true){
                    log.debug('true');
                    // rec.setValue({
                    //     fieldId : 'custbody_abj_flag_approval',
                    //     value : false
                    // })
                }
                if(triggerResubmit){
                    rec.setValue({
                        fieldId : 'custbody_abj_trigger_resubmit',
                        value : false
                    })
                }
                rec.setValue({
                    fieldId: 'custbody_after_recall',
                    value: false
                });
                rec.setValue({
                    fieldId : 'custbody_abj_revision',
                    value : false
                })
                rec.setValue({
                    fieldId : 'custbody_trigger_after_resubmit',
                    value : false
                })
                 rec.setValue({
                    fieldId : 'custbody_is_revision',
                    value : false
                })
                rec.setValue({
                    fieldId : 'custbody_abj_revision_code',
                    value : ''
                })
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }
 return { afterSubmit : afterSubmit, beforeLoad : beforeLoad };
});
