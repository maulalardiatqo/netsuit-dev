/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file","N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file,
    format,
){
    
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "Download Budget Vendor Report",
        });
        try{
            function getAllResults(s) {
                var results = s.run();
                var searchResults = [];
                var searchid = 0;
                do {
                    var resultslice = results.getRange({
                    start: searchid,
                    end: searchid + 1000
                    });
                    resultslice.forEach(function(slice) {
                        searchResults.push(slice);
                        searchid++;
                    });
                } while (resultslice.length >= 1000);
                return searchResults;
            }
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: "Vendor Budget",
                });
                var filterOption = form.addFieldGroup({
                    id: "filteroption",
                    label: "FILTERS",
                });
                var startDateField = form.addField({
                    id: "custpage_start_date",
                    label: "Start Date",
                    type: serverWidget.FieldType.DATE,
                    container: "filteroption",
                    isMandatory: true 
                });
                
                var endDateField = form.addField({
                    id: "custpage_end_date",
                    label: "End Date",
                    type: serverWidget.FieldType.DATE,
                    container: "filteroption",
                    isMandatory: true 
                });
                form.addSubmitButton({
                    label: 'Search'
                });
                context.response.writePage(form);
            }else{
                try{
                    var startDate = context.request.parameters.custpage_start_date;
                    var endDate = context.request.parameters.custpage_end_date;
                    var dateObj = new Date(startDate);
                    var year = dateObj.getFullYear();
                    log.debug('startDate b', startDate)
                    log.debug('endDate b', endDate)
                    log.debug('year', year)

                    var allDataVendor = [];
                    var vendorSearchObj = search.create({
                        type: "vendor",
                        filters:
                        [
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "ID"
                            }),
                            search.createColumn({name: "internalid",}),
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "custentity_abj_msa_budget_vendor", label: "Budget Vendor"}),
                            search.createColumn({name: "companyname", label: "Company Name"}),
                            search.createColumn({name: "comments", label: "Comments"})
                        ]
                    });
                    var searchResultCount = vendorSearchObj.runPaged().count;
                    var allDataVendor = [];
                    var vendName = '-';
                    var budgetVanedor = 0;
                    vendorSearchObj.run().each(function(result){
                        var vendExtId = result.getValue({
                            name : "entityid"
                        });
                        var vendId = result.getValue({
                            name : "internalid"
                        });
                        vendName = result.getValue({
                            name : "companyname"
                        })
                        if(vendName == ''){
                            vendName = result.getValue({
                                name : "companyname"
                            });
                        }
                        budgetVanedor = result.getValue({
                            name : "custentity_abj_msa_budget_vendor"
                        })
                        allDataVendor.push({
                            vendId : vendId,
                            vendName : vendName,
                            budgetVanedor : budgetVanedor,
                            vendExtId : vendExtId
                        })
                        return true;
                    });
                    var allDataToCompare = [];
                    var allDataSavedsearchVendor = search.load({
                        id: 'customsearch981'
                    });
                    if(year){
                        allDataSavedsearchVendor.filters.push(
                            search.createFilter({
                                name: "custrecord_abj_budget_year",
                                operator: search.Operator.IS,
                                values: year,
                            })
                        );
                    }
                    var resultSavedSearch = getAllResults(allDataSavedsearchVendor);
                    log.debug('resultSavedSearch', resultSavedSearch)
                    resultSavedSearch.forEach(function(result){
                        var idVend = result.getValue({
                            name : 'custrecord_abj_vendor'
                        })
                        var vendBudget = result.getValue({
                            name : "custrecord_abj_vend_budget"
                        })
                        var vendQty = result.getValue({
                            name : "custrecord_abj_vend_qty"
                        });
                        log.debug('vendQty', vendQty)
                        allDataToCompare.push({
                            idVend : idVend,
                            vendBudget : vendBudget,
                            vendQty : vendQty
                        })
                    })
                    var sublist = form.addSublist({
                        id: "custpage_sublist_item_list",
                        type: serverWidget.SublistType.LIST,
                        label: "Vendor Budget",
                    });
                    sublist.addField({
                        id: "custpage_sublist_ext_id",
                        label: "External Id Vendor",
                        type: serverWidget.FieldType.TEXT,
                    });
                    sublist.addField({
                        id: "custpage_sublist_vendname",
                        label: "Vendor Name",
                        type: serverWidget.FieldType.TEXT,
                    });
                    
                    sublist.addField({
                        id: "custpage_sublist_budget",
                        label: "Vendor Budget",
                        type: serverWidget.FieldType.CURRENCY,
                    });
                    sublist.addField({
                        id: "custpage_sublist_vendqty",
                        label: "Vendor Qty",
                        type: serverWidget.FieldType.TEXT,
                    });
                    sublist.addField({
                        id: "custpage_sublist_bill_open",
                        label: "Achive (Bill)/Open",
                        type: serverWidget.FieldType.CURRENCY,
                    });
                    sublist.addField({
                        id: "custpage_sublist_open_pro",
                        label: "%",
                        type: serverWidget.FieldType.TEXT,
                    });
                    sublist.addField({
                        id: "custpage_sublist_achive_qty",
                        label: "Achive QTY",
                        type: serverWidget.FieldType.TEXT,
                    });
                    sublist.addField({
                        id: "custpage_sublist_paid",
                        label: "Achive (Bill Payment)/Paid In Full",
                        type: serverWidget.FieldType.CURRENCY,
                    });
                    sublist.addField({
                        id: "custpage_sublist_paid_pro",
                        label: "%",
                        type: serverWidget.FieldType.TEXT,
                    });
                    var allData = [];
                    var dataVendExc = [];
                    log.debug('type of year', typeof year)
                    allDataVendor.forEach((data)=>{
                        var vendId = data.vendId
                        var vendName = data.vendName
                        var vendExtId = data.vendExtId
                        var budgetVanedor = 0
                        var qtyVend = 0
                        allDataToCompare.forEach(function(data){
                            var idVend = data.idVend
                            if(idVend == vendId){
                                budgetVanedor = data.vendBudget || 0
                                qtyVend = data.vendQty || 0
                                log.debug('qtyVend', qtyVend)
                            }
                        })
                        dataVendExc.push({
                            vendId : vendId,
                            vendName : vendName,
                            vendExtId : vendExtId,
                            budgetVanedor : budgetVanedor,
                            qtyVend : qtyVend
                        })
                    })
                    if(dataVendExc.length > 0){
                        var i = 0;
                        dataVendExc.forEach((data)=>{
                            var vendId = data.vendId;
                            var vendName = data.vendName;
                            if(vendName == ''){
                                vendName = '-'
                            }
                            var budgetVanedor = data.budgetVanedor;
                            var vendExtId = data.vendExtId;
                            var totalAmountOpen = 0;
                            var totalAmountPaid = 0;
                            var statusBill = '';
                            var vendQty = data.qtyVend
                            var qtyIR = 0;

                            var itemreceiptSearchObj = search.create({
                                type: "itemreceipt",
                                filters:
                                [
                                    ["type","anyof","ItemRcpt"], 
                                    "AND", 
                                    ["mainline","is","F"], 
                                    "AND", 
                                    ["taxline","is","F"], 
                                    "AND", 
                                    ["quantity","isnotempty",""], 
                                    "AND", 
                                    ["vendor.internalid","anyof",vendId]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "quantity",
                                        summary: "SUM",
                                        label: "Quantity"
                                    })
                                ]
                            });
                            var searchResultCount = itemreceiptSearchObj.runPaged().count;
                            log.debug("itemreceiptSearchObj result count",searchResultCount);
                            itemreceiptSearchObj.run().each(function(dataResult){
                                var irqty = dataResult.getValue({
                                    name: "quantity",
                                    summary: "SUM"
                                });
                                if(irqty){
                                    qtyIR = irqty
                                }
                            return true;
                            });

                            var vendorbillSearchObj = search.create({
                                type: "vendorbill",
                                filters:
                                [
                                    ["type","anyof","VendBill"], 
                                    "AND", 
                                    ["mainline","is","T"], 
                                    "AND", 
                                    ["vendor.internalid","anyof",vendId],
                                    "AND",
                                    ["trandate","within",startDate,endDate]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "amount", label: "Amount"}),
                                    search.createColumn({name: "statusref", label: "Status"}),
                                    search.createColumn({
                                        name: "entityid",
                                        join: "vendor",
                                        label: "ID"
                                    })
                                ]
                            });
                            var searchResultCount = vendorbillSearchObj.runPaged().count;
                            
                            vendorbillSearchObj.run().each(function(result){
                                var amount = result.getValue({
                                    name : "amount"
                                });
                                statusBill = result.getValue({
                                    name : "statusref"
                                });
                                
                                if(statusBill == 'paidInFull'){
                                    totalAmountPaid += Number(amount)
                                }
                                if(statusBill == 'open'){
                                    totalAmountOpen += Number(amount)
                                }
                                return true;
                            });
                            
                            var prosentaseBudgetPaid = 0;
                            var prosentaseBudgetOpen = 0;
                            if(budgetVanedor != 0){
                                
                                prosentaseBudgetPaid = ((totalAmountPaid / budgetVanedor) * 100).toFixed(2);
                                prosentaseBudgetOpen = ((totalAmountOpen / budgetVanedor) * 100).toFixed(2)
                            }
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_ext_id",
                                value: vendExtId,
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_vendname",
                                value: vendName,
                                line: i,
                            });
                            
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_budget",
                                value: budgetVanedor,
                                line: i,
                            });
                            log.debug('vendQty before set', vendQty)
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_vendqty",
                                value: vendQty || 0,
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_bill_open",
                                value: totalAmountOpen,
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_open_pro",
                                value: prosentaseBudgetOpen + '%',
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_achive_qty",
                                value: qtyIR,
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_paid",
                                value: totalAmountPaid,
                                line: i,
                            });
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_paid_pro",
                                value: prosentaseBudgetPaid + '%',
                                line: i,
                            });
                            allData.push({
                                vendId : vendId,
                                vendExtId : vendExtId,
                                vendName : vendName,
                                budgetVanedor : budgetVanedor,
                                vendQty : vendQty,
                                totalAmountOpen : totalAmountOpen,
                                prosentaseBudgetOpen : prosentaseBudgetOpen,
                                qtyIR : qtyIR,
                                totalAmountPaid : totalAmountPaid,
                                prosentaseBudgetPaid : prosentaseBudgetPaid,
                                startDate : startDate,
                                endDate : endDate
                            })
                            i ++
                        })
                    }
                    
                    allData = JSON.stringify(allData);
                    
                    form.addButton({
                        label: 'Download',
                        id: 'custpage_button_po',
                        functionName: "download("+JSON.stringify(allData)+")"
                    });
                    form.clientScriptModulePath = "SuiteScripts/abj_cs_print_bp.js";
                    context.response.writePage(form);
                }catch(e){
                    log.debug('error', e)
                }
                
                
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return {
        onRequest: onRequest
    };
});