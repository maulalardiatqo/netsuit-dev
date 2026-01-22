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
                log.debug('triggerred')
                var rec = context.newRecord
                var idRec = rec.id
                var recLoad = record.load({
                    type : rec.type,
                    id : idRec
                })
                log.debug('idRec', idRec);
                var allTotal = 0
                var totalStc = 0
                var totalPartNer = 0
                var totalMix = 0
                var projecttaskSearchObj = search.create({
                type: "projecttask",
                filters:
                [
                    ["status","anyof","PROGRESS","NOTSTART"], 
                    "AND", 
                    ["cost","greaterthan","0.00"], 
                    "AND", 
                    ["job.internalid","anyof",idRec]
                ],
                columns:
                [
                    search.createColumn({name: "cost", label: "Estimated Cost"}),
                    search.createColumn({name: "custevent3", label: "Implementing By"}),
                    search.createColumn({
                        name: "cost",
                        join: "projectTaskAssignment",
                        label: "Cost"
                    })
                ]
                });
                var searchResultCount = projecttaskSearchObj.runPaged().count;
                log.debug("projecttaskSearchObj result count",searchResultCount);
                projecttaskSearchObj.run().each(function(result){
                    var cost = result.getValue({
                        name : 'cost'
                    });
                    var impBy = result.getValue({
                        name : 'custevent3'
                    })
                    allTotal = Number(allTotal) + Number(cost)
                    if(impBy == '1'){
                        totalStc = Number(totalStc) + Number(cost);
                    }
                    if(impBy == '2'){
                        totalPartNer = Number(totalPartNer) + Number(cost)
                    }
                    if(impBy == '3'){
                        totalMix = Number(totalMix) + Number(cost)
                    }
                    log.debug('data', {
                        cost : cost,
                        impBy : impBy
                    })
                return true;
                });
                log.debug('allTotal', allTotal)
                recLoad.setValue({
                    fieldId : 'custentity_stc_project_total_cost',
                    value : allTotal
                })
                recLoad.setValue({
                    fieldId : 'custentity_stc_implementing_by_stc',
                    value : totalStc
                })
                recLoad.setValue({
                    fieldId : 'custentity_stc_implementing_by_partner',
                    value : totalPartNer
                })
                recLoad.setValue({
                    fieldId : 'custentity_stc_implementing_by_stc_partn',
                    value : totalMix
                })
                recLoad.save()
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit
    }
});