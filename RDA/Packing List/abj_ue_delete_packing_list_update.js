/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format", "N/task"], function (record, search, serverWidget, runtime, currency, redirect, format, task) {

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.DELETE) {
            try{
                var dataRec = context.oldRecord;
                var dataRecID = context.oldRecord.id;
                var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
                log.debug('allIdFul', allIdFul)
                log.debug('allIdFul length', allIdFul.length)
                log.debug('dataRecID', dataRecID)
                if(allIdFul.length > 100){
                    let params = {
                        custscript_id_item_fulfill_mr: dataRecID,
                        custscript_even_trigger_mr: "delete",
                        custscript_all_id_fulfill_mr : allIdFul
                    };
                    let scriptTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_abj_mr_delete_packing_list', 
                        // deploymentId: 'customdeploy_abj_mr_delete_packing_list',
                        params: params
                    });
        
                    let scriptTaskId = scriptTask.submit();
                    log.debug("Scheduled Script Submitted", "Task ID: " + scriptTaskId);
                }else{
                    allIdFul.forEach(function(id) {
                        if (id) {
                            record.submitFields({
                                type: "itemfulfillment",
                                id: id,
                                values: {
                                    custbody_rda_flag_centangpackinglist: false,
                                    custbody_rda_nopol: "",
                                    custbody_rda_packing_list_number: ""
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    });
                }
                
            }catch(e){
                log.debug('error', e)
            }
           
        }
    }
    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            try{
                var dataRec = context.newRecord;
                var dataRecID = context.newRecord.id;
                var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
                var nopol = dataRec.getValue('custbody_rda_packlist_nopol');
                log.debug('allIdFul', allIdFul)
                log.debug('allIdFul length', allIdFul.length)
                log.debug('dataRecID', dataRecID)
                if(allIdFul.length > 100){
                    let params = {
                        custscript_id_item_fulfill_mr : dataRecID,
                        custscript_even_trigger_mr : "create",
                        custscript_all_id_fulfill_mr : ""
                    };

                    let scriptTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_abj_mr_delete_packing_list', 
                        // deploymentId: 'customdeploy_abj_mr_delete_packing_list2',
                        params: params
                    });

                    let scriptTaskId = scriptTask.submit();
                    log.debug("Scheduled Script Submitted", "Task ID: " + scriptTaskId);
                }else{
                    allIdFul.forEach(function(id) {
                        if (id) {
                            record.submitFields({
                                type: "itemfulfillment",
                                id: id,
                                values: {
                                    custbody_rda_flag_centangpackinglist: true,
                                    custbody_rda_nopol: nopol,
                                    custbody_rda_packing_list_number: dataRecID
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    });
                }
                
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit : afterSubmit
    };
});