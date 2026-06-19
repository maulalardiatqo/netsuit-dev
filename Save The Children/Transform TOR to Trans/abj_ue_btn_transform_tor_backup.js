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
                var linkedExpenseIds = [];
                var targetSofIds = []; 

                if (allLine > 0) {
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
                        log.debug('cekTransType', cekTransType)
                        log.debug('createdTrans', createdTrans)
                        if (cekTransType == '1' && (createdTrans && createdTrans.length === 0)) showBtnPO = true;
                        if (cekTransType == '3' && (createdTrans && createdTrans.length === 0)) showBtnPR = true;
                        if (cekTransType == '4' && (createdTransTAR && createdTransTAR.length === 0)) showBtnTar = true;
                        if (cekTransType == '5' && (createdTrans && createdTrans.length === 0)) showBtnPoVen = true;

                        if (cekTransType == '2') {
                            var sof = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tor_project',
                                line : i
                            });
                            
                            var amount = parseFloat(recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_amount',
                                line : i
                            })) || 0;

                            if (sof) {
                                if (targetSofIds.indexOf(sof.toString()) === -1) {
                                    targetSofIds.push(sof.toString());
                                }

                                if (!createdTrans || createdTrans == '') {
                                    showBtnExp = true;
                                } else {
                                    var cleanExpenseId = (Array.isArray(createdTrans) && createdTrans.length > 0) ? createdTrans[0] : createdTrans;
                                    // log.debug('cleanExpenseId', cleanExpenseId)
                                    // cleanExpenseId = cleanExpenseId ? cleanExpenseId.toString() : '';
                                    // if (cleanExpenseId && linkedExpenseIds.indexOf(cleanExpenseId) === -1) {
                                        // linkedExpenseIds.push(cleanExpenseId);
                                    // }
                                    log.debug('cleanExpenseId', cleanExpenseId)
                                    if(cleanExpenseId){
                                        linkedExpenseIds.push(cleanExpenseId);
                                    }
                                }

                                if (!torSummaryMap[sof]) {
                                    torSummaryMap[sof] = 0;
                                }
                                torSummaryMap[sof] += amount;
                            }
                        }
                    }
                }

                log.debug('TOR Summary Map (Asal)', torSummaryMap);
                log.debug('Linked Expense IDs (Cleaned)', linkedExpenseIds);
                log.debug('Target SOF IDs (For Filter)', targetSofIds);

                // JIKALAU ADA LINKED EXPENSE
                if (linkedExpenseIds.length > 0) {
                    var expenseSummaryMap = {};
                    log.debug('targetSofIds', targetSofIds)
                    var searchFilters = [
                        ["type", "anyof", "ExpRept"], "AND", 
                        ["internalid", "anyof", linkedExpenseIds], "AND", 
                        ["mainline", "is", "F"]
                    ];

                    if (targetSofIds.length > 0) {
                        searchFilters.push("AND", ["customer.internalid", "anyof", targetSofIds]);
                    }

                    var expensereportSearchObj = search.create({
                        type: "expensereport",
                        filters: searchFilters,
                        columns: [
                            search.createColumn({name: "amount", label: "Amount"}),
                            search.createColumn({
                                name: "internalid",
                                join: "customer",
                                label: "SOF Project ID"
                            })
                        ]
                    });

                    expensereportSearchObj.run().each(function(result) {
                        var expAmount = parseFloat(result.getValue({ name: 'amount' })) || 0;
                        log.debug('expAmount', expAmount)
                        var expSof = result.getValue({ name: 'internalid', join: 'customer' });
                        log.debug('expSof', expSof)

                        if (expSof) {
                            if (!expenseSummaryMap[expSof]) {
                                expenseSummaryMap[expSof] = 0;
                            }
                            expenseSummaryMap[expSof] += expAmount;
                        }
                        return true;
                    });

                    log.debug('Expense Report Summary Map (Saved Search - Cleaned)', expenseSummaryMap);

                    // PERBANDINGAN AMOUNT
                    Object.keys(torSummaryMap).forEach(function(sofKey) {
                        var totalAmountTOR = torSummaryMap[sofKey];
                        var totalAmountExpense = expenseSummaryMap[sofKey] || 0;

                        if (totalAmountExpense < totalAmountTOR) {
                            log.debug('Kondisi Muncul Button Terpenuhi', 'SOF: ' + sofKey + ' | TOR: ' + totalAmountTOR + ' > Expense: ' + totalAmountExpense);
                            showBtnExp = true; 
                        }
                    });
                }

                // --- PROSES PEMBUATAN BUTTON ---
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
                if(showBtnPoVen){
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