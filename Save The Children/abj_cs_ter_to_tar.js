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
    function processLine(index, dataList) {
        if (index >= dataList.length) {
            console.log('ALL LINES SUCCESSFULLY COMMITTED');
            return;
        }

        var curRec = currentRecord.get();
        var data = dataList[index];

        console.log('Processing line', index + 1);

        // ==========================
        // SELECT NEW LINE
        // ==========================
        curRec.selectNewLine({
            sublistId: 'recmachcustrecord_tar_id_ter'
        });

        // ==========================
        // SET NORMAL FIELDS
        // ==========================
        if (data.date) {
            var d = data.date.split('/');
            var dateSet = new Date(d[2], d[1] - 1, d[0]);
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tar_expense_date',
                value: dateSet
            });
        }

        if (data.receiptNo) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tar_expense_receipt_no',
                value: data.receiptNo
            });
        }

        if (data.percentage) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_percentage',
                value: percentToNumber(data.percentage)
            });
        }

        if (data.categoryId) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_category',
                value: data.categoryId
            });
        }

        if (data.accountId) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_account',
                value: data.accountId
            });
        }

        if (data.memo) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_memo',
                value: data.memo
            });
        }

        if (data.amount) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_amount',
                value: data.amount
            });
        }

        if (data.costCenterId) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_cost_center',
                value: data.costCenterId
            });
        }

        if (data.projectCode) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_project_code',
                value: data.projectCode
            });
        }

        // ==========================
        // SET FILTER DEPENDENCY FIRST
        // ==========================
        if (data.donorId) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_donor',
                value: data.donorId
            });
        }

        if (data.sourceOfFundingId) {
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_tare_source_of_funding',
                value: data.sourceOfFundingId
            });
        }
        setTimeout(function () {

            if (data.projectTaskId) {
                curRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_tar_id_ter',
                    fieldId: 'custrecord_tare_project_task',
                    value: Number(data.projectTaskId),
                    ignoreFieldChange: true
                });
            }
            if(data.drc){ 
                curRec.setCurrentSublistValue({ 
                    sublistId : 'recmachcustrecord_tar_id_ter', 
                    fieldId : 'custrecord_tar_drc', 
                    value : data.drc 
                }) 
            } 
            if(data.dea){ 
                curRec.setCurrentSublistValue({ 
                    sublistId : 'recmachcustrecord_tar_id_ter', 
                    fieldId : 'custrecord_tar_dea',
                     value : data.dea 
                }) 
            }
            curRec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_set_by_script',
                value: true
            });
            var cekSetByScript = curRec.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_tar_id_ter',
                fieldId: 'custrecord_set_by_script',
            })
            console.log('cekSetByScript', cekSetByScript)
            curRec.commitLine({
                sublistId: 'recmachcustrecord_tar_id_ter'
            });

            console.log('Line committed:', index + 1);

            // ==========================
            // NEXT LINE (SERIAL)
            // ==========================
            processLine(index + 1, dataList);

        }, 450); // jangan < 150ms
    }
    function addLines(allData) {
        processLine(0, allData);
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
                        addLines(allData);

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