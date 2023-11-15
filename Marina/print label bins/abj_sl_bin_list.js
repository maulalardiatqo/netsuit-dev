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
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config
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
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: "Bins List",
        });
      
        var filterOption = form.addFieldGroup({
            id: "filteroption",
            label: "FILTERS",
        });
        var locationOpt = (form.addField({
            id: "custpage_location_opt",
            label: "LOCATION",
            type: serverWidget.FieldType.SELECT,
            container: "filteroption",
            source: "location",
        }).isMandatory = false);
        form.addSubmitButton({
            label: "Search",
        });
        if(context.request.method === 'GET'){
            context.response.writePage(form);
        }else{
            let binLocation = context.request.parameters.custpage_location_opt;
            log.debug('binlocation', binLocation);
            var allData = [];
            if(binLocation == ''){
                log.debug('binlocation empty')
                var binSearchObj = search.create({
                    type: "bin",
                    filters:
                    [
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({
                            name: "binnumber",
                            sort: search.Sort.ASC,
                            label: "Bin Number"
                        }),
                        search.createColumn({name: "location", label: "Location"}),
                        search.createColumn({name: "memo", label: "Memo"}),
                        search.createColumn({name: "sequencenumber", label: "Sequence Number"}),
                        search.createColumn({name: "type", label: "Type"}),
                        search.createColumn({name: "zone", label: "Zone"})
                    ]
                });
                var searchResultCount = binSearchObj.runPaged().count;
                log.debug("binSearchObj result count",searchResultCount);
                binSearchObj.run().each(function(result){
                    var internalid = result.getValue({
                        name : "internalid"
                    })
                    var binNumber = result.getValue({
                        name : "binnumber"
                    });
                    var locationBin = result.getText({
                        name : "location"
                    });
                    var typeBin = result.getValue({
                        name : "type"
                    });
                    allData.push({
                        internalid : internalid,
                        binNumber : binNumber,
                        locationBin : locationBin,
                        typeBin : typeBin
                    })
                return true;
                });
            }else{
                var binSearchObj = search.create({
                    type: "bin",
                    filters:
                    [
                        ["location","anyof",binLocation]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({
                            name: "binnumber",
                            sort: search.Sort.ASC,
                            label: "Bin Number"
                        }),
                        search.createColumn({name: "location", label: "Location"}),
                        search.createColumn({name: "memo", label: "Memo"}),
                        search.createColumn({name: "sequencenumber", label: "Sequence Number"}),
                        search.createColumn({name: "type", label: "Type"}),
                        search.createColumn({name: "zone", label: "Zone"})
                    ]
                });
                var searchResultCount = binSearchObj.runPaged().count;
                log.debug("binSearchObj result count",searchResultCount);
                binSearchObj.run().each(function(result){
                    var internalid = result.getValue({
                        name : "internalid"
                    })
                    var binNumber = result.getValue({
                        name : "binnumber"
                    });
                    var locationBin = result.getText({
                        name : "location"
                    });
                    var typeBin = result.getValue({
                        name : "type"
                    });
                    allData.push({
                        internalid : internalid,
                        binNumber : binNumber,
                        locationBin : locationBin,
                        typeBin : typeBin
                    })
                return true;
                });
            }
            log.debug('allData', allData);

            var currentRecord = createSublist("custpage_sublist_item", form);
            var i = 0;
            var checkedBins = [];
            if(allData.length > 0){
                allData.forEach((data)=>{
                    var internalid = data.internalid
                    var binNumber = data.binNumber
                    var locationBin = data.locationBin
                    var typeBin = data.typeBin
                    
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_id_bin",
                        value: internalid,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_bin",
                        value: binNumber,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_location",
                        value: locationBin,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_type",
                        value: typeBin,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_integer_input",
                        value: 1,
                        line: i,
                    });
                    var checkboxValue = context.request.parameters['custpage_sublist_check_bin_' + i];
                    checkedBins.push({
                        bin: binNumber,
                        location: locationBin,
                        type: typeBin,
                        isChecked: checkboxValue, 
                    });
                    
                    i++;
                    return true;
                });
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Print Label",
                    functionName: "printPDF()", 
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_print_label_bin.js";
            }
            
            context.response.writePage(form);
  
            var scriptObj = runtime.getCurrentScript();
            log.debug({
            title: "Remaining usage units: ",
            details: scriptObj.getRemainingUsage(),
            });
        }
        
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Bins",
            tab: "matchedtab",
        });
        sublist_in.addField({
            id: "custpage_sublist_check_bin",
            label: "Select",
            type: serverWidget.FieldType.CHECKBOX,
        });
        sublist_in.addField({
            id: "custpage_sublist_id_bin",
            label: "ID BIN",
            type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        sublist_in.addField({
            id: "custpage_sublist_bin",
            label: "BIN",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_location",
            label: "LOCATION",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_type",
            label: "TYPE",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_integer_input",
            label: "No. Of Labels",
            type: serverWidget.FieldType.INTEGER,
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
        });

        return sublist_in;
        
    }
    return {
        onRequest: onRequest,
    };
});