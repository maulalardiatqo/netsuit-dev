/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            
            var recLoad = record.load({
                type : 'customrecord_tor',
                id : rec.id
            });

            var showBtnPR = false;
            var showBtnExp = false;
            var showBtnPO = false;
            var showBtnPoVen = false;
            var showBtnTar = false;
            
            var status = recLoad.getValue('custrecord_tor_status');
            log.debug('status', status)

            if (status == '2') {
                var allLine = recLoad.getLineCount({
                    sublistId : 'recmachcustrecord_tori_id'
                });
                
                log.debug('allLine', allLine);
                
                var torSummaryMap = {};
                var torAllocatedMap = {};

                if (allLine > 0) {
                    for (var i = 0; i < allLine; i++) {
                        var cekTransType = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_transaction_type',
                            line : i
                        });

                        var sof = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_project',
                            line : i
                        });
                        if(cekTransType !='2'){
                            // untuk TAR ambil dari Item untuk grouping
                            sof = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'id',
                                line : i
                            });
                            log.debug('sof', sof)
                        }
                        var amount = parseFloat(recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tori_amount',
                            line : i
                        })) || 0;

                        var allocated = parseFloat(recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_amount_allocated',
                            line : i
                        })) || 0;

                        if (sof && cekTransType) {
                            var groupKey = cekTransType.toString() + '_' + sof.toString();
                            
                            if (!torSummaryMap[groupKey]) torSummaryMap[groupKey] = 0;
                            
                            torSummaryMap[groupKey] += amount;
                            torAllocatedMap[groupKey] = allocated; 
                        }
                    }

                    log.debug('torSummaryMap (transType_sof)', torSummaryMap);
                    log.debug('torAllocatedMap (transType_sof)', torAllocatedMap);

                    for (var i = 0; i < allLine; i++) {
                        var cekTransType = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_transaction_type',
                            line : i
                        });
                        
                        var createdTrans = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_link_trx_no',
                            line : i
                        });
                        
                        var createdTransTAR = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_link_tar',
                            line : i
                        });

                        var sof = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_project',
                            line : i
                        });
                        if(cekTransType != '2'){
                            // untuk TAR ambil dari Item untuk grouping
                            sof = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'id',
                                line : i
                            });
                        }
                        if (sof && cekTransType) {
                            var groupKey = cekTransType.toString() + '_' + sof.toString();
                            log.debug('groupKey', groupKey)
                            var totalAmountTOR = torSummaryMap[groupKey] || 0;
                            log.debug('totalAmountTOR', totalAmountTOR)
                            var totalUsedBudget = torAllocatedMap[groupKey] || 0;
                            log.debug('totalUsedBudget', totalUsedBudget)
                            var remainingBudget = totalAmountTOR - totalUsedBudget;
                            log.debug('remainingBudget', remainingBudget)

                            if (remainingBudget > 0) {
                                if (cekTransType == '1') showBtnPO = true;
                                if (cekTransType == '3') showBtnPR = true;
                                if (cekTransType == '4') showBtnTar = true;
                                if (cekTransType == '5') showBtnPoVen = true;
                                if (cekTransType == '2') showBtnExp = true;
                            }
                        }
                    }
                }

                if (showBtnPR) {
                    form.addButton({ id: 'custpage_btn_transform_pr', label: "Transform PR", functionName: "transformPR()" });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js";
                }
                if (showBtnPO) {
                    form.addButton({ id: 'custpage_btn_transform_po', label: "Transform POD Form", functionName: "transformPO()" });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js";
                }
                if (showBtnExp) {
                    form.addButton({ id: 'custpage_btn_transform_exp', label: "Transform Expense Management", functionName: "transformExp()" });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js";
                }
                if (showBtnTar) {
                    form.addButton({ id: 'custpage_btn_transform_tar', label: "Transform TAR", functionName: "transformTar()" });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js";
                }
                if (showBtnPoVen) {
                    form.addButton({ id: 'custpage_btn_transform_poven', label: "Transform Request Payment Vendor", functionName: "transformPoVen()" });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js";
                }
            }
        }
    }
    
    return {
        beforeLoad : beforeLoad
    };
});