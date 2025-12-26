/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
    function formatDateDDMMYYYY(dateString) {
        if (!dateString) return '';

        var date = new Date(dateString);

        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();

        return day + '/' + month + '/' + year;
    }
    function transPO(data, transData){
            var createPO = transData
            log.debug('data', data)

            createPO.setValue({
                fieldId : 'customform',
                value : '130'
            });
            var cekcfrom = createPO.getValue('customform');
            log.debug('cekcform', cekcfrom)
            createPO.setValue({
                fieldId : 'trandate',
                value : data[0].date
            });
            
            createPO.setValue({
                fieldId : 'custbody_id_to',
                value : data[0].idTor
            });
             createPO.setValue({
                fieldId : 'custbody_stc_link_to_tor',
                value : data[0].idTor
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
            log.debug('cekAccountafter',cekAccountafter)
            var indexL = 0
            for(var i = 0; i < data.length; i++){
                createPO.insertLine({
                     sublistId: 'item',
                     line : indexL 
                    
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    line      : indexL,
                    value     : data[i].item
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'quantity',
                    line      : indexL,
                    value     : '1'
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'amount',
                    line      : indexL,
                    value     : data[i].amount
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'taxcode',
                    line      : indexL,
                    value     : '5'
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'department',
                    line      : indexL,
                    value     : data[i].costCenter
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'class',
                    line      : indexL,
                    value     : data[i].projectCode
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'currency',
                    line      : indexL,
                    value     : '1'
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custrecord_tare_project_task',
                    line      : indexL,
                    value     : data[i].projectTask
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'projecttask',
                    line      : indexL,
                    value     : data[i].projectTask
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_drc_segmen',
                    line      : indexL,
                    value     : data[i].drc
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_segmentdea',
                    line      : indexL,
                    value     : data[i].dea
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_sof',
                    line      : indexL,
                    value     : data[i].sof
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approval_status_line',
                    line      : indexL,
                    value     : '1'
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_linetrx',
                    line      : indexL,
                    value     : data[i].approver
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_apprvl_sts_fa',
                    line      : indexL,
                    value     : '1'
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_fa',
                    line      : indexL,
                    value     : data[i].approverFa
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'customer',
                    line      : indexL,
                    value     : data[i].project
                });

                log.debug('before commit')
                indexL++;
            }
    }
    function transExp(data, transData){
            log.debug('masuk trans exp');
            log.debug(' data[0].idTor',  data[0].idTor)
            
            var createExp = transData
             createExp.setValue({
                fieldId : 'custbody_id_to',
                value : data[0].idTor
            });
            createExp.setValue({
                fieldId : 'custbody_stc_link_to_tor',
                value : data[0].idTor
            });
            createExp.setValue({
                fieldId : 'custbody_stc_link_to_tor',
                value : data[0].idTor
            });
            
            createExp.setValue({
                fieldId : 'custbody_stc_expense_report_type',
                value : '2'
            });
            
            createExp.setValue({
                fieldId : 'entity',
                value : data[0].emp
            });
            createExp.setValue({
                fieldId : 'expensereportcurrency',
                value : '1'
            });
            
            // createExp.setValue({
            //     fieldId : 'advanceaccount',
            //     value : '119'
            // });
            // createExp.setValue({
            //     fieldId : 'account',
            //     value : '118'
            // });
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
            var indexL = 0;
            for(var i = 0; i < data.length; i++){
                createExp.insertLine({ 
                    sublistId: 'expense',
                    line :  indexL
                });
                 var itemId = data[i].item
                log.debug('itemId', itemId)
                var expAcc = ''
                if(itemId){
                    var itemSearchObj = search.create({
                            type: "item",
                            filters:
                            [
                                ["internalid","anyof",itemId]
                            ],
                            columns:
                            [
                                search.createColumn({name: "expenseaccount", label: "Expense/COGS Account"})
                            ]
                            });
                            var searchResultCount = itemSearchObj.runPaged().count;
                            log.debug("itemSearchObj result count",searchResultCount);
                            itemSearchObj.run().each(function(result){
                                expAcc = result.getValue({
                                    name : 'expenseaccount'
                                })
                            return true;
                        });
                    }
                log.debug('expAcc', expAcc)
                var category = ''
                if(expAcc){
                    var expensecategorySearchObj = search.create({
                    type: "expensecategory",
                    filters:
                    [
                        ["account","anyof",expAcc]
                    ],
                    columns:
                    [
                        search.createColumn({name: "name", label: "Name"}),
                        search.createColumn({name: "description", label: "Description"}),
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                    });
                    var searchResultCount = expensecategorySearchObj.runPaged().count;
                    log.debug("expensecategorySearchObj result count",searchResultCount);
                    expensecategorySearchObj.run().each(function(result){
                        
                        return true;
                    });
                }
                var category = '';

                if (expAcc) {
                    var expensecategorySearchObj = search.create({
                        type: "expensecategory",
                        filters: [
                            ["account", "anyof", expAcc]
                        ],
                        columns: [
                            search.createColumn({ name: "internalid" })
                        ]
                    });

                    var searchResultCount = expensecategorySearchObj.runPaged().count;
                    log.debug("expensecategorySearchObj result count", searchResultCount);

                    if (searchResultCount === 1) {
                        expensecategorySearchObj.run().each(function (result) {
                            category = result.getValue({ name: 'internalid' });
                            return false;
                        });
                    }
                }
                log.debug('category', category)
                
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'expensedate',
                    line :  indexL,
                    value     : data[0].date
                });
                if(category){
                    createExp.setSublistValue({
                        sublistId : 'expense',
                        fieldId   : 'category',
                        line :  indexL,
                        value     : category
                    });
                }
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'amount',
                    line :  indexL,
                    value     : data[i].amount
                });

                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'department',
                    line :  indexL,
                    value     : data[i].costCenter
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'class',
                    line :  indexL,
                    value     : data[i].projectCode
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'currency',
                    line :  indexL,
                    value     : '1'
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'expenseaccount',
                    line :  indexL,
                    value     : '488'
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'customer',
                    line      : indexL,
                    value     : data[i].project
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'projecttask',
                    line      : indexL,
                    value     : data[i].projectTask
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'cseg_stc_drc_segmen',
                    line      : indexL,
                    value     : data[i].drc
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'cseg_stc_segmentdea',
                    line      : indexL,
                    value     : data[i].dea
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'cseg_stc_sof',
                    line      : indexL,
                    value     : data[i].sof
                });
                createExp.setSublistValue({
                    sublistId : 'expense',
                    fieldId   : 'custrecord_tare_project_task',
                    line      : indexL,
                    value     : data[i].projectTask
                });
                 
                
                
                indexL ++;

            }
    }
    function transPR(data, transData){
            var createPr = transData
            createPr.setValue({
                fieldId : 'custbody_id_to',
                value : data[0].idTor
            });
            createPr.setValue({
                fieldId : 'custbody_stc_link_to_tor',
                value : data[0].idTor
            });
            
            createPr.setValue({
                fieldId : 'entity',
                value : data[0].emp
            });
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
            var indexL = 0;
            for(var i = 0; i < data.length; i++){
                createPr.insertLine({ 
                    sublistId: 'item',
                    line : indexL
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'item',
                    line : indexL,
                    value     : data[i].item
                });
                 createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'quantity',
                    line      : indexL,
                    value     : '1'
                });
                
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'amount',
                    line : indexL,
                    value     : data[i].amount
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'taxcode',
                    line      : indexL,
                    value     : '5'
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'department',
                    line : indexL,
                    value     : data[i].costCenter
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'class',
                    line : indexL,
                    value     : data[i].projectCode
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'currency',
                    line : indexL,
                    value     : '1'
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedamount',
                    line : indexL,
                    value     : data[i].amount
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedrate',
                    line : indexL,
                    value     : data[i].amount
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approval_status_line',
                    line : indexL,
                    value     : '1'
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_approver_linetrx',
                    line : indexL,
                    value     : data[i].approver
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'projecttask',
                    line      : indexL,
                    value     : data[i].projectTask
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_drc_segmen',
                    line      : indexL,
                    value     : data[i].drc
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_segmentdea',
                    line      : indexL,
                    value     : data[i].dea
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'customer',
                    line      : indexL,
                    value     : data[i].project
                });

                log.debug('data[i].sof', data[i].sof)
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'cseg_stc_sof',
                    line      : indexL,
                    value     : data[i].sof,
                    enableSourcing : false,
                    ignoreFieldChange : true
                });
                indexL ++;

            }
    }
    function beforeLoad(context) {
        try{
            if (context.type == context.UserEventType.CREATE) {
                var transData = context.newRecord;
                if (context.request) {
                    if (context.request.parameters) {
                        var dataParamsString = context.request.parameters.dataParamsString;
                        log.debug('dataParamsString', dataParamsString)
                        var dataParsing = JSON.parse(dataParamsString);
                        log.debug('dataParsing', dataParsing);
                        var obj = dataParsing[0];
                        var transactionType = obj.transactionType;
                        log.debug('transactionType', transactionType)
                        if(transactionType == '1'){
                            transPO(dataParsing, transData)
                        }else if(transactionType == '2'){
                            transExp(dataParsing, transData)
                        }else if(transactionType == '3'){
                            transPR(dataParsing, transData)
                        }

                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    function afterSubmit(context){
        if (context.type == context.UserEventType.CREATE) {
            try{
                var rec  = context.newRecord;
                var idRec = rec.id;
                log.debug('idRec', idRec)
                var recType = rec.type;
                log.debug('recType', recType)
                var typeToCheck = ''
                if(recType == 'purchaseorder'){
                    typeToCheck = '1'
                }else if(recType == 'expensereport'){
                    typeToCheck = '2'
                }else{
                    typeToCheck = '3'
                }
                var cekIdTOR = rec.getValue('custbody_id_to');
                if(cekIdTOR){
                    var recLoad = record.load({
                        type : 'customrecord_tor',
                        id : cekIdTOR
                    });
                    var cekLine = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_tori_id'
                    });
                    if(cekLine > 0){
                        for(var i = 0; i < cekLine; i++){
                            var transactionType = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId   : 'custrecord_tor_transaction_type',
                                line      : i
                            });
                            if(transactionType == typeToCheck){
                                recLoad.setSublistValue({
                                    sublistId : 'recmachcustrecord_tori_id',
                                    fieldId   : 'custrecord_tor_link_trx_no',
                                    line      : i,
                                    value     : idRec
                                });
                            }
                        }
                    }
                    recLoad.save();
                }
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return {
        beforeLoad: beforeLoad,
        afterSubmit : afterSubmit
    };
});
