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
                    log.debug('startDate b', startDate)
                    log.debug('endDate b', endDate)

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
                    log.debug("vendorSearchObj result count",searchResultCount);
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
                        label: "Budget",
                        type: serverWidget.FieldType.CURRENCY,
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
                    if(allDataVendor.length > 0){
                        log.debug('ada data', allDataVendor)
                        var i = 0;
                        allDataVendor.forEach((data)=>{
                            var vendId = data.vendId;
                            var vendName = data.vendName;
                            if(vendName == ''){
                                vendName = '-'
                            }
                            var budgetVanedor = data.budgetVanedor;
                            var vendExtId = data.vendExtId
                            log.debug('vendId', vendId);
                            var totalAmountOpen = 0;
                            var totalAmountPaid = 0;
                            var statusBill = '';
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
                            log.debug("vendorbillSearchObj result count",searchResultCount);
                            vendorbillSearchObj.run().each(function(result){
                                var amount = result.getValue({
                                    name : "amount"
                                });
                                statusBill = result.getValue({
                                    name : "statusref"
                                });
                                log.debug('statusBill', statusBill);
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
                                log.debug('budgetVendor', budgetVanedor)
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
                            log.debug('budgetVanedor', budgetVanedor)
                            if(budgetVanedor == ''){
                                budgetVanedor = 0
                            }
                            sublist.setSublistValue({
                                sublistId: "custpage_sublist_item_list",
                                id: "custpage_sublist_budget",
                                value: budgetVanedor,
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
                                totalAmountOpen : totalAmountOpen,
                                prosentaseBudgetOpen : prosentaseBudgetOpen,
                                totalAmountPaid : totalAmountPaid,
                                prosentaseBudgetPaid : prosentaseBudgetPaid,
                                startDate : startDate,
                                endDate : endDate
                            })
                            i ++
                        })
                    }
                    log.debug('allData', allData);
                    allData = JSON.stringify(allData);
                    log.debug('allData after json', allData);
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