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
                fieldId : 'custbody_stc_po_type',
                value : 2
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
            var totalAmount = 0
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
                    value     : data[i].qty
                });
                log.debug('data[i].amount', data[i].amount)
                var amount = data[i].amount
                totalAmount = Number(totalAmount) + Number(amount)
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'rate',
                    line      : indexL,
                    value     : data[i].amount
                });
                if(data[i].uom){
                    createPO.setSublistValue({
                        sublistId : 'item',
                        fieldId   : 'units',
                        line      : indexL,
                        value     : data[i].uom
                    });
                }
                
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimaterate',
                    line      : indexL,
                    value     : data[i].amount
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedamount',
                    line      : indexL,
                    value     : data[i].amount
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'description',
                    line      : indexL,
                    value     : data[i].description
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
                    fieldId : 'cseg_paactivitycode',
                    line      : indexL,
                    value : data[i].activityCode
                })
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'cseg1',
                    line      : indexL,
                    value : data[i].bussinessUnit
                })
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
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_asset',
                    line      : indexL,
                    value     : 2,
                    ignoreFieldChange: true
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcolid_line_tor',
                    line      : indexL,
                    value     : data[i].idLine
                })
                var cekAsset = createPO.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_stc_asset',
                    line : indexL
                })
                log.debug('cekAsset', cekAsset)
                log.debug('before commit')  
                indexL++;
            }
            createPO.setValue({
                fieldId : 'custbody_amount_from_tor',
                value : totalAmount
            });
    }
    function transPoVen(data, transData){
            var createPO = transData
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
                fieldId : 'custbody_stc_po_type',
                value : 3
            });
             createPO.setValue({
                fieldId : 'entity',
                value : data[0].vendor
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
            var totalAmount = 0
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
                    value     : data[i].qty
                });
                log.debug('data[i].amount', data[i].amount)
                var amount = data[i].amount
                totalAmount = Number(totalAmount) + Number(amount)
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'rate',
                    line      : indexL,
                    value     : data[i].amount
                });
                if(data[i].uom){
                    createPO.setSublistValue({
                        sublistId : 'item',
                        fieldId   : 'units',
                        line      : indexL,
                        value     : data[i].uom
                    });
                }
                
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimaterate',
                    line      : indexL,
                    value     : data[i].amount
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'estimatedamount',
                    line      : indexL,
                    value     : data[i].amount
                });
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'description',
                    line      : indexL,
                    value     : data[i].description
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
                    sublistId: 'item',
                    fieldId: 'custcol_stc_asset',
                    line: indexL,
                    value: 2,
                    ignoreFieldChange: true 
                });
                // createPO.setSublistValue({
                //     sublistId : 'item',
                //     fieldId   : 'custcol_stc_inv_item',
                //     line      : indexL,
                //     value     : 2
                // });
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
                    fieldId : 'cseg_paactivitycode',
                    line      : indexL,
                    value : data[i].activityCode
                })
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'cseg1',
                    line      : indexL,
                    value : data[i].bussinessUnit
                })
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
                createPO.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcolid_line_tor',
                    line      : indexL,
                    value     : data[i].idLine
                })
                log.debug('before commit')  
                indexL++;
            }
            createPO.setValue({
                fieldId : 'custbody_amount_from_tor',
                value : totalAmount
            });
    }
    function transExp(data, transData, roleId) {
        log.debug('Masuk transExp Safe Mode', 'Total baris: ' + data.length);
        log.debug('roleId', roleId)
        function parseDate(dateStr) {
            if (!dateStr) return new Date();
            try {
                var parts = dateStr.split('/');
                if (parts.length !== 3) return new Date();
                var dt = new Date(parts[2], parts[1] - 1, parts[0]);
                if (isNaN(dt.getTime())) return new Date();
                return dt;
            } catch (e) {
                return new Date();
            }
        }
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

        var currentUser = runtime.getCurrentUser();

        function safeSet(field, val) {
            if (val !== null && val !== undefined && val !== '') {
                try {
                    transData.setValue({
                        fieldId: field,
                        value: val,
                        ignoreFieldChange: true
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
        // if(roleId != '15'){
        //     log.debug('set entity')
           
        // }else{
        //     log.debug('no set entity')
        // }
        
        safeSet('expensereportcurrency', '1');
        safeSet('trandate', parseDate(data[0].date));
        safeSet('department', data[0].costCenter);
        safeSet('class', data[0].projectCode || '114');
        safeSet('location', '3');
        safeSet('cseg_stc_sof', data[0].sof || '66');
        if (data[0].timeFrom) safeSet('custbody_stc_activity_date_from', parseDate(data[0].timeFrom));
        if (data[0].timeTo) safeSet('custbody_stc_activity_date_to', parseDate(data[0].timeTo));
        var totalAmount = 0
        
        safeSet('custbody_amount_from_tor', totalAmount);
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
                log.debug('additional value', {desc : data[i].description, qty: data[i].qty, uom : data[i].uom, amount : data[i].amount})
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
                    value     : data[i].qty
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'description',
                    line      : indexL,
                    value     : data[i].description
                })
                if(data[i].uom){
                    createPr.setSublistValue({
                        sublistId : 'item',
                        fieldId   : 'units',
                        line      : indexL,
                        value     : data[i].uom
                    });
                }
                
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'estimatedrate',
                    line : indexL,
                    value : data[i].unitCost
                })
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'estimatedamount',
                    line : indexL,
                    value : data[i].amount
                })
                 createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'amount',
                    line : indexL,
                    value : 0
                })
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    line : indexL,
                    value : 0
                })
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_asset',
                    line : indexL,
                    value     : '2'
                });
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcol_stc_inv_item',
                    line : indexL,
                    value     : '2'
                });
                totalEstimate = Number(totalEstimate) + Number(data[i].amount)
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
                    fieldId : 'cseg_paactivitycode',
                    line      : indexL,
                    value : data[i].activityCode
                })
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'cseg1',
                    line      : indexL,
                    value : data[i].bussinessUnit
                })
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'currency',
                    line : indexL,
                    value     : '1'
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
                createPr.setSublistValue({
                    sublistId : 'item',
                    fieldId   : 'custcolid_line_tor',
                    line      : indexL,
                    value     : data[i].idLine
                })
                indexL ++;

            }
            createPr.setValue({
                fieldId : 'estimatedtotal',
                value : totalEstimate
            })
            log.debug('totalEstimate', totalEstimate)
            createPr.setValue({
                fieldId : 'custbody_amount_from_tor',
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
        var totalAmount = 0
        for (var i = 0; i < data.length; i++) {
            var rowData = data[i];

            var category = '';
            var expAcc = null;

            if (rowData.item) {
                log.debug('idLine', rowData.idLine)
                var itemSearchObj = search.create({
                    type: "item",
                    filters: [["internalid", "anyof", rowData.item]],
                    columns: ["expenseaccount"]
                });
                itemSearchObj.run().each(function (result) {
                    expAcc = result.getValue({ name: 'expenseaccount' });
                    return false;
                });
                log.debug('expAcc', expAcc)
                if (expAcc) {
                    var catSearch = search.create({
                        type: "expensecategory",
                        filters: [["account", "anyof", expAcc]],
                        columns: ["internalid"]
                    });
                    if (catSearch.runPaged().count > 0) {
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
            if(rowData.item == '774'){
                    category = '25'
                    createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_diem', line: i, value: true });
                    
                createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_category', line: i, value: '25' });
                }
                log.debug('category TAR', category)
            if (category) {
                
                createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_category', line: i, value: category });
            }
            if(rowData.description){
                createTar.setSublistValue({sublistId : sublistId, fieldId : 'custrecord_tare_memo', line : i, value : rowData.description})
            }
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
            if (rowData.bussinessUnit) {
                createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_ter_business_unit', line: i, value: rowData.bussinessUnit });
            }
            if (rowData.sof) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_source_of_funding', line: i, value: rowData.sof });
            if (rowData.drc) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_drc', line: i, value: rowData.drc });
            if (rowData.dea) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_dea', line: i, value: rowData.dea });
            totalAmount = Number(totalAmount) + Number(rowData.amount)
            if (rowData.amount) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_amount', line: i, value: rowData.amount });
            if (rowData.costCenter) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_cost_center', line: i, value: rowData.costCenter });
            if (rowData.projectCode) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tare_project_code', line: i, value: rowData.projectCode });
            if (rowData.bussinessUnit) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_ter_business_unit', line: i, value: rowData.bussinessUnit });
            if (rowData.activityCode) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tar_activity_code', line: i, value: rowData.activityCode });
             if (rowData.idLine) createTar.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_id_item_form_tar', line: i, value: rowData.idLine });
            
        }
         createTar.setValue({
            fieldId: 'custrecord_amount_from_tor',
            value: totalAmount
        });
    }
    function beforeLoad(context) {
        try{
            if (context.type == context.UserEventType.CREATE) {
                var transData = context.newRecord;
                var currentUser = runtime.getCurrentUser();
                var roleId = currentUser.role;
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

                        if (transactionType == '1') {
                            transPO(dataParsing, transData);
                        } else if (transactionType == '2') {
                            // context.form.clientScriptModulePath = "SuiteScripts/abj_cs_set_exp_report.js"
                            // log.debug('cek exp')
                            transExp(dataParsing, transData, roleId);
                        } else if (transactionType == '3') {
                            transPR(dataParsing, transData);
                        } else if (transactionType == '4') {
                            transTar(dataParsing, transData);
                        } else if (transactionType == '5') {
                            transPoVen(dataParsing, transData);
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

    function afterSubmit(context) {
        try {
            var rec = (context.type == context.UserEventType.DELETE) ? context.oldRecord : context.newRecord;
            var idRec = rec.id;
            var recType = rec.type;
            
            log.debug('afterSubmit Executed', { eventType: context.type, recType: recType, idRec: idRec });

            var typeToCheck = '';
            var lineSublistId = 'item';
            var amountFieldId = 'estimatedamount';
            var sofFieldId = 'customer';

            if (recType == 'purchaseorder') {
                var cekCustomForm = rec.getValue('custbody_stc_po_type');
                typeToCheck = (cekCustomForm == '3') ? '5' : '1';
                lineSublistId = 'item';
                amountFieldId = 'amount';
                sofFieldId = 'custcolid_line_tor';
            } else if (recType == 'expensereport') {
                typeToCheck = '2';
                lineSublistId = 'expense';
                amountFieldId = 'amount'; 
                sofFieldId = 'customer';
            } else if (recType == 'purchaserequisition') {
                typeToCheck = '3';
                lineSublistId = 'item';
                amountFieldId = 'estimatedamount';
                sofFieldId = 'custcolid_line_tor';
            } else {
                typeToCheck = '4'; 
                lineSublistId = 'recmachcustrecord_tar_e_id'; 
                amountFieldId = 'custrecord_tare_amount'; 
                sofFieldId = 'custrecord_id_item_form_tar'; 
            }

            var cekIdTOR = rec.getValue('custbody_id_to');
            if (recType == 'customrecord_tar') {
                cekIdTOR = rec.getValue('custrecord_tar_link_to_tor');
            }

            if (!cekIdTOR) return;

            // --- 1. HITUNG MAP TRANSAKSI SAAT INI (NEW RECORD) ---
            var currentRecordSummaryMap = {};
            if (context.type !== context.UserEventType.DELETE) {
                var currentLineCount = rec.getLineCount({ sublistId: lineSublistId });
                log.debug('currentLineCount', currentLineCount)
                for (var x = 0; x < currentLineCount; x++) {
                    log.debug('sofFieldId', sofFieldId)
                    log.debug('amountFieldId', amountFieldId)
                    var lineSof = rec.getSublistValue({ sublistId: lineSublistId, fieldId: sofFieldId, line: x });
                    var lineAmount = parseFloat(rec.getSublistValue({ sublistId: lineSublistId, fieldId: amountFieldId, line: x })) || 0;
                    log.debug('lineAmount', lineAmount)
                    log.debug('lineSof', lineSof)
                    if (lineSof) {
                        var sofStr = lineSof.toString();
                        if (!currentRecordSummaryMap[sofStr]) {
                            currentRecordSummaryMap[sofStr] = 0;
                        }
                        currentRecordSummaryMap[sofStr] += lineAmount;
                    }
                }
            }

            var recLoadTOR = record.load({ type: 'customrecord_tor', id: cekIdTOR });
            var torLineCount = recLoadTOR.getLineCount({ sublistId: 'recmachcustrecord_tori_id' });
            var isChangedTOR = false;

            // =================================================================
            // PROCESSOR UNTUK EVENT: CREATE
            // =================================================================
            if (context.type == context.UserEventType.CREATE) {
                for (var i = 0; i < torLineCount; i++) {
                    var torTxType = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
                    var torSof = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project', line: i });
                    
                    if(torTxType != '2'){
                        var torSof = recLoadTOR.getSublistValue({ 
                            sublistId: 'recmachcustrecord_tori_id', 
                            fieldId: 'id', 
                            line: i 
                        });
                    }
                    log.debug('currentRecordSummaryMap', currentRecordSummaryMap[String(torSof)])
                    log.debug('torTxType', torTxType)
                    log.debug('typeToCheck', typeToCheck)
                    if (torTxType == typeToCheck && currentRecordSummaryMap[String(torSof)] !== undefined) {
                        var fieldToSet = (torTxType == '4') ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                        log.debug('fieldToSet', fieldToSet)
                        var existingValues = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i }) || [];
                        if (!Array.isArray(existingValues)) existingValues = existingValues ? [existingValues] : [];
                        log.debug('existingValues', existingValues)
                        if (existingValues.indexOf(idRec.toString()) === -1) {
                            existingValues.push(idRec.toString());
                            recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i, value: existingValues });
                        }

                        var currentAllocated = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i })) || 0;
                        log.debug('currentAllocated', currentAllocated)
                        log.debug('currentRecordSummaryMap[String(torSof)]', currentRecordSummaryMap[String(torSof)])
                        var newAllocated = currentAllocated + currentRecordSummaryMap[String(torSof)];
                        log.debug('newAllocated', newAllocated)
                        recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i, value: newAllocated });
                        isChangedTOR = true;
                    }
                }
            }

            // =================================================================
            // PROCESSOR UNTUK EVENT: EDIT
            // =================================================================
            if (context.type == context.UserEventType.EDIT) {
                var oldRec = context.oldRecord;
                var oldRecordSummaryMap = {};
                var oldLineCount = oldRec.getLineCount({ sublistId: lineSublistId });
                
                for (var y = 0; y < oldLineCount; y++) {
                    var oldSof = oldRec.getSublistValue({ sublistId: lineSublistId, fieldId: sofFieldId, line: y });
                    var oldAmount = parseFloat(oldRec.getSublistValue({ sublistId: lineSublistId, fieldId: amountFieldId, line: y })) || 0;
                    if (oldSof) {
                        var oldSofStr = oldSof.toString();
                        if (!oldRecordSummaryMap[oldSofStr]) oldRecordSummaryMap[oldSofStr] = 0;
                        oldRecordSummaryMap[oldSofStr] += oldAmount;
                    }
                }

                for (var i = 0; i < torLineCount; i++) {
                    var torTxType = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
                    var torSof = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project', line: i });
                    if(torTxType != '2'){
                        var torSof = recLoadTOR.getSublistValue({ 
                            sublistId: 'recmachcustrecord_tori_id', 
                            fieldId: 'id', 
                            line: i 
                        });
                    }
                    if (torTxType == typeToCheck) {
                        var fieldToSet = (torTxType == '4') ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                        var existingValues = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i }) || [];
                        if (!Array.isArray(existingValues)) existingValues = existingValues ? [existingValues] : [];

                        var currentAllocated = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i })) || 0;
                        var oldSofAmt = oldRecordSummaryMap[String(torSof)] || 0;
                        var newSofAmt = currentRecordSummaryMap[String(torSof)] || 0;

                        if (currentRecordSummaryMap[String(torSof)] !== undefined) {
                            if (existingValues.indexOf(idRec.toString()) === -1) {
                                existingValues.push(idRec.toString());
                                recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i, value: existingValues });
                            }
                            var updatedAllocated = currentAllocated - oldSofAmt + newSofAmt;
                            recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i, value: updatedAllocated });
                            isChangedTOR = true;
                        } else {
                            if (existingValues.indexOf(idRec.toString()) > -1) {
                                var updatedValues = existingValues.filter(function(val) { return val != idRec.toString(); });
                                recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i, value: updatedValues });
                                
                                var updatedAllocated = Math.max(0, currentAllocated - oldSofAmt);
                                recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i, value: updatedAllocated });
                                isChangedTOR = true;
                            }
                        }
                    }
                }
            }

            // =================================================================
            // PROCESSOR UNTUK EVENT: DELETE (SOLVED & OPTIMIZED)
            // =================================================================
            if (context.type == context.UserEventType.DELETE) {
                var deletedRecordSummaryMap = {};
                var deletedLineCount = rec.getLineCount({ sublistId: lineSublistId });
                
                for (var z = 0; z < deletedLineCount; z++) {
                    var delSof = rec.getSublistValue({ sublistId: lineSublistId, fieldId: sofFieldId, line: z });
                    var delAmount = parseFloat(rec.getSublistValue({ sublistId: lineSublistId, fieldId: amountFieldId, line: z })) || 0;
                    if (delSof) {
                        var delSofStr = delSof.toString();
                        if (!deletedRecordSummaryMap[delSofStr]) deletedRecordSummaryMap[delSofStr] = 0;
                        deletedRecordSummaryMap[delSofStr] += delAmount;
                    }
                }

                var targetIdStr = idRec.toString();
                log.debug('Processing Delete For Target ID', targetIdStr);
                log.debug('Deleted Record Summary Map', deletedRecordSummaryMap);

                for (var i = 0; i < torLineCount; i++) {
                    var torTxType = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
                    var torSof = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project', line: i });

                    // Ubah pembanding ke String agar aman
                    var torSofStr = torSof ? torSof.toString() : '';

                    // SOLUSI: Validasi kecocokan berdasarkan tipe transaksi dan SOF yang dihapus
                    if (torTxType == typeToCheck && deletedRecordSummaryMap[torSofStr] !== undefined) {
                        
                        var fieldToSet = (torTxType == '4') ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                        log.debug('fieldToSet', fieldToSet)
                        var rawExistingValues = recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i }) || [];
                        log.debug('rawExistingValues', rawExistingValues)
                        
                        if (!Array.isArray(rawExistingValues)) {
                            rawExistingValues = rawExistingValues ? [rawExistingValues] : [];
                        }

                        var existingValues = rawExistingValues.map(function(val) { return val.toString(); });
                        log.debug('existingValues', existingValues)
                        // 1. Bersihkan link ID jika memang masih tersisa di TOR
                        if (existingValues.indexOf(targetIdStr) > -1) {
                            var updatedValues = existingValues.filter(function(val) { return val !== targetIdStr; });
                            recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldToSet, line: i, value: updatedValues });
                        }
                        
                        // 2. Jalankan pengurangan budget secara absolut berdasarkan kecocokan SOF
                        var currentAllocated = parseFloat(recLoadTOR.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i })) || 0;
                        var delSofAmt = deletedRecordSummaryMap[torSofStr] || 0;
                        var updatedAllocated = Math.max(0, currentAllocated - delSofAmt);
                        
                        log.debug('Updating TOR Line ' + i, {
                            sof: torSofStr,
                            currentAllocated: currentAllocated,
                            minusAmount: delSofAmt,
                            finalAllocated: updatedAllocated
                        });

                        recLoadTOR.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_amount_allocated', line: i, value: updatedAllocated });
                        isChangedTOR = true;
                    }
                }
            }

            if (isChangedTOR) recLoadTOR.save();

        } catch (e) {
            log.error('Error on afterSubmit Stage', e);
        }
    }

    function processUnlink(torId, recordToRemove, linesToMatch, fieldId) {
        log.debug('unlink tor standard', torId);
        var recLoad = record.load({ type: 'customrecord_tor', id: torId });
        var cekLine = recLoad.getLineCount({ sublistId: 'recmachcustrecord_tori_id' });
        var isChanged = false;

        for (var i = 0; i < cekLine; i++) {
            var torLineId = recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'id', line: i });

            if (linesToMatch.indexOf(String(torLineId)) > -1) {
                var existingValues = recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldId, line: i }) || [];
                if (!Array.isArray(existingValues)) existingValues = existingValues ? [existingValues] : [];

                var updatedValues = existingValues.filter(function(val) { return val != String(recordToRemove); });

                if (updatedValues.length !== existingValues.length) {
                    recLoad.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldId, line: i, value: updatedValues });
                    isChanged = true;
                }
            }
        }
        if (isChanged) recLoad.save();
    }

    function processUnlinkBySof(torId, recordToRemove, sofIdsToMatch, fieldId, typeToCheck) {
        log.debug('unlink tor by sof matching', { torId: torId, sofIds: sofIdsToMatch });
        var recLoad = record.load({ type: 'customrecord_tor', id: torId });
        var cekLine = recLoad.getLineCount({ sublistId: 'recmachcustrecord_tori_id' });
        var isChanged = false;

        for (var i = 0; i < cekLine; i++) {
            var torTxType = recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_transaction_type', line: i });
            var torSof = recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project', line: i });

            if (torTxType == typeToCheck && sofIdsToMatch.indexOf(String(torSof)) > -1) {
                var existingValues = recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldId, line: i }) || [];
                if (!Array.isArray(existingValues)) existingValues = existingValues ? [existingValues] : [];

                var updatedValues = existingValues.filter(function(val) { return val != String(recordToRemove); });

                if (updatedValues.length !== existingValues.length) {
                    recLoad.setSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: fieldId, line: i, value: updatedValues });
                    isChanged = true;
                }
            }
        }
        if (isChanged) recLoad.save();
    }
    return {
        beforeLoad: beforeLoad,
        afterSubmit : afterSubmit
    };
});
