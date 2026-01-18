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
    function transExp(data, transData) {
        log.debug('Masuk transExp Safe Mode', 'Total baris: ' + data.length);
        function parseDate(dateStr) {
            if (!dateStr) return new Date(); // Fallback ke hari ini jika kosong, untuk mencegah error Date
            try {
                var parts = dateStr.split('/'); 
                if (parts.length !== 3) return new Date();
                // Pastikan menjadi Date object valid
                var dt = new Date(parts[2], parts[1] - 1, parts[0]);
                if (isNaN(dt.getTime())) return new Date(); // Cek Invalid Date
                return dt;
            } catch (e) {
                return new Date();
            }
        }

        // ==========================================
        // 2. PRE-FETCHING DATA (BULK PROCESS)
        // ==========================================
        var itemIds = [];
        for (var j = 0; j < data.length; j++) {
            if (data[j].item) itemIds.push(data[j].item);
        }

        var itemAccountMap = {};
        var uniqueAccountIds = [];

        if (itemIds.length > 0) {
            search.create({
                type: "item",
                filters: [["internalid", "anyof", itemIds]],
                columns: ["expenseaccount"]
            }).run().each(function(result) {
                var accId = result.getValue('expenseaccount');
                itemAccountMap[result.id] = accId;
                if (accId && uniqueAccountIds.indexOf(accId) === -1) {
                    uniqueAccountIds.push(accId);
                }
                return true;
            });
        }

        var accountCategoryMap = {};
        if (uniqueAccountIds.length > 0) {
            var tempCatCount = {};
            search.create({
                type: "expensecategory",
                filters: [["account", "anyof", uniqueAccountIds]],
                columns: ["internalid", "account"]
            }).run().each(function(result) {
                var catId = result.getValue('internalid');
                var accId = result.getValue('account');
                if (!tempCatCount[accId]) tempCatCount[accId] = { count: 0, catId: null };
                tempCatCount[accId].count++;
                tempCatCount[accId].catId = catId;
                return true;
            });

            for (var acc in tempCatCount) {
                if (tempCatCount[acc].count === 1) {
                    accountCategoryMap[acc] = tempCatCount[acc].catId;
                }
            }
        }

        // ==========================================
        // 3. SET BODY FIELDS (DENGAN SAFE GUARD)
        // ==========================================
        var currentUser = runtime.getCurrentUser();
        
        // Helper function untuk Set Value aman
        function safeSet(field, val) {
            if (val !== null && val !== undefined && val !== '') {
                try {
                    transData.setValue({
                        fieldId: field,
                        value: val,
                        ignoreFieldChange: true // KUNCI ANTI ERROR
                    });
                } catch (e) {
                    log.error('Gagal set field: ' + field, e.message);
                }
            }
        }

        safeSet('custbody_id_to', data[0].idTor);
        safeSet('custbody_stc_link_to_tor', data[0].idTor);
        safeSet('custbody_stc_expense_report_type', '1'); 
        safeSet('entity', currentUser.id);
        safeSet('expensereportcurrency', '1');
        
        // Khusus Date, pastikan format Date Object
        safeSet('trandate', parseDate(data[0].date));
        
        safeSet('department', data[0].costCenter);
        safeSet('class', data[0].projectCode || '114');
        safeSet('location', '3');
        safeSet('cseg_stc_sof', data[0].sof || '66');
        safeSet('custbody_exp_autofilled', true);

        if (data[0].timeFrom) safeSet('custbody_stc_activity_date_from', parseDate(data[0].timeFrom));
        if (data[0].timeTo) safeSet('custbody_stc_activity_date_to', parseDate(data[0].timeTo));

        // ==========================================
        // 4. SET SUBLIST (LOOPING)
        // ==========================================
        
        for (var i = 0; i < data.length; i++) {
            var lineData = data[i];
            
            var expAcc = (lineData.item && itemAccountMap[lineData.item]) ? itemAccountMap[lineData.item] : null;
            var category = (expAcc && accountCategoryMap[expAcc]) ? accountCategoryMap[expAcc] : null;

            // Sublist Helper
            function safeSublist(field, val) {
                if (val !== null && val !== undefined && val !== '') {
                    try {
                        transData.setSublistValue({
                            sublistId: 'expense',
                            fieldId: field,
                            line: i,
                            value: val
                            // ignoreFieldChange tidak berlaku di setSublistValue standard mode, tapi aman
                        });
                    } catch (e) {
                    // Ignore error baris agar tidak membatalkan seluruh script
                    log.debug('Skip line field ' + field, e.message); 
                    }
                }
            }

            safeSublist('expensedate', parseDate(data[0].date));
            if (category) safeSublist('category', category);
            if (lineData.noTor) safeSublist('memo', lineData.noTor);
            
            safeSublist('amount', lineData.amount);
            if (lineData.costCenter) safeSublist('department', lineData.costCenter);
            if (lineData.projectCode) safeSublist('class', lineData.projectCode);

            safeSublist('currency', '1');
            safeSublist('expenseaccount', '488');

            if (lineData.project) safeSublist('customer', lineData.project);

            if (lineData.projectTask) {
                safeSublist('projecttask', lineData.projectTask);
                safeSublist('custrecord_tare_project_task', lineData.projectTask);
            }

            if (lineData.drc) safeSublist('cseg_stc_drc_segmen', lineData.drc);
            if (lineData.dea) safeSublist('cseg_stc_segmentdea', lineData.dea);
            if (lineData.sof) safeSublist('cseg_stc_sof', lineData.sof);
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
            var totalEstimate = 0
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
                totalEstimate = Number(totalEstimate) + Number(data[i].amount)
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'estimatedamount',
                    line : indexL,
                    value : data[i].amount
                })
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
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcolid_line_tor',
                    line : indexL,
                    value : data[i].idLine
                })
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
            createPr.setValue({
                fieldId : 'estimatedtotal',
                value : totalEstimate
            })
    }
    function transTar(data, createTar) {

    log.debug('Processing Header', data[0]);
    
    if (data[0].idTor) {
        createTar.setValue({
            fieldId: 'custrecord_tar_link_to_tor',
            value: data[0].idTor
        });
    }

    var currentEmployeeId = runtime.getCurrentUser().id; 
    createTar.setValue({
        fieldId: 'custrecord_tar_staf_name',
        value: currentEmployeeId
    });

    // Date
    if (data[0].date) {
        createTar.setValue({
            fieldId: 'custrecord_tar_date',
            value: data[0].date 
        });
    }

    var sublistId = 'recmachcustrecord_tar_e_id';

    for (var i = 0; i < data.length; i++) {
        var rowData = data[i];

        var category = '';
        var expAcc = null;

        if (rowData.item) {
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
        if (rowData.date) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_expense_date', line: i, value: rowData.date });
        }
        if(expAcc){
            createTar.setSublistValue({ sublistId : sublistId, fieldId: 'custrecord_tare_account', line : i, value: expAcc})
        }
        if (category) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_category', line: i, value: category });
        }
        createTar.setSublistValue({sublistId : sublistId, fieldId : 'custrecord_tare_memo', line : i, value : '-'})
        if (rowData.project) {
            createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_donor', line: i, value: rowData.project });
        }
        if(rowData.approver){
            createTar.setSublistValue({sublistId: sublistId, fieldId : 'custrecord_tare_approver', line: i, value: rowData.approver})
            createTar.setSublistValue({sublistId : sublistId, fieldId : 'custrecord_tare_approval_status', line : i, value : '1'})
        }
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
                    if (context.request && context.request.parameters) {
                        
                        var dataParamsString = context.request.parameters.dataParamsString;
                        log.debug('dataParamsString Raw', dataParamsString);
                        if (!dataParamsString) {
                            log.debug('Validation Info', 'Parameter dataParamsString kosong atau tidak ditemukan.');
                        }

                        var dataParsing;
                        
                        try {
                            dataParsing = JSON.parse(dataParamsString);
                        } catch (e) {
                            log.error('JSON Parse Error', 'Format JSON invalid: ' + e.message);
                            return;
                        }

                        log.debug('dataParsing Object', dataParsing);

                        if (!dataParsing || !Array.isArray(dataParsing) || dataParsing.length === 0) {
                            log.error('Data Structure Error', 'Data hasil parsing bukan array atau array kosong.');
                            return;
                        }

                        var obj = dataParsing[0];
                        
                        if (!obj || !obj.transactionType) {
                            log.error('Missing Transaction Type', 'Field transactionType tidak ditemukan pada data[0].');
                            return;
                        }

                        var transactionType = obj.transactionType;
                        log.debug('Processing Transaction Type', transactionType);

                        // Routing Logic
                        // Asumsi: variable 'transData' adalah context.newRecord yang sudah didefinisikan sebelumnya
                        if (transactionType == '1') {
                            transPO(dataParsing, transData);
                        } else if (transactionType == '2') {
                            transExp(dataParsing, transData);
                        } else if (transactionType == '3') {
                            transPR(dataParsing, transData);
                        } else if (transactionType == '4') {
                            transTar(dataParsing, transData);
                        } else {
                            log.debug('Unknown Transaction Type', 'Tipe transaksi tidak dikenali: ' + transactionType);
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
                }else if(recType == 'purchaserequisition'){
                    typeToCheck = '3'
                }else{
                    typeToCheck ='4'
                }
                var cekIdTOR = rec.getValue('custbody_id_to');

                if(recType == 'purchaserequisition'){
                    if (cekIdTOR) {
                        var cekLinePR = rec.getLineCount({
                            sublistId: 'item'
                        });

                        if (cekLinePR > 0) {
                            var allLineTor = [];
                            for (var p = 0; p < cekLinePR; p++) {
                                var idTorInPr = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcolid_line_tor',
                                    line: p
                                });
                                
                                if (idTorInPr) {
                                    allLineTor.push(String(idTorInPr)); 
                                }
                            }
                            if (allLineTor.length > 0) {
                                var recLoad = record.load({
                                    type: 'customrecord_tor',
                                    id: cekIdTOR
                                });

                                var cekLine = recLoad.getLineCount({
                                    sublistId: 'recmachcustrecord_tori_id'
                                });

                                if (cekLine > 0) {
                                    var isChanged = false;

                                    for (var i = 0; i < cekLine; i++) {
                                        var torLineId = recLoad.getSublistValue({
                                            sublistId: 'recmachcustrecord_tori_id',
                                            fieldId: 'id',
                                            line: i
                                        });
                                        if (allLineTor.indexOf(String(torLineId)) > -1) {
                                            
                                            recLoad.setSublistValue({
                                                sublistId: 'recmachcustrecord_tori_id',
                                                fieldId: 'custrecord_tor_link_trx_no',
                                                line: i,
                                                value: idRec
                                            });
                                            
                                            isChanged = true;
                                        }
                                    }
                                    if (isChanged) {
                                        recLoad.save();
                                    }
                                }
                            }
                        }
                    }
                    
                }else{
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
                }
                
            }catch(e){
                log.debug('error', e)
            }
        }
        if(context.type == context.UserEventType.DELETE){
            try{
                var rec  = context.newRecord;
                var idRec = rec.id;
                log.debug('idRec', idRec)
                var recType = rec.type;
                log.debug('recType', recType)
                var typeToCheck = ''  
                var cekIdTOR = rec.getValue('custbody_id_to');
                if (recType == 'purchaserequisition') {
                    if (cekIdTOR) {
                        var cekLinePR = rec.getLineCount({
                            sublistId: 'item'
                        });

                        if (cekLinePR > 0) {
                            var allLineTor = [];
                            for (var p = 0; p < cekLinePR; p++) {
                                var idTorInPr = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcolid_line_tor',
                                    line: p
                                });
                                
                                if (idTorInPr) {
                                    allLineTor.push(String(idTorInPr));
                                }
                            }

                            if (allLineTor.length > 0) {
                                var recLoad = record.load({
                                    type: 'customrecord_tor',
                                    id: cekIdTOR
                                });

                                var cekLine = recLoad.getLineCount({
                                    sublistId: 'recmachcustrecord_tori_id'
                                });

                                if (cekLine > 0) {
                                    var isChanged = false;

                                    for (var i = 0; i < cekLine; i++) {
                                        var torLineId = recLoad.getSublistValue({
                                            sublistId: 'recmachcustrecord_tori_id',
                                            fieldId: 'id',
                                            line: i
                                        });

                                        if (allLineTor.indexOf(String(torLineId)) > -1) {
                                            // Unlink: Set value menjadi kosong
                                            recLoad.setSublistValue({
                                                sublistId: 'recmachcustrecord_tori_id',
                                                fieldId: 'custrecord_tor_link_trx_no',
                                                line: i,
                                                value: '' 
                                            });
                                            isChanged = true;
                                        }
                                    }

                                    if (isChanged) {
                                        recLoad.save();
                                    }
                                }
                            }
                        }
                    }
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
