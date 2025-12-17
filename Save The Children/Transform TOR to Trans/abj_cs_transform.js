/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], 
function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {

    function pageInit(context) {
        console.log("Page init: script aktif");
    }
    function getData(transType) {
        var records = currentRecord.get();
        var recId = records.id;

        console.log('recId', recId);
        console.log('transType', transType);

        if (!recId) return [];

        var recLoad = record.load({
            type: 'customrecord_tor',
            id: recId
        });

        var date = recLoad.getValue('custrecord_tor_date');
        var emp  = recLoad.getValue('custrecord_tor_create_by');

        var cekLine = recLoad.getLineCount({
            sublistId: 'recmachcustrecord_tori_id'
        });

        console.log('cekLine', cekLine);

        var dataTransform = [];

        if (cekLine > 0) {
            for (var i = 0; i < cekLine; i++) {

                var transactionType = recLoad.getSublistValue({
                    sublistId: 'recmachcustrecord_tori_id',
                    fieldId: 'custrecord_tor_transaction_type',
                    line: i
                });

                console.log('transactionType', transactionType);
                if (transactionType === transType) {
                    console.log('masuk eksekusi');

                    var cekLink = recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tor_link_trx_no',
                        line: i
                    });

                    if (!cekLink) {
                        dataTransform.push({
                            date: date,
                            emp: emp,
                            dea: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tor_dea',
                                line: i
                            }),
                            drc: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tor_drc',
                                line: i
                            }),
                            project: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tor_project',
                                line: i
                            }),
                            projectTask: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tor_project_task',
                                line: i
                            }),
                            transactionType: transactionType,
                            idTor : recId,
                            amount: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_amount',
                                line: i
                            }),
                            approver: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_approver',
                                line: i
                            }),
                            approverFa: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_approver_fa',
                                line: i
                            }),
                            costCenter: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_cost_center',
                                line: i
                            }),
                            item: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_item',
                                line: i
                            }),
                            projectCode: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_project_code',
                                line: i
                            }),
                            sof: recLoad.getSublistValue({
                                sublistId: 'recmachcustrecord_tori_id',
                                fieldId: 'custrecord_tori_source_of_funding',
                                line: i
                            })
                        });
                    }
                }
            }
        }

        return dataTransform;
    }

    function transformPO(){
        var dataParams = getData('1')
        console.log('dataParams', dataParams)
        var dataParamsString = JSON.stringify(dataParams)
        var createURL = url.resolveRecord({
            recordType: "purchaseorder",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }
    function transformPR(){
        var dataParams = getData('3')
        var dataParamsString = JSON.stringify(dataParams)
        console.log('dataParamsString', dataParamsString)
        var createURL = url.resolveRecord({
            recordType: "purchaserequisition",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }
    function transformExp(){
        var dataParams = getData('2')
        console.log('dataParams', dataParams)
        var dataParamsString = JSON.stringify(dataParams)
        var createURL = url.resolveRecord({
            recordType: "expensereport",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }
    return{
        pageInit : pageInit,
        transformPO : transformPO,
        transformPR : transformPR,
        transformExp : transformExp
    }
});