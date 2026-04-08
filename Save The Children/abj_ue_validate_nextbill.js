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
                if (isToValidate) {
                    let dataMap = {}; 
                    
                    const search1 = search.create({
                        type: "transaction",
                        filters: [["type","anyof","SalesOrd","CustInvc"], "AND", ["mainline","is","T"], "AND", ["jobmain.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "altname", join: "jobMain", summary: "GROUP" }),
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "NVL(CASE WHEN {recordType} = 'salesorder' THEN {amount} END, 0)" }),
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "NVL(CASE WHEN {recordType} = 'invoice' THEN {amount} END, 0)" })
                        ]
                    });

                    search1.run().each(function(res) {
                        let jobName = res.getValue({ name: "altname", join: "jobMain", summary: "GROUP" });
                        dataMap = {
                            sof: jobName,
                            amtPo: parseFloat(res.getValue(res.columns[1])) || 0,
                            invoice: parseFloat(res.getValue(res.columns[2])) || 0,
                            receipt: 0, 
                            spending: 0, 
                            debit: 0,    
                            percent: '0%'
                        };
                        return false; 
                    });

                    const search2 = search.create({
                        type: "transaction",
                        filters: [["type","anyof","ExpRept","VendBill"], "AND", ["mainline","is","F"], "AND", ["job.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "NVL(CASE WHEN {recordType} IN ('vendbill','expensereport') THEN {amount} END, 0)" })
                        ]
                    });

                    search2.run().each(function(res) {
                        dataMap.spending = parseFloat(res.getValue(res.columns[0])) || 0;
                        return false;
                    });

                    const search3 = search.create({
                        type: "journalentry",
                        filters: [["type","anyof","Journal"], "AND", ["debitamount","greaterthan","0.00"], "AND", ["job.internalid","anyof",projectName]],
                        columns: [
                            search.createColumn({ name: "debitamount", summary: "SUM" })
                        ]
                    });

                    search3.run().each(function(res) {
                        let debitAmt = parseFloat(res.getValue(res.columns[0])) || 0;
                        dataMap.receipt = debitAmt; 
                        
                        if (debitAmt > 0) {
                            let calcPercent = (dataMap.spending / debitAmt) * 100;
                            dataMap.percent = calcPercent.toFixed(2);
                        } else {
                            dataMap.percent = 0;
                        }
                        return false;
                    });
                    
                    log.debug('dataMap', dataMap);
                    
                    var currentProsent = dataMap.percent;
                    var numbRemarks = Number(remarks);
                    log.debug('numbRemarks', numbRemarks)
                    log.debug('currentProsent', currentProsent);
                    if(currentProsent < numbRemarks){
                        log.debug('masuk validasi')
                        context.form.removeButton({ id: 'nextbill' });
                        context.form.removeButton({id : 'billremaining'});
                        context.form.addButton({
                            id: 'custpage_next_bill_custom',
                            label: 'Next Bill',
                            functionName: 'alertValidation' 
                        });
                        context.form.addButton({
                            id: 'custpage_bill_remain_custom',
                            label: 'Bill Remaining',
                            functionName: 'alertValidation' 
                        });
                        context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_validate_nextbill.js';
                    }
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