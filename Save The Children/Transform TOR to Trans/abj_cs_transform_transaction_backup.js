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

        var date = recLoad.getText('custrecord_tor_date');
        var emp  = recLoad.getValue('custrecord_tor_create_by');
        var timeFrom = recLoad.getText('custrecord_tor_timeline_p_from');
        var timeTo = recLoad.getText('custrecord_tor_timeline_period_to');
        var noTor = recLoad.getValue('name');

        var cekLine = recLoad.getLineCount({
            sublistId: 'recmachcustrecord_tori_id'
        });

        console.log('cekLine', cekLine);

        var dataTransform = [];
        var linkedTrxIds = [];
        var sofTorAmountMap = {}; 
        var sofAllocatedAmountMap = {};
        var sofDataMap = {}; 

        var linkFieldId = (transType === '4') ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';

        if (cekLine > 0) {
            for (var i = 0; i < cekLine; i++) {
                
                var cekLink = recLoad.getSublistValue({
                    sublistId: 'recmachcustrecord_tori_id',
                    fieldId: linkFieldId,
                    line: i
                });

                if (cekLink && cekLink !== '') {
                    if (Array.isArray(cekLink)) {
                        cekLink.forEach(function(singleId) {
                            if (singleId && linkedTrxIds.indexOf(singleId.toString()) === -1) {
                                linkedTrxIds.push(singleId.toString());
                            }
                        });
                    } else {
                        if (linkedTrxIds.indexOf(cekLink.toString()) === -1) {
                            linkedTrxIds.push(cekLink.toString());
                        }
                    }
                }

                var transactionType = recLoad.getSublistValue({
                    sublistId: 'recmachcustrecord_tori_id',
                    fieldId: 'custrecord_tor_transaction_type',
                    line: i
                });

                if (transactionType === transType) {
                    var sof = recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tor_project',
                        line: i
                    });

                    var amount = parseFloat(recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tori_amount',
                        line: i
                    })) || 0;

                    var allocated = parseFloat(recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_amount_allocated',
                        line: i
                    })) || 0;

                    var lineData = {
                        noTor : noTor,
                        date: date,
                        emp: emp,
                        timeFrom : timeFrom,
                        timeTo : timeTo,
                        dea: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_dea', line: i }),
                        drc: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_drc', line: i }),
                        project: sof,
                        projectTask: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project_task', line: i }),
                        transactionType: transactionType,
                        idTor : recId,
                        amount: amount, 
                        approver: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_approver', line: i }),
                        approverFa: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_approver_fa', line: i }),
                        costCenter: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_cost_center', line: i }),
                        item: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_item', line: i }),
                        projectCode: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_project_code', line: i }),
                        sof: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_source_of_funding', line: i }),
                        bussinessUnit: recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_business_unit', line : i }),
                        idLine : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'id', line : i }),
                        activityCode : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_activity_code', line : i }),
                        description : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_description', line : i }),
                        unitCost : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_unit_cost', line : i }),
                        qty : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_quantity', line : i }),
                        uom : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_uom', line : i }),
                        vendor : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_rpv_vendor', line : i})
                    };

                    if (sof) {
                        var sofStr = sof.toString();
                        console.log('amount', amount);
                        console.log('allocated', allocated);

                        if (!sofTorAmountMap[sofStr]) sofTorAmountMap[sofStr] = 0;
                        sofTorAmountMap[sofStr] += amount;
                        sofAllocatedAmountMap[sofStr] = allocated;

                        if (!sofDataMap[sofStr]) {
                            var cleanTemplate = JSON.parse(JSON.stringify(lineData));
                            cleanTemplate.amount = 0; 
                            sofDataMap[sofStr] = cleanTemplate;
                        }
                    }
                }
            }

            for (var sofKey in sofDataMap) {
                if (sofDataMap.hasOwnProperty(sofKey)) {
                    var itemData = sofDataMap[sofKey];
                    var totalTorBudget = sofTorAmountMap[sofKey] || 0;
                    var totalUsedBudget = sofAllocatedAmountMap[sofKey] || 0;
                    var remainingBudget = totalTorBudget - totalUsedBudget;

                    if (remainingBudget > 0) {
                        itemData.amount = remainingBudget;
                        itemData.custcol_amount_limit_from_tor = remainingBudget; 
                        itemData.linkedTrxIds = linkedTrxIds;
                        dataTransform.push(itemData);
                    } else {
                        console.log('SOF ' + sofKey + ' dilewati karena budget sudah habis / 0.');
                    }
                }
            }
        }
        
        console.log('dataTransform Final Result:', dataTransform);
        return dataTransform;
    }
    
    function transformPO(){
        var dataParams = getData('1');
        console.log('dataParams', dataParams);
        var dataParamsString = JSON.stringify(dataParams);
        var createURL = url.resolveRecord({
            recordType: "purchaseorder",
            isEditMode: true,
            params: {
                cf: 130,  
                dataParamsString : dataParamsString
            },
        });
        window.open(createURL, "_blank");
    }

    function transformPR(){
        var dataParams = getData('3');
        var dataParamsString = JSON.stringify(dataParams);
        console.log('dataParamsString', dataParamsString);
        var createURL = url.resolveRecord({
            recordType: "purchaserequisition",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    function transformTar(){
        var dataParams = getData('4');
        var dataParamsString = JSON.stringify(dataParams);
        console.log('dataParamsString', dataParamsString);
        var createURL = url.resolveRecord({
            recordType: "customrecord_tar",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    function transformExp(){
        var dataParams = getData('2');
        console.log('dataParams', dataParams);
        var dataParamsString = JSON.stringify(dataParams);
        var createURL = url.resolveRecord({
            recordType: "expensereport",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    // Transform Request Payment Vendor
    function transformPoVen(){
        var dataParams = getData('5');
        console.log('dataParams', dataParams);
        var dataParamsString = JSON.stringify(dataParams);
        var createURL = url.resolveRecord({
            recordType: "purchaseorder",
            isEditMode: true,
            params: { 
                cf: 130, 
                dataParamsString: dataParamsString 
            },
        });
        window.open(createURL, "_blank");
    }

    return {
        pageInit : pageInit,
        transformPO : transformPO,
        transformPR : transformPR,
        transformExp : transformExp,
        transformTar : transformTar,
        transformPoVen : transformPoVen
    };
});