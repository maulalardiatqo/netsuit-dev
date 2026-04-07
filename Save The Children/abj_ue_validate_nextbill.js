/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function beforeLoad(context) {
        log.debug('context.type', context.type)
        try {
            
            if (context.type == context.UserEventType.VIEW) {
                var rec = context.newRecord;
                var recId = rec.id
                var projectName = "";
                var remarks = "";
                var isToValidate = false
                const salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                    ["type","anyof","SalesOrd"], 
                    "AND", 
                    ["internalid","anyof",recId]
                ],
                columns:
                [
                    search.createColumn({name: "entity", label: "Name"}),
                    search.createColumn({name: "applyinglinktype", label: "Applying Link Type"}),
                    search.createColumn({name: "billingschedule", label: "Billing Schedule"}),
                    search.createColumn({name: "custbody11", label: "Payment Remarks"})
                ]
                });
                const searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug("salesorderSearchObj result count",searchResultCount);
                salesorderSearchObj.run().each(function(result){
                    var applyingType = result.getValue({
                        name : "applyinglinktype"
                    })
                    var entity = result.getValue({
                        name : "entity"
                    })
                    var billingSchedule = result.getValue({
                        name : "billingschedule"
                    })
                    var paymentRemarks = result.getValue({
                        name : "custbody11"
                    })
                    if(applyingType == 'OrdBill'){
                        if(billingSchedule == '7'){
                            isToValidate = true
                            projectName = entity
                            remarks = paymentRemarks
                        }
                    }
                    log.debug("applyingType", applyingType);
                    log.debug('data pendukung', { entity : entity, billingSchedule : billingSchedule, paymentRemarks : paymentRemarks})
                    return true;
                });
                if(isToValidate){
                    let dataMap = {};
                    const search1 = search.create({
                        type: "transaction",
                        filters: [["type","anyof","SalesOrd","CustInvc"], "AND", ["mainline","is","T"], "AND", ["jobmain.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "altname", join: "jobMain", summary: "GROUP" }),
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} = 'salesorder' THEN {amount} END, 0))" }),
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} = 'invoice' THEN {amount} END, 0))" })
                        ]
                    });

                    search1.run().each(function(res) {
                        let jobName = res.getValue({ name: "altname", join: "jobMain", summary: "GROUP" });
                        if (jobName) {
                            dataMap[jobName] = {
                                sof: jobName,
                                amtPo: parseFloat(res.getValue(res.columns[1])) || 0,
                                invoice: parseFloat(res.getValue(res.columns[2])) || 0,
                                receipt: 0, 
                                spending: 0, 
                                debit: 0,    
                                percent: '0%'
                            };
                        }
                        return true;
                    });

                    const search2 = search.create({
                        type: "transaction",
                        filters: [["type","anyof","ExpRept","VendBill"], "AND", ["mainline","is","F"], "AND", ["job.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "altname", join: "job", summary: "GROUP" }),
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} IN ('vendbill','expensereport') THEN {amount} END, 0))" })
                        ]
                    });

                    search2.run().each(function(res) {
                        let jobName = res.getValue({ name: "altname", join: "job", summary: "GROUP" });
                        if (dataMap[jobName]) {
                            dataMap[jobName].spending = parseFloat(res.getValue(res.columns[1])) || 0;
                        }
                        return true;
                    });

                    const search3 = search.create({
                        type: "journalentry",
                        filters: [["type","anyof","Journal"], "AND", ["debitamount","greaterthan","0.00"], "AND", ["job.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "altname", join: "job", summary: "GROUP" }),
                            search.createColumn({ name: "debitamount", summary: "SUM" })
                        ]
                    });

                    search3.run().each(function(res) {
                        let jobName = res.getValue({ name: "altname", join: "job", summary: "GROUP" });
                        let debitAmt = parseFloat(res.getValue(res.columns[1])) || 0;
                        
                        if (dataMap[jobName]) {
                            dataMap[jobName].receipt = debitAmt; 
                            
                            if (debitAmt > 0) {
                                let calcPercent = (dataMap[jobName].spending / debitAmt) * 100;
                                dataMap[jobName].percent = calcPercent.toFixed(2) + '%';
                            } else {
                                dataMap[jobName].percent = '0%';
                            }
                        }
                        return true;
                    });
                    
                log.debug('dataMap', dataMap)
                var currentProsent = dataMap.percent
                log.debug('currentProsent', currentProsent)
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        beforeLoad : beforeLoad
    }
})