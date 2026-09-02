/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/url", "N/currentRecord", "N/ui/message", "N/ui/dialog", "N/https"], 
function (url, currentRecord, message, dialog, https) {
    function pageInit(context) {
        console.log("Page init: script aktif");
    }
    
    function lineInit(context) {
        var rec = context.currentRecord;
        var cekSource = rec.getValue('custrecord_source_tor_amendment');
        var transType = rec.getValue('custrecord_tor_transaction_type');
        
        if (cekSource) {
            var sublistId = context.sublistId;

            if (sublistId === 'recmachcustrecord_tori_id') {
                var groupingFieldId = (transType == 4) ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                console.log('groupingFieldId', groupingFieldId)
                var currentGroupValue = rec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: groupingFieldId
                });
                console.log('currentGroupValue', currentGroupValue)
                var cekAllocationAmount = rec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_amount_allocated'
                });
                console.log('cekAllocationAmount', cekAllocationAmount)
                var shouldDisable = false;

                if (currentGroupValue && Number(cekAllocationAmount) > 0) {
                    var summaryAmount = 0;
                    var lineCount = rec.getLineCount({ sublistId: sublistId });
                    
                    for (var i = 0; i < lineCount; i++) {
                        var lineGroupValue = rec.getSublistValue({
                            sublistId: sublistId,
                            fieldId: groupingFieldId,
                            line: i
                        });
                        if (lineGroupValue == currentGroupValue) {
                            var lineAmount = rec.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_tori_amount',
                                line: i
                            });
                            
                            summaryAmount += Number(lineAmount) || 0;
                        }
                    }
                    
                    console.log('summaryAmount', summaryAmount)
                    if ( cekAllocationAmount>= Number(summaryAmount)) {
                        shouldDisable = true;
                    }
                    console.log('shouldDisable', shouldDisable)
                }

                // 2. Terapkan flag 'shouldDisable' ke semua field
                var fieldsToManage = [
                    "custrecord_tori_item", "custrecord_tor_transaction_type", "custrecord_tor_unit_cost", 
                    "custrecord_tor_quantity", "custrecord_tor_uom", "custrecord_tori_amount", 
                    "custrecord_tor_description", "custrecord_tori_cost_center", "custrecord_tori_project_code", 
                    "custrecord_tor_project", "custrecord_tor_project_task", "custrecord_tor_activity_code", 
                    "custrecord_stc_tor_justification", "custrecord_tor_rpv_vendor", "custrecord_tori_source_of_funding", 
                    "custrecord_tor_drc", "custrecord_tor_dea", "custrecord_tor_business_unit", 
                    "custrecord_tori_approver", "custrecord_tori_approval_status", "custrecord_tori_approver_fa", 
                    "custrecord_tori_approval_status_fa", "custrecord_tor_link_trx_no", "custrecord_tor_link_tar", 
                    "custrecord_tor_donor_currency", "custrecord_tor_exchng_rate_donor", "custrecord_tor_amt_donor_curr", 
                    "custrecord_stc_tor_item_budget_amount", "custrecord_stc_tor_item_budget_consumed", 
                    "custrecord_stc_tor_item_budget_warning", "custrecord_amount_allocated"
                ];

                for (var j = 0; j < fieldsToManage.length; j++) {
                    var fieldObj = rec.getCurrentSublistField({
                        sublistId: sublistId,
                        fieldId: fieldsToManage[j]
                    });
                    
                    if (fieldObj) {
                        fieldObj.isDisabled = shouldDisable; 
                    }
                }

                if (typeof document !== 'undefined') {
                    var removeBtnId = sublistId + '_remove';
                    var removeBtn = document.getElementById(removeBtnId);
                    
                    if (removeBtn) {
                        if (shouldDisable) {
                            removeBtn.style.display = 'none';
                        } else {
                            removeBtn.style.display = ''; 
                        }
                    }
                }
            }
        }
    }
    
    return {
        pageInit : pageInit,
        lineInit : lineInit
    }
});