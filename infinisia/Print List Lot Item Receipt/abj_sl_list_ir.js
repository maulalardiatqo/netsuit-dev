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
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000,
            });
            resultslice.forEach(function (slice) {
                searchResults.push(slice);
                searchid++;
            });
        } while (resultslice.length >= 1000);
        return searchResults;
    }

    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Listn Item Receipt",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });

            var locationOpt = form.addField({
                id: "custpage_location_opt",
                label: "LOCATION",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "location",
            });
            var startDateField = form.addField({
                id: "custpage_start_date",
                label: "Start Date",
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
            });
        
            // Tambahkan field untuk end date
            var endDateField = form.addField({
                id: "custpage_end_date",
                label: "End Date",
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
            });
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var location = context.request.parameters.custpage_location_opt;
                var startDate = context.request.parameters.custpage_start_date;
                var endDate = context.request.parameters.custpage_end_date;
                if(startDate){
                    startDate = format.format({
                        value: startDate,
                        type: format.Type.DATE
                    });
                }
                if(endDate){
                    endDate = format.format({
                        value: endDate,
                        type: format.Type.DATE
                    });
                }
                log.debug('filters', {location : location, startDate : startDate, endDate : endDate});
                var currentRecord = createSublist("custpage_sublist_item", form);
                var itemreceiptSearchObj = search.create({
                    type: "itemreceipt",
                    filters:
                    [
                        ["type","anyof","ItemRcpt"], 
                        "AND", 
                        ["mainline","is","T"], 
                    ],
                    columns:
                    [
                        search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                        search.createColumn({name: "purchaseorder", label: "Purchase Order"}),
                        search.createColumn({name: "location", label: "Location"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "createdfrom"}),
                        search.createColumn({name: "entity",}),
                        search.createColumn({name: "tranid",}),
                        search.createColumn({name: "internalid",})
                    ]
                });
                if(startDate && endDate == ''){
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: startDate
                        })
                    )
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: startDate
                        })
                    )
                }
                if(endDate && startDate == ''){
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: endDate
                        })
                    )
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: endDate
                        })
                    )
                }
                if(startDate && endDate){
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: startDate
                        })
                    )
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: endDate
                        })
                    )
                }
                if(location){
                    itemreceiptSearchObj.filters.push(
                        search.createFilter({
                            name: "location",
                            operator: search.Operator.ANYOF,
                            values: location
                        })
                    )
                }
                var searchResultCount = itemreceiptSearchObj.runPaged().count;
                log.debug("itemreceiptSearchObj result count",searchResultCount);
                var allIdIr = [];
                var i = 0;
                itemreceiptSearchObj.run().each(function(result){
                    var trandId = result.getValue({
                        name: "tranid"
                    });
                    var internalId = result.getValue({
                        name: "internalid"
                    });
                    var location = result.getValue({
                        name: "location"
                    });
                    var trandate = result.getValue({
                        name: "trandate"
                    });
                    var poNo = result.getValue({
                        name: "createdfrom"
                    });
                    var vendorName = result.getValue({
                        name: "entity"
                    });
                    allIdIr.push(internalId)
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_po",
                        value: poNo,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_vendor",
                        value: vendorName,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_ir",
                        value: internalId,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_date",
                        value: trandate,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_location",
                        value: location,
                        line: i,
                    });

                    i ++
                    return true;
                });
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Print SPPB",
                    functionName: "printSPPB()"
                });
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Print Checklist Barang Masuk",
                    functionName: "printChecklist()"
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_print_lot_ir.js";

                context.response.writePage(form);
            }

        }catch(e){
            log.debug('error', e)
        }
        
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Item Receipt List",
            tab: "matchedtab",
        });
        sublist_in.addField({
            id: "custpage_sublist_check_bin",
            label: "Select",
            type: serverWidget.FieldType.CHECKBOX,
        });
        sublist_in.addField({
            id: "custpage_sublist_po",
            label: "PO Number",
            type: serverWidget.FieldType.SELECT,
            source : 'purchaseorder'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
        });
        sublist_in.addField({
            id: "custpage_sublist_vendor",
            label: "Vendor",
            type: serverWidget.FieldType.SELECT,
            source : 'vendor'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
        });
        sublist_in.addField({
            id: "custpage_sublist_ir",
            label: "Item Receipt",
            type: serverWidget.FieldType.SELECT,
            source : 'itemreceipt'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
        });
        sublist_in.addField({
            id: "custpage_sublist_date",
            label: "Date",
            type: serverWidget.FieldType.DATE,
        });
        sublist_in.addField({
            id: "custpage_sublist_location",
            label: "Location",
            type: serverWidget.FieldType.SELECT,
            source : 'location'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
        });
        return sublist_in;
    }
    return {
        onRequest: onRequest,
    };
});