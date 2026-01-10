/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format", "N/runtime"], function (record, search, serverWidget, runtime, currency, redirect, format, runtime) {
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
            
            // var createExp = transData
            // createExp.setValue({
            //     fieldId : 'custbody_id_to',
            //     value : data[0].idTor
            // });
            // createExp.setValue({
            //     fieldId : 'custbody_stc_link_to_tor',
            //     value : data[0].idTor
            // });
            
            // createExp.setValue({
            //     fieldId : 'custbody_stc_expense_report_type',
            //     value : '2'
            // });
            
            // createExp.setValue({
            //     fieldId : 'entity',
            //     value : data[0].emp
            // });
            // createExp.setValue({
            //     fieldId : 'expensereportcurrency',
            //     value : '1'
            // });

            // createExp.setValue({
            //     fieldId : 'trandate',
            //     value : data[0].date
            // });
            // createExp.setValue({
            //     fieldId : 'department',
            //     value : data[0].costCenter
            // });
            // createExp.setValue({
            //     fieldId : 'class',
            //     value : data[0].projectCode || '114'
            // });
            // createExp.setValue({
            //     fieldId : 'location',
            //     value : '3'
            // });
            // createExp.setValue({
            //     fieldId : 'cseg_stc_sof',
            //     value : data[0].sof || '66'
            // });
            // var cekAccountafter = createExp.getValue('account');
            // var indexL = 0;
            // for(var i = 0; i < data.length; i++){
            //     log.debug('indexL', indexL)
            //     createExp.insertLine({ 
            //         sublistId: 'expense',
            //         line :  indexL
            //     });
            //      var itemId = data[i].item
            //     log.debug('itemId', itemId)
            //     var expAcc = ''
            //     if(itemId){
            //         var itemSearchObj = search.create({
            //                 type: "item",
            //                 filters:
            //                 [
            //                     ["internalid","anyof",itemId]
            //                 ],
            //                 columns:
            //                 [
            //                     search.createColumn({name: "expenseaccount", label: "Expense/COGS Account"})
            //                 ]
            //                 });
            //                 var searchResultCount = itemSearchObj.runPaged().count;
            //                 log.debug("itemSearchObj result count",searchResultCount);
            //                 itemSearchObj.run().each(function(result){
            //                     expAcc = result.getValue({
            //                         name : 'expenseaccount'
            //                     })
            //                 return true;
            //             });
            //         }
            //     log.debug('expAcc', expAcc)
            //     var category = '';

            //     if (expAcc) {
            //         var expensecategorySearchObj = search.create({
            //             type: "expensecategory",
            //             filters: [
            //                 ["account", "anyof", expAcc]
            //             ],
            //             columns: [
            //                 search.createColumn({ name: "internalid" })
            //             ]
            //         });

            //         var searchResultCount = expensecategorySearchObj.runPaged().count;
            //         log.debug("expensecategorySearchObj result count", searchResultCount);

            //         if (searchResultCount === 1) {
            //             expensecategorySearchObj.run().each(function (result) {
            //                 category = result.getValue({ name: 'internalid' });
            //                 return false;
            //             });
            //         }
            //     }
            //     log.debug('category', category)
                
            //     createExp.setSublistValue({
            //         sublistId : 'expense',
            //         fieldId   : 'expensedate',
            //         line :  indexL,
            //         value     : data[0].date
            //     });
            //     if(category){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'category',
            //             line :  indexL,
            //             value     : category
            //         });
            //     }
            //     createExp.setSublistValue({
            //         sublistId : 'expense',
            //         fieldId   : 'amount',
            //         line :  indexL,
            //         value     : data[i].amount
            //     });
            //     if(data[i].costCenter){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'department',
            //             line :  indexL,
            //             value     : data[i].costCenter
            //         });
            //     }
                
            //     if(data[i].projectCode){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'class',
            //             line :  indexL,
            //             value     : data[i].projectCode
            //         });
            //     }
                
            //     createExp.setSublistValue({
            //         sublistId : 'expense',
            //         fieldId   : 'currency',
            //         line :  indexL,
            //         value     : '1'
            //     });
            //     createExp.setSublistValue({
            //         sublistId : 'expense',
            //         fieldId   : 'expenseaccount',
            //         line :  indexL,
            //         value     : '488'
            //     });
            //     if(data[i].project){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'customer',
            //             line      : indexL,
            //             value     : data[i].project
            //         });
            //     }
            //     if(data[i].projectTask){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'projecttask',
            //             line      : indexL,
            //             value     : data[i].projectTask
            //         });
            //     }
            //     if(data[i].drc){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'cseg_stc_drc_segmen',
            //             line      : indexL,
            //             value     : data[i].drc
            //         });
            //     }
            //     if(data[i].dea){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'cseg_stc_segmentdea',
            //             line      : indexL,
            //             value     : data[i].dea
            //         });
            //     }
            //     if(data[i].sof){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'cseg_stc_sof',
            //             line      : indexL,
            //             value     : data[i].sof
            //         });
            //     }
            //     if(data[i].projectTask){
            //         createExp.setSublistValue({
            //             sublistId : 'expense',
            //             fieldId   : 'custrecord_tare_project_task',
            //             line      : indexL,
            //             value     : data[i].projectTask,
            //         });
            //         var cekValue = createExp.getSublistValue({
            //             sublistId : 'expense',
            //             fieldId : 'custrecord_tare_project_task',
            //             line : indexL
            //         });
            //         log.debug('cekValue', cekValue)
            //     }
            //     log.debug('before last', indexL)
                
            //     indexL ++;

            // }
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
    function transTar(data, createTar) {
    // 1. SET HEADER
    log.debug('Processing Header', data[0]);
    
    // Link to TOR
    if (data[0].idTor) {
        createTar.setValue({
            fieldId: 'custrecord_tar_link_to_tor',
            value: data[0].idTor
        });
    }

    // Staff Name
    // Pastikan 'currentEmployee' adalah ID (integer), bukan object User
    var currentEmployeeId = runtime.getCurrentUser().id; 
    createTar.setValue({
        fieldId: 'custrecord_tar_staf_name',
        value: currentEmployeeId
    });

    // Date
    if (data[0].date) {
        // Asumsi data[0].date sudah berupa Date Object. 
        // Jika masih string DD/MM/YYYY, gunakan parser tanggal seperti diskusi sebelumnya.
        createTar.setValue({
            fieldId: 'custrecord_tar_date',
            value: data[0].date 
        });
    }

    // 2. PROCESS SUBLIST
    var sublistId = 'recmachcustrecord_tar_e_id';

    for (var i = 0; i < data.length; i++) {
        var rowData = data[i];

        // --- SEARCH LOGIC (Server Side) ---
        // Catatan: Search di dalam loop kurang efisien untuk data banyak, 
        // tapi untuk jumlah baris sedikit ini masih oke.
        var category = '';
        var expAcc = null;

        if (rowData.item) {
            // Search Expense Account
            var itemSearchObj = search.create({
                type: "item",
                filters: [["internalid", "anyof", rowData.item]],
                columns: ["expenseaccount"]
            });
            itemSearchObj.run().each(function (result) {
                expAcc = result.getValue({ name: 'expenseaccount' });
                return false;
            });

            // Search Category
            if (expAcc) {
                var catSearch = search.create({
                    type: "expensecategory",
                    filters: [["account", "anyof", expAcc]],
                    columns: ["internalid"]
                });
                if (catSearch.runPaged().count === 1) {
                    catSearch.run().each(function (result) {
                        category = result.getValue({ name: 'internalid' });
                        return false;
                    });
                }
            }
        }
        
        // --- SET SUBLIST VALUES ---
        // HAPUS createTar.insertLine(...) -> Tidak perlu di Standard Mode record.create
        // Kita langsung tembak index baris menggunakan 'i'
        
        // 1. Expense Date
        if (rowData.date) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expense_date', line: i, value: rowData.date });
        }
        
        // 2. Category
        if (category) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_category', line: i, value: category });
        }

        // 3. Project / Donor (PENTING: Set ini agar Project Task valid)
        if (rowData.project) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_donor', line: i, value: rowData.project });
        }

        // 4. Project Task
        if (rowData.projectTask) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_project_task', line: i, value: rowData.projectTask });
        }

        // 5. Business Unit (Langsung set, tidak perlu sourcing delay di server side)
        if (rowData.bussinessUnit) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_ter_business_unit', line: i, value: rowData.bussinessUnit });
        }

        // 6. Field Lainnya
        if (rowData.sof) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_source_of_funding', line: i, value: rowData.sof });
        if (rowData.drc) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_drc', line: i, value: rowData.drc });
        if (rowData.dea) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_dea', line: i, value: rowData.dea });
        if (rowData.amount) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_amount', line: i, value: rowData.amount });
        if (rowData.costCenter) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_cost_center', line: i, value: rowData.costCenter });
        if (rowData.projectCode) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_project_code', line: i, value: rowData.projectCode });
        
        // Tidak perlu increment indexL manual, pakai 'i' dari loop saja
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
                        }else if(transactionType == '4'){
                            transTar(dataParsing, transData)
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
