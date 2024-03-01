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
                title: "List Item",
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
            locationOpt.isMandatory = true;
            var itemOpt = form.addField({
                id: "custpage_item_opt",
                label: "Item",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "item",
            });
            itemOpt.isMandatory = true;
            var binOpt = form.addField({
                id: "custpage_bin_opt",
                label: "Bin",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "bin",
            });
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var location = context.request.parameters.custpage_location_opt;
                var item = context.request.parameters.custpage_item_opt;
                var bin = context.request.parameters.custpage_bin_opt;
                log.debug('filters', {location : location, item : item, bin : bin});
                var currentRecord = createSublist("custpage_sublist_item", form);
                if(bin){
                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                        [
                            ["inventorynumber.isonhand","is","T"], 
                            "AND", 
                            ["internalid","anyof",item], 
                            "AND", 
                            ["inventorydetail.binnumber","anyof",bin], 
                            "AND", 
                            ["inventorydetail.location","anyof",location]
                        ],
                        columns:
                        [
                            search.createColumn({name: "displayname", label: "Display Name"}),
                            search.createColumn({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                                label: " Number"
                            }),
                            search.createColumn({
                                name: "binnumber",
                                join: "inventoryDetail",
                                label: "Bin Number"
                            }),
                            search.createColumn({
                                name: "expirationdate",
                                join: "inventoryDetail",
                                label: "Expiration Date"
                            }),
                            search.createColumn({
                                name: "location",
                                join: "inventoryDetail",
                                label: "Location"
                            })
                        ]
                    });
                }else{
                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                        [
                            ["inventorynumber.isonhand","is","T"], 
                            "AND", 
                            ["internalid","anyof",item],
                            "AND", 
                            ["inventorydetail.location","anyof",location]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                sort: search.Sort.ASC,
                                label: "Name"
                             }),
                            search.createColumn({name: "stockunit", label: "Primary Stock Unit"}),
                            search.createColumn({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                                label: " Number"
                            }),
                            search.createColumn({
                                name: "binnumber",
                                join: "inventoryDetail",
                                label: "Bin Number"
                            }),
                            search.createColumn({
                                name: "expirationdate",
                                join: "inventoryDetail",
                                label: "Expiration Date"
                            }),
                            search.createColumn({
                                name: "location",
                                join: "inventoryDetail",
                                label: "Location"
                            })
                        ]
                    });
                }
               
                var searchResultCount = itemSearchObj.runPaged().count;
                log.debug("itemSearchObj result count",searchResultCount);
                var allData = []
                var i = 0
                itemSearchObj.run().each(function(result){
                    var ItemName = result.getValue({
                        name: "itemid",
                    });
                    var invNumber = result.getText({
                        name: "inventorynumber",
                        join: "inventoryDetail",
                    })
                    var location = result.getText({
                        name: "location",
                        join: "inventoryDetail",
                    });
                    var expireDate = result.getValue({
                        name: "expirationdate",
                        join: "inventoryDetail",
                    })
                    log.debug('data', {ItemName : ItemName, invNumber : invNumber, location : location, expireDate : expireDate});
                    var binNumber = result.getText({
                        name: "binnumber",
                        join: "inventoryDetail",
                    })
                    var stockUnit = result.getValue({
                        name: "stockunit",
                    });

                    if(ItemName){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_item",
                            value: ItemName,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_item",
                            value: '-',
                            line: i,
                        });
                    }

                    if(stockUnit){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_unit",
                            value: stockUnit,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_unit",
                            value: '-',
                            line: i,
                        });
                    }

                    if(invNumber){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invnumber",
                            value: invNumber,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invnumber",
                            value: '-',
                            line: i,
                        });
                    }

                    if(location){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_location",
                            value: location,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_location",
                            value: '-',
                            line: i,
                        });
                    }
                    
                    if(binNumber){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_bin",
                            value: binNumber,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_bin",
                            value: '-',
                            line: i,
                        });
                    }
                    
                    if(expireDate){
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_expdate",
                            value: expireDate,
                            line: i,
                        });
                    }else{
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_expdate",
                            value: '-',
                            line: i,
                        });
                    }   
                    
                    allData.push({
                        ItemName : ItemName,
                        invNumber : invNumber,
                        location : location,
                        expireDate : expireDate,
                        binNumber : binNumber,
                        
                    })
                    i ++
                    return true;
                });
                
                log.debug('allData', allData)
                form.addButton({
                    id: 'custpage_button_print',
                    label: "Print Stock Card",
                    functionName: "printStock()"
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_print_stock_card.js";

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
            id: "custpage_sublist_item",
            label: "Item",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_unit",
            label: "Primary Stock Unit",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_invnumber",
            label: "Inventory Number",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_location",
            label: "Location",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_bin",
            label: "Bin Number",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_expdate",
            label: "Expired Date",
            type: serverWidget.FieldType.TEXT,
        });

        return sublist_in;
    }
    return {
        onRequest: onRequest,
    };
});