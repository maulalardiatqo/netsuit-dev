/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    function percentToNumber(percentStr) {
        if (!percentStr) return 0;
        return parseFloat(percentStr.replace('%', ''));
    }
    function fieldChanged(context){
        try{
            var curRec = context.currentRecord;
            var fieldName = context.fieldId;
            if(fieldName == 'custrecord_ter_tar_no'){
                var tarNo = curRec.getValue('custrecord_ter_tar_no');
                var recId = curRec.getValue('id');
                console.log('tarNo', tarNo)
                console.log('recId', recId)
                if(tarNo){
                    var allData = []
                    var customrecord_tar_expensesSearchObj = search.create({
                    type: "customrecord_tar_expenses",
                    filters:
                    [
                        ["custrecord_tar_e_id","anyof",tarNo]
                    ],
                    columns:
                    [
                        search.createColumn({name: "custrecord_tar_expense_date", label: "Date"}),
                        search.createColumn({name: "custrecord_tar_expense_receipt_no", label: "Receipt No"}),
                        search.createColumn({name: "custrecord_tare_percentage", label: "Percentage"}),
                        search.createColumn({name: "custrecord_tare_category", label: "Category"}),
                        search.createColumn({name: "custrecord_tare_account", label: "Account"}),
                        search.createColumn({name: "custrecord_tare_memo", label: "Memo"}),
                        search.createColumn({name: "custrecord_tare_amount", label: "Amount"}),
                        search.createColumn({name: "custrecord_tare_cost_center", label: "Cost Center"}),
                        search.createColumn({name: "custrecord_tare_project_code", label: "Project Code"}),
                        search.createColumn({name: "custrecord_tare_donor", label: "SOF"}),
                        search.createColumn({name: "custrecord_tare_project_task", label: "DEA/Activity"}),
                        search.createColumn({name: "custrecord_tare_source_of_funding", label: "Source of Funding"}),
                        search.createColumn({name: "custrecord_tar_drc", label: "DRC"}),
                        search.createColumn({name: "custrecord_tar_dea", label: "DEA"}),
                        search.createColumn({name: "custrecord_tare_approver", label: "Approver"}),
                        search.createColumn({name: "custrecord_tare_approval_status", label: "Approval Status"}),
                        search.createColumn({name: "custrecord_tar_approver_fa", label: "Approver FA"}),
                        search.createColumn({name: "custrecord_tar_apprvl_sts_fa", label: "Approval Status FA"})
                    ]
                    });
                    var searchResultCount = customrecord_tar_expensesSearchObj.runPaged().count;
                    log.debug("customrecord_tar_expensesSearchObj result count",searchResultCount);
                    customrecord_tar_expensesSearchObj.run().each(function(result){
                        var date = result.getValue({ name: 'custrecord_tar_expense_date' });
                        var receiptNo = result.getValue({ name: 'custrecord_tar_expense_receipt_no' });
                        var percentage = result.getValue({ name: 'custrecord_tare_percentage' });

                        var categoryId = result.getValue({ name: 'custrecord_tare_category' });
                        var categoryText = result.getText({ name: 'custrecord_tare_category' });

                        var accountId = result.getValue({ name: 'custrecord_tare_account' });
                        var accountText = result.getText({ name: 'custrecord_tare_account' });

                        var memo = result.getValue({ name: 'custrecord_tare_memo' });
                        var amount = result.getValue({ name: 'custrecord_tare_amount' });

                        var costCenterId = result.getValue({ name: 'custrecord_tare_cost_center' });
                        var costCenterText = result.getText({ name: 'custrecord_tare_cost_center' });

                        var projectCode = result.getValue({ name: 'custrecord_tare_project_code' });

                        var donorId = result.getValue({ name: 'custrecord_tare_donor' });
                        var donorText = result.getText({ name: 'custrecord_tare_donor' });

                        var projectTaskId = result.getValue({ name: 'custrecord_tare_project_task' });
                        var projectTaskText = result.getText({ name: 'custrecord_tare_project_task' });

                        var sourceOfFundingId = result.getValue({ name: 'custrecord_tare_source_of_funding' });
                        var sourceOfFundingText = result.getText({ name: 'custrecord_tare_source_of_funding' });

                        var drc = result.getValue({ name: 'custrecord_tar_drc' });
                        var dea = result.getValue({ name: 'custrecord_tar_dea' });

                        var approverId = result.getValue({ name: 'custrecord_tare_approver' });
                        var approverText = result.getText({ name: 'custrecord_tare_approver' });

                        var approvalStatus = result.getValue({ name: 'custrecord_tare_approval_status' });

                        var approverFaId = result.getValue({ name: 'custrecord_tar_approver_fa' });
                        var approverFaText = result.getText({ name: 'custrecord_tar_approver_fa' });

                        var approvalStatusFa = result.getValue({ name: 'custrecord_tar_apprvl_sts_fa' });

                        allData.push({
                            date: date,
                            receiptNo: receiptNo,
                            percentage: percentage,

                            categoryId: categoryId,
                            categoryText: categoryText,

                            accountId: accountId,
                            accountText: accountText,

                            memo: memo,
                            amount: amount,

                            costCenterId: costCenterId,
                            costCenterText: costCenterText,

                            projectCode: projectCode,

                            donorId: donorId,
                            donorText: donorText,

                            projectTaskId: projectTaskId,
                            projectTaskText: projectTaskText,

                            sourceOfFundingId: sourceOfFundingId,
                            sourceOfFundingText: sourceOfFundingText,

                            drc: drc,
                            dea: dea,

                            approverId: approverId,
                            approverText: approverText,

                            approvalStatus: approvalStatus,

                            approverFaId: approverFaId,
                            approverFaText: approverFaText,

                            approvalStatusFa: approvalStatusFa
                        });
                        return true;
                    });
                    if(allData.length > 0){
                        // recmachcustrecord_tar_id_ter
                        // var rec = record.load({
                        //     type : 'customrecord_ter',
                        //     id : recId,
                        //     isDynamic : true
                        // });
                        var recLine = curRec.getLineCount({
                            sublistId : 'recmachcustrecord_tar_id_ter'
                        })
                        if(recLine > 0){
                            for(var i = 0; i < recLine; i++){
                                var isByScript = curRec.getSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_set_by_script',
                                    line : i
                                })
                                if (isByScript === true || isByScript === 'T') {
                                    curRec.removeLine({
                                        sublistId: 'recmachcustrecord_tar_id_ter',
                                        line: i,
                                        ignoreRecalc: true
                                    });
                                }
                            }
                        }
                        console.log('allData', allData)
                        allData.forEach((data)=>{
                            var date = data.date;
                            console.log('date', date)
                            var receiptNo = data.receiptNo;
                            var percentage = data.percentage;

                            var categoryId = data.categoryId;
                            var categoryText = data.categoryText;

                            var accountId = data.accountId;
                            var accountText = data.accountText;

                            var memo = data.memo;
                            var amount = data.amount;

                            var costCenterId = data.costCenterId;
                            var costCenterText = data.costCenterText;

                            var projectCode = data.projectCode;

                            var donorId = data.donorId;
                            var donorText = data.donorText;

                            var projectTaskId = data.projectTaskId;
                            var projectTaskText = data.projectTaskText;

                            var sourceOfFundingId = data.sourceOfFundingId;
                            var sourceOfFundingText = data.sourceOfFundingText;

                            var drc = data.drc;
                            var dea = data.dea;

                            var approverId = data.approverId;
                            var approverText = data.approverText;

                            var approvalStatus = data.approvalStatus;

                            var approverFaId = data.approverFaId;
                            var approverFaText = data.approverFaText;

                            var approvalStatusFa = data.approvalStatusFa;
                            curRec.selectNewLine({
                                sublistId: "recmachcustrecord_tar_id_ter",
                            });
                            if (date) {
                                var dateParts = date.split('/'); 

                                var dateSet = new Date(
                                    parseInt(dateParts[2], 10),   
                                    parseInt(dateParts[1], 10) - 1,
                                    parseInt(dateParts[0], 10)    
                                );

                                log.debug('dateSet', dateSet);

                                curRec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_tar_id_ter',
                                    fieldId: 'custrecord_tar_expense_date',
                                    value: dateSet
                                });
                            }
                            if(receiptNo){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tar_expense_receipt_no',
                                    value : receiptNo
                                })
                            }
                            if(percentage){
                                console.log('percentage', percentage)
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_percentage',
                                    value : percentToNumber(percentage)
                                })
                            }
                            if(categoryId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_category',
                                    value : categoryId
                                })
                            }
                            if(accountId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_account',
                                    value : accountId
                                })
                            }
                            if(memo){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_memo',
                                    value : memo
                                })
                            }
                            if(amount){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_amount',
                                    value : amount
                                })
                            }
                            if(costCenterId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_cost_center',
                                    value : costCenterId
                                })
                            }
                            if(projectCode){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_project_code',
                                    value : projectCode
                                })
                            }
                            if(donorId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_donor',
                                    value : donorId
                                })
                            }
                            if(sourceOfFundingId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_source_of_funding',
                                    value : sourceOfFundingId
                                })
                            }
                            if(drc){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tar_drc',
                                    value : drc
                                })
                            }
                            if(dea){
                                
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tar_dea',
                                    value : dea
                                })
                            }
                            if(projectTaskId){
                                console.log('projectTaskId', projectTaskId)
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_project_task',
                                    value : projectTaskId
                                })
                            }
                            if(approverId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_approver',
                                    value : approverId
                                })
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tare_approval_status',
                                    value : '1'
                                })
                            }
                            if(approverFaId){
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tar_approver_fa',
                                    value : approverFaId
                                })
                                curRec.setCurrentSublistValue({
                                    sublistId : 'recmachcustrecord_tar_id_ter',
                                    fieldId : 'custrecord_tar_apprvl_sts_fa',
                                    value : '1'
                                })
                            }
                            
                            curRec.setCurrentSublistValue({
                                sublistId : 'recmachcustrecord_tar_id_ter',
                                fieldId : 'custrecord_set_by_script',
                                value : true
                            })
                            curRec.commitLine({ sublistId: 'recmachcustrecord_tar_id_ter' });
                            console.log('afterCommit')
                        })
                        

                    }
                }
            }
        }catch(e){
            console.log('error',  e)
        }       
    }
    
    return {
        fieldChanged : fieldChanged,
    };
});