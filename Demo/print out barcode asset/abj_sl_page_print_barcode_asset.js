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
    
    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Print out barcode Assets",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var typeAsset = form.addField({
                id: "custpage_filter_assettype",
                label: "Assets Type",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "customrecord_ncfar_assettype",
            });

            var statusAssets = form.addField({
                id: "custpage_filter_assetstatus",
                label: "Assets Status",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "customlist_ncfar_assetstatus",
            });
            form.addSubmitButton({
                label: "Search",
            });
            form.addResetButton({
                label: "Clear",
              });
              form.addButton({
                id: 'custpage_button_po',
                label: "Print Barcode",
                functionName: "printPDF()", 
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_print_barcode_assets.js";
            if(context.request.method === 'GET'){
                var allData = []
                var currentRecord = createSublist("custpage_sublist_item", form);
                var checkedBins = [];
                var customrecord_ncfar_assetSearchObj = search.create({
                    type: "customrecord_ncfar_asset",
                    filters:
                    [
                        ["custrecord_assetstatus","noneof","4"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "name", label: "ID"}),
                        search.createColumn({name: "altname", label: "Name"}),
                        search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                        search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                        search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                        search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                        search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                        search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                        search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                        search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"}),
                        search.createColumn({name: "custrecord_assetserialno", label: "Asset Serial Number"}),
                        search.createColumn({name: "custrecord_assetalternateno", label: "Alternate Asset Number"}),
                        search.createColumn({
                            name: "namenohierarchy",
                            join: "CUSTRECORD_ASSETSUBSIDIARY",
                            label: "Name (no hierarchy)"
                         })
                    ]
                });
                var searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
                log.debug("customrecord_ncfar_assetSearchObj result count",searchResultCount);
                customrecord_ncfar_assetSearchObj.run().each(function(result){
                    var idName = result.getValue({
                        name: "name"
                    })
                    var altName = result.getValue({
                        name: "altname"
                    })
                    var desc = result.getValue({
                        name: "custrecord_assetdescr"
                    })
                    var typeAsset = result.getText({
                        name: "custrecord_assettype"
                    })
                    var assetCost = result.getValue({
                        name: "custrecord_assetcost"
                    })
                    var assetCurrCost = result.getValue({
                        name: "custrecord_assetcurrentcost"
                    })
                    var depreMethod = result.getText({
                        name: "custrecord_assetaccmethod"
                    });
                    var assetLeftTime = result.getValue({
                        name: "custrecord_assetlifetime"
                    })
                    var assetStatus = result.getText({
                        name: "custrecord_assetstatus"
                    })
                    var qty = result.getValue({
                        name: "custrecord_ncfar_quantity"
                    });
                    var serialNumber = result.getValue({
                        name: "custrecord_assetserialno"
                    })
                    var alterNateAssetNumber = result.getValue({
                        name: "custrecord_assetalternateno"
                    })
                    var subsidiary = result.getValue({
                        name: "namenohierarchy",
                        join: "CUSTRECORD_ASSETSUBSIDIARY"
                    })

                    allData.push({
                        idName: idName,
                        altName : altName,
                        desc : desc,
                        typeAsset : typeAsset,
                        assetCost : assetCost,
                        assetCurrCost : assetCurrCost,
                        depreMethod : depreMethod,
                        assetLeftTime : assetLeftTime,
                        assetStatus : assetStatus,
                        qty : qty,
                        serialNumber : serialNumber,
                        alterNateAssetNumber : alterNateAssetNumber,
                        subsidiary : subsidiary
                    })
                    return true;
                });
                if(allData.length > 0){
                    var i = 0;
                    allData.forEach((data)=>{
                        var idName = data.idName
                        var altName = data.altName
                        var desc = data.desc
                        var typeAsset = data.typeAsset
                        var assetCost = data.assetCost
                        var assetCurrCost = data.assetCurrCost
                        var depreMethod = data.depreMethod
                        var assetLeftTime = data.assetLeftTime
                        var assetStatus = data.assetStatus
                        var qty = data.qty
                        var serialNumber = data.serialNumber
                        var alterNateAssetNumber = data.alterNateAssetNumber
                        var subsidiary = data.subsidiary

                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_id",
                            value: idName,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_name",
                            value: altName || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_desc",
                            value: desc || "",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_type",
                            value: typeAsset || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_orcost",
                            value: assetCost || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_currcost",
                            value: assetCurrCost || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_dep_method",
                            value: depreMethod || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_lifetime",
                            value: assetLeftTime || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_status",
                            value: assetStatus || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_qty",
                            value: qty,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_serial_number",
                            value: serialNumber || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_alt_ass_number",
                            value: alterNateAssetNumber || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_subsidiary",
                            value: subsidiary || "-",
                            line: i,
                        });
                        var checkboxValue = context.request.parameters['custpage_sublist_check_bin_' + i];
                        checkedBins.push({
                            checkboxValue : checkboxValue,
                            alterNateAssetNumber : alterNateAssetNumber
                        })
                        i++;
                        return true;
                    });
                   
                    
                }
                
                context.response.writePage(form);
            }else{
                var type = context.request.parameters.custpage_filter_assettype;
                var status = context.request.parameters.custpage_filter_assetstatus;
                log.debug('type', type);
                log.debug('status', status);
                var allData = [];
                var customrecord_ncfar_assetSearchObj
                if (type && !status) {
                    log.debug('mausuk type')
                    customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_assettype","anyof",type],
                            "AND",
                            ["custrecord_assetstatus","noneof","4"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "name", label: "ID"}),
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                            search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                            search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                            search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                            search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                            search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                            search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                            search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"}),
                            search.createColumn({name: "custrecord_assetserialno", label: "Asset Serial Number"}),
                            search.createColumn({name: "custrecord_assetalternateno", label: "Alternate Asset Number"}),
                            search.createColumn({
                                name: "namenohierarchy",
                                join: "CUSTRECORD_ASSETSUBSIDIARY",
                                label: "Name (no hierarchy)"
                             })
                        ]
                    });
                }
                else if (!type && status){
                    log.debug('mausuk status')
                    customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_assetstatus","anyof",status],
                            "AND",
                            ["custrecord_assetstatus","noneof","4"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "name", label: "ID"}),
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                            search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                            search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                            search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                            search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                            search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                            search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                            search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"}),
                            search.createColumn({name: "custrecord_assetserialno", label: "Asset Serial Number"}),
                            search.createColumn({name: "custrecord_assetalternateno", label: "Alternate Asset Number"}),
                            search.createColumn({
                                name: "namenohierarchy",
                                join: "CUSTRECORD_ASSETSUBSIDIARY",
                                label: "Name (no hierarchy)"
                             })
                        ]
                    });
                }else if (type && status){
                    log.debug('mausuk dua')
                    customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_assettype","anyof",type], 
                            "AND", 
                            ["custrecord_assetstatus","anyof",status],
                            "AND",
                            ["custrecord_assetstatus","noneof","4"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "name", label: "ID"}),
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                            search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                            search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                            search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                            search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                            search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                            search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                            search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"}),
                            search.createColumn({name: "custrecord_assetserialno", label: "Asset Serial Number"}),
                            search.createColumn({name: "custrecord_assetalternateno", label: "Alternate Asset Number"}),
                            search.createColumn({
                                name: "namenohierarchy",
                                join: "CUSTRECORD_ASSETSUBSIDIARY",
                                label: "Name (no hierarchy)"
                             })
                        ]
                    });
                }else{
                    log.debug('mausuk else')
                    customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_assetstatus","noneof","4"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "name", label: "ID"}),
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                            search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                            search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                            search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                            search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                            search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                            search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                            search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"}),
                            search.createColumn({name: "custrecord_assetserialno", label: "Asset Serial Number"}),
                            search.createColumn({name: "custrecord_assetalternateno", label: "Alternate Asset Number"}),
                            search.createColumn({
                                name: "namenohierarchy",
                                join: "CUSTRECORD_ASSETSUBSIDIARY",
                                label: "Name (no hierarchy)"
                             })
                        ]
                    });
                }
                var searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
                log.debug("customrecord_ncfar_assetSearchObj result count",searchResultCount);
                customrecord_ncfar_assetSearchObj.run().each(function(result){
                    var idName = result.getValue({
                        name: "name"
                    })
                    var altName = result.getValue({
                        name: "altname"
                    })
                    var desc = result.getValue({
                        name: "custrecord_assetdescr"
                    })
                    var typeAsset = result.getText({
                        name: "custrecord_assettype"
                    })
                    var assetCost = result.getValue({
                        name: "custrecord_assetcost"
                    })
                    var assetCurrCost = result.getValue({
                        name: "custrecord_assetcurrentcost"
                    })
                    var depreMethod = result.getText({
                        name: "custrecord_assetaccmethod"
                    });
                    var assetLeftTime = result.getValue({
                        name: "custrecord_assetlifetime"
                    })
                    var assetStatus = result.getText({
                        name: "custrecord_assetstatus"
                    })
                    var qty = result.getValue({
                        name: "custrecord_ncfar_quantity"
                    });
                    var serialNumber = result.getValue({
                        name: "custrecord_assetserialno"
                    })
                    var alterNateAssetNumber = result.getValue({
                        name: "custrecord_assetalternateno"
                    })
                    var subsidiary = result.getValue({
                        name: "namenohierarchy",
                        join: "CUSTRECORD_ASSETSUBSIDIARY"
                    })

                    allData.push({
                        idName: idName,
                        altName : altName,
                        desc : desc,
                        typeAsset : typeAsset,
                        assetCost : assetCost,
                        assetCurrCost : assetCurrCost,
                        depreMethod : depreMethod,
                        assetLeftTime : assetLeftTime,
                        assetStatus : assetStatus,
                        qty : qty,
                        serialNumber : serialNumber,
                        alterNateAssetNumber : alterNateAssetNumber,
                        subsidiary : subsidiary
                    })
                    return true;
                });
                log.debug('allData', allData)
                var currentRecord = createSublist("custpage_sublist_item", form);
                var checkedBins = [];
                var i = 0;
                if(allData.length > 0){
                    allData.forEach((data)=>{
                        var idName = data.idName
                        var altName = data.altName
                        var desc = data.desc
                        var typeAsset = data.typeAsset
                        var assetCost = data.assetCost
                        var assetCurrCost = data.assetCurrCost
                        var depreMethod = data.depreMethod
                        var assetLeftTime = data.assetLeftTime
                        var assetStatus = data.assetStatus
                        var qty = data.qty
                        var serialNumber = data.serialNumber
                        var alterNateAssetNumber = data.alterNateAssetNumber
                        var subsidiary = data.subsidiary

                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_id",
                            value: idName || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_name",
                            value: altName || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_desc",
                            value: desc || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_type",
                            value: typeAsset || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_orcost",
                            value: assetCost || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_currcost",
                            value: assetCurrCost || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_dep_method",
                            value: depreMethod || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_lifetime",
                            value: assetLeftTime || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ass_status",
                            value: assetStatus || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_qty",
                            value: qty || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_serial_number",
                            value: serialNumber || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_alt_ass_number",
                            value: alterNateAssetNumber || "-",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_subsidiary",
                            value: subsidiary || "-",
                            line: i,
                        });
                        var checkboxValue = context.request.parameters['custpage_sublist_check_bin_' + i];
                        checkedBins.push({
                            checkboxValue : checkboxValue,
                            alterNateAssetNumber : alterNateAssetNumber
                        })
                        i++;
                        return true;
                    });
                   
                    
                }
                context.response.writePage(form);
  
                var scriptObj = runtime.getCurrentScript();
                log.debug({
                title: "Remaining usage units: ",
                details: scriptObj.getRemainingUsage(),
                });
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    function createSublist(sublistname, form, dataToSet){
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Assets",
            tab: "matchedtab",
        });
        sublist_in.addMarkAllButtons();
        sublist_in.addField({
            id: "custpage_sublist_check_bin",
            label: "Select",
            type: serverWidget.FieldType.CHECKBOX,
        });
        sublist_in.addField({
            id: "custpage_sublist_id",
            label: "ID",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_name",
            label: "NAME",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_desc",
            label: "ASSET DESCRIPTION",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_type",
            label: "ASSET TYPE",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_orcost",
            label: "Asset Original Cost",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_currcost",
            label: "Asset Current Cost",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_dep_method",
            label: "Depreciation Method",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_lifetime",
            label: "Asset Lifetime",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ass_status",
            label: "Asset Status",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_qty",
            label: "Quantity",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_serial_number",
            label: "Asset Serial Number",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_alt_ass_number",
            label: "Alternate Asset Number",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_subsidiary",
            label: "SUbsidiary",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist_in
    }
    return{
        onRequest : onRequest
    }
});