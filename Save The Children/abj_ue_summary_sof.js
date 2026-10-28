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
                var allDataParent = [];
                var allDataChild = [];
                var totalBudgetYear1 = 0
                var opportunity = 0;
                const projectbudgetSearchObj = search.create({
                type: "projectbudget",
                filters:
                [
                    ["project","anyof",idRec], 
                    "AND", 
                    ["estimateatcompletion","is","T"]
                ],
                columns:
                [
                    search.createColumn({name: "totalcost", label: "Total Cost"})
                ]
                });
                const searchResultCountEacTotalCost = projectbudgetSearchObj.runPaged().count;
                log.debug("projectbudgetSearchObj result count",searchResultCountEacTotalCost);
                projectbudgetSearchObj.run().each(function(result){
                    opportunity = result.getValue({
                        name : "totalcost"
                    })
                return true;
                });
                log.debug('opportunity', opportunity)
                // ========/
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
                    }),
                    search.createColumn({name: "parent", label: "Parent Task"}),
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "custevent13", label: "Budget Year 2"}),
                    search.createColumn({name: "custevent14", label: "Budget Year 3"}),
                    search.createColumn({name: "custevent15", label: "Budget Year 4"}),
                    search.createColumn({name: "custevent16", label: "Budget Year 5"})
                ]
                });
                var costStc = [];
                var costPartner = [];
                var costMix = [];
                var searchResultCount = projecttaskSearchObj.runPaged().count;
                log.debug("projecttaskSearchObj result count",searchResultCount);
                projecttaskSearchObj.run().each(function(result){
                    var cost = result.getValue({
                        name : 'cost'
                    }) || 0
                    var by2 = result.getValue({
                        name : 'custevent13'
                    }) || 0
                    var by3 = result.getValue({
                        name : 'custevent14'
                    }) || 0
                    var by4 = result.getValue({
                        name : 'custevent15'
                    }) || 0
                    var by5 = result.getValue({
                        name : 'custevent16'
                    }) || 0
                    var impBy = result.getValue({
                        name : 'custevent3'
                    })
                   
                    var parent = result.getValue({
                        name: "parent"
                    })
                    var idProject = result.getValue({
                        name : "internalid"
                    })
                    var parentTrim = (parent === null || parent === undefined) ? '' : String(parent).trim();
                    if (parentTrim === '' || parentTrim === 'false') {
                        log.debug('masuk kondisi parent')
                        allTotal = Number(allTotal) + Number(cost) + Number(by2) + Number(by3) + Number(by4) + Number(by5)
                        totalBudgetYear1 = Number(totalBudgetYear1) + Number(cost)
                        allDataParent.push({
                            idProject : idProject,
                            cost : cost
                        })
                    }else{
                        log.debug('not to summary')
                        allDataChild.push({
                            impBy : impBy,
                            idProject : idProject,
                            cost : cost,
                            parent : parent
                        })
                        if(impBy == '1'){
                            totalStc = Number(totalStc) + Number(cost) + Number(by2) + Number(by3) + Number(by4) + Number(by5);
                            log.debug('totalStc', totalStc)
                            costStc.push(cost)
                        }
                        if(impBy == '2'){
                            totalPartNer = Number(totalPartNer) + Number(cost) + Number(by2) + Number(by3) + Number(by4) + Number(by5);
                            log.debug('totalPartNer', totalPartNer)
                            costPartner.push(cost)
                        }
                        if(impBy != '1' && impBy != '2'){
                            totalMix = Number(totalMix) + Number(cost) + Number(by2) + Number(by3) + Number(by4) + Number(by5);
                            log.debug('totalMix', totalMix)
                            costMix.push(cost)
                        }
                        log.debug('data', {
                            cost : cost,
                            impBy : impBy
                        })
                    }
                return true;
                });
                log.debug('allTotal', allTotal)
                //set ke total budget
                recLoad.setValue({
                    fieldId : 'custentity7',
                    value : allTotal
                })
                recLoad.setValue({
                    fieldId : "custentity4",
                    value : opportunity
                })
                var oportunityAmount = recLoad.getValue('custentity4') || 0;
                log.debug('oportunityAmount', oportunityAmount)
                var variance = (Number(oportunityAmount) - Number(allTotal)).toFixed(2)
                log.debug('variance', variance)
                log.debug()
                log.debug('total tolal', {
                    totalStc : [totalStc, costStc],
                    totalPartNer : [totalPartNer, costPartner],
                    totalMix : [totalMix, costMix],
                    totalBudgetYear1 : totalBudgetYear1
                })
                recLoad.setValue({
                    fieldId : 'custentity5',
                    value : variance
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
                recLoad.setValue({
                    fieldId : 'custentity_stc_project_total_cost',
                    value : totalBudgetYear1
                })
                var excRate = recLoad.getValue('fxrate');
                log.debug('excRate', excRate)
                var totalInIDR = Number(allTotal) * Number(excRate)
                recLoad.setValue({
                    fieldId : 'custentity_sos_project_total_cost',
                    value : totalInIDR
                })
                log.debug('allDataParent', allDataParent);
                log.debug('allDataChild', allDataChild);
                if (allTotal > 0) {
                    allDataParent.forEach(function(item) {
                        var percentage = (item.cost / allTotal) * 100;
                        record.submitFields({
                            type: 'projecttask',
                            id: item.idProject,
                            values: { 'custevent6': percentage.toFixed(2) } 
                        });
                    });
                    allDataChild.forEach(function(item) {
                        var percentage = (item.cost / allTotal) * 100;
                        record.submitFields({
                            type: 'projecttask',
                            id: item.idProject,
                            values: { 'custevent6': percentage.toFixed(2) }
                        });
                    });
                }
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