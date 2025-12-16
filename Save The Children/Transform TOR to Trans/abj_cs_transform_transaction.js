/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], 
function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {

    function pageInit(context) {
        console.log("Page init: script aktif");
    }
    function transform(){
        var records = currentRecord.get();
        var recId = records.id;
        console.log('recId', recId);

        const button = document.getElementById('custpage_btn_transform');
        if (button) {
            button.disabled = true;
            button.value = 'Sedang Diproses...';

            var processMsg = message.create({
                title: "Processing",
                message: "mohon tunggu...",
                type: message.Type.INFORMATION
            });
            processMsg.show();

            setTimeout(function () {
                try {
                    processTransaction(processMsg, recId, button);
                } catch (e) {
                    processMsg.hide();
                    console.error("Error", e);
                    dialog.alert({
                        title: "Error",
                        message: "Terjadi kesalahan: " + e.message
                    });
                    button.disabled = false;
                    button.value = 'Transform';
                }
            }, 500);
        }
    }
    function expTrans(data, processMsg){
        // data = array hasil grouping
        try{
            console.log('EXP TRANS DATA', data);
            console.log('data[0].emp', data[0].emp)
            var createExp = record.create({
                type : 'expensereport',
                isDynamic : true
            });

            createExp.setValue({
                fieldId : 'custbody_stc_expense_report_type',
                value : '2'
            });
            
            // createExp.setValue({
            //     fieldId : 'expensereportcurrency',
            //     value : 1
            // });
            createExp.setValue({
                fieldId : 'entity',
                value : data[0].emp
            });
            console.log('set employee')
            createExp.setValue({
                fieldId : 'advanceaccount',
                value : '119'
            });
            console.log('set advance account')
            createExp.setValue({
                fieldId : 'account',
                value : '118'
            });
            console.log('set account')
            createExp.setValue({
                fieldId : 'trandate',
                value : data[0].date
            });
            createExp.setValue({
                fieldId : 'department',
                value : data[0].costCenter
            });
            createExp.setValue({
                fieldId : 'class',
                value : data[0].projectCode || '114'
            });
            createExp.setValue({
                fieldId : 'location',
                value : '3'
            });
            createExp.setValue({
                fieldId : 'cseg_stc_sof',
                value : data[0].sof || '66'
            });
            var cekAccountafter = createExp.getValue('account');
            console.log('cekAccountafter',cekAccountafter)
            for(var i = 0; i < data.length; i++){
                createExp.selectNewLine({ sublistId: 'expense' });
                createExp.setCurrentSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'amount',
                    value     : data[i].amount
                });

                createExp.setCurrentSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'department',
                    value     : data[i].costCenter
                });
                createExp.setCurrentSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'class',
                    value     : data[i].projectCode
                });
                createExp.setCurrentSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'currency',
                    value     : '1'
                });
                createExp.setCurrentSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'expenseaccount',
                    value     : '488'
                });
                console.log('before commit')

                createExp.commitLine({ sublistId: 'expense' });
            }

            var expId = createExp.save();
            console.log('Expense Report created', expId);
            return expId
        }catch(e){
            log.debug('error', e);
            processMsg.hide();
            console.error("Error saat membuat Transform:", e);
            dialog.alert({
                title: "Error",
                message: "Terjadi kesalahan saat Transform " + e.message
            });
            button.disabled = false;
            button.value = 'Transform';
        }
        
    }


    function prTrans(data, processMsg){
        console.log('PR TRANS DATA', data);
        try{
            var createPr = record.create({
                type : 'purchaserequisition',
                isDynamic : true
            });
            createPr.setValue({
                fieldId : 'entity',
                value : data[0].emp
            });
            console.log('set employee')
            createPr.setValue({
                fieldId : 'custbody_stc_pr_category',
                value : '1'
            });
            createPr.setValue({
                fieldId : 'trandate',
                value : data[0].date
            });
            createPr.setValue({
                fieldId : 'department',
                value : data[0].costCenter
            });
            createPr.setValue({
                fieldId : 'class',
                value : data[0].projectCode || '114'
            });
            createPr.setValue({
                fieldId : 'location',
                value : '3'
            });
            createPr.setValue({
                fieldId : 'cseg_stc_sof',
                value : data[0].sof || '66'
            });
            for(var i = 0; i < data.length; i++){
                createPr.selectNewLine({ sublistId: 'item' });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    value     : data[i].item
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'amount',
                    value     : data[i].amount
                });

                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'department',
                    value     : data[i].costCenter
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'class',
                    value     : data[i].projectCode
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'currency',
                    value     : '1'
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedamount',
                    value     : data[i].amount
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedrate',
                    value     : data[i].amount
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approval_status_line',
                    value     : '1'
                });
                createPr.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_linetrx',
                    value     : data[i].approver
                });
                console.log('before commit')

                createPr.commitLine({ sublistId: 'item' });
            }

            var prId = createPr.save();
            return prId

        }catch(e){
            log.debug('error', e);
            processMsg.hide();
            console.error("Error saat membuat Transform:", e);
            dialog.alert({
                title: "Error",
                message: "Terjadi kesalahan saat Transform " + e.message
            });
            button.disabled = false;
            button.value = 'Transform';
        }
    }

    function poTrans(data, processMsg){
         try{
            console.log('EXP TRANS DATA', data);
            console.log('data[0].emp', data[0].emp)
            var createPO = record.create({
                type : 'purchaseorder',
                isDynamic : true
            });

            createPO.setValue({
                fieldId : 'custbody_stc_expense_report_type',
                value : '2'
            });
            createPO.setValue({
                fieldId : 'entity',
                value : "1529"
            });
            createPO.setValue({
                fieldId : 'trandate',
                value : data[0].date
            });
            createPO.setValue({
                fieldId : 'department',
                value : data[0].costCenter
            });
            createPO.setValue({
                fieldId : 'class',
                value : data[0].projectCode || '114'
            });
            createPO.setValue({
                fieldId : 'location',
                value : '3'
            });
            createPO.setValue({
                fieldId : 'cseg_stc_sof',
                value : data[0].sof || '66'
            });
            var cekAccountafter = createPO.getValue('account');
            console.log('cekAccountafter',cekAccountafter)
            for(var i = 0; i < data.length; i++){
                createPO.selectNewLine({ sublistId: 'item' });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    value     : data[i].item
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'amount',
                    value     : data[i].amount
                });

                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'department',
                    value     : data[i].costCenter
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'class',
                    value     : data[i].projectCode
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'currency',
                    value     : '1'
                });
                // createPO.setCurrentSublistValue({
                //     sublistId : 'item',
                //     fieldId   : 'cseg_stc_drc_segmen',
                //     value     : data[i].drc
                // });
                // createPO.setCurrentSublistValue({
                //     sublistId : 'item',
                //     fieldId   : 'cseg_stc_segmentdea',
                //     value     : data[i].dea
                // });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_sof',
                    value     : data[i].sof
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approval_status_line',
                    value     : '1'
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_linetrx',
                    value     : data[i].approver
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_apprvl_sts_fa',
                    value     : '1'
                });
                createPO.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_fa',
                    value     : data[i].approverFa
                });
                console.log('before commit')

                createPO.commitLine({ sublistId: 'item' });
            }

            var poId = createPO.save();
            return poId
        }catch(e){
            log.debug('error', e);
            processMsg.hide();
            console.error("Error saat membuat Transform:", e);
            dialog.alert({
                title: "Error",
                message: "Terjadi kesalahan saat Transform " + e.message
            });
            button.disabled = false;
            button.value = 'Transform';
        }
    }
    function updateLinkTrx(rec, trxType, trxId){
        if(!trxId) return;

        var lineCount = rec.getLineCount({
            sublistId : 'recmachcustrecord_tori_id'
        });

        for(var i = 0; i < lineCount; i++){
            var type = rec.getSublistValue({
                sublistId : 'recmachcustrecord_tori_id',
                fieldId   : 'custrecord_tor_transaction_type',
                line      : i
            });

            if(type == trxType){
                rec.setSublistValue({
                    sublistId : 'recmachcustrecord_tori_id',
                    fieldId   : 'custrecord_tor_link_trx_no',
                    line      : i,
                    value     : trxId
                });
            }
        }
    }

    function processTransaction(processMsg, recId, button){
        try{
            var recLoad = record.load({
                type : 'customrecord_tor',
                id : recId
            });

            var date = recLoad.getValue('custrecord_tor_date');
            var emp  = recLoad.getValue('custrecord_tor_create_by');

            var cekLine = recLoad.getLineCount({
                sublistId : 'recmachcustrecord_tori_id'
            });
            console.log('cekLine', cekLine)
            // object grouping
            var groupedData = {
                2 : [], // EXP
                3 : [], // PR
                1 : []  // PO
            };

            if(cekLine > 0){
                for(var i = 0; i < cekLine; i++){
                    var transactionType = recLoad.getSublistValue({
                        sublistId : 'recmachcustrecord_tori_id',
                        fieldId   : 'custrecord_tor_transaction_type',
                        line      : i
                    });

                    if(!transactionType) continue;
                    var cekLink = recLoad.getSublistValue({
                        sublistId : 'recmachcustrecord_tori_id',
                        fieldId   : 'custrecord_tor_link_trx_no',
                        line      : i
                    });
                    if(!cekLink){
                        var data = {
                            date : date,
                            emp  : emp,
                            dea  : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tor_dea',
                                line      : i
                            }),
                            drc : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tor_drc',
                                line      : i
                            }),
                            project : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tor_project',
                                line      : i
                            }),
                            projectTask : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tor_project_task',
                                line      : i
                            }),
                            transactionType : transactionType,
                            amount : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_amount',
                                line      : i
                            }),
                            approver : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_approver',
                                line      : i
                            }),
                            approverFa : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_approver_fa',
                                line      : i
                            }),
                            costCenter : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_cost_center',
                                line      : i
                            }),
                            item : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_item',
                                line      : i
                            }),
                            projectCode : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_project_code',
                                line      : i
                            }),
                            sof : recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tori_source_of_funding',
                                line      : i
                            })
                        };
                        if(groupedData[transactionType]){
                            groupedData[transactionType].push(data);
                        }
                    }
                    
                }
            }
            var expId, prId, poId;

            if(groupedData[3].length > 0){
                prId = prTrans(groupedData[3], processMsg);
            }

            if(groupedData[2].length > 0){
                expId = expTrans(groupedData[2], processMsg);
            }

            if(groupedData[1].length > 0){
                poId = poTrans(groupedData[1], processMsg);
            }
            if(expId){
                updateLinkTrx(recLoad, 2, expId);
            }

            if(prId){
                updateLinkTrx(recLoad, 3, prId);
            }

            if(poId){
                updateLinkTrx(recLoad, 1, poId);
            }
            recLoad.save({
                ignoreMandatoryFields : true
            });
            var successMsg = message.create({
                title: "Success",
                message: "Berhasil Transform",
                type: message.Type.CONFIRMATION
            });
            successMsg.show({ duration: 5000 });
            setTimeout(function () {
                window.location.reload();
            }, 1500);
        }catch(e){
            log.debug('error', e);
            processMsg.hide();
            console.error("Error saat membuat Transform:", e);
            dialog.alert({
                title: "Error",
                message: "Terjadi kesalahan saat Transform " + e.message
            });
            button.disabled = false;
            button.value = 'Transform';
        }
    }

     return {
        pageInit: pageInit,
        transform: transform,
    };
});
