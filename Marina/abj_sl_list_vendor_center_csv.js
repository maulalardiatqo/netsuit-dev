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
    "N/encode","N/url","N/redirect","N/xml","N/file"
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
    file
){
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
        if(context.request.method === 'GET'){

            var form = serverWidget.createForm({
                title: "Vendor Center (Item List)",
            });

                var sublist = form.addSublist({
                    id: "custpage_sublist_item_list",
                    type: serverWidget.SublistType.LIST,
                    label: "Item List",
                });
                sublist.addField({
                    id: "custpage_sublist_item",
                    label: "ITEM",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_upcode",
                    label: "UP CODE",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_bin_number",
                    label: "BIN NUMBER",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_location",
                    label: "LOCATION",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_invnumber",
                    label: "INVENTORY NUMBER",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_status",
                    label: "STATUS",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_onhand",
                    label: "ON HAND",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_available",
                    label: "AVAILABLE",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_itemprtefered",
                    label: "ITEM PREFERED",
                    type: serverWidget.FieldType.TEXT,
                });
            var allData = []
            var searchItem =  search.create({
                type: "inventorybalance",
                filters:
                [
                    ["formulanumeric: CASE WHEN {me} = {item.othervendor.id} THEN 1 ELSE 0 END","equalto","1"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "item",
                        sort: search.Sort.ASC,
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "upccode",
                        join: "item",
                        label: "UPC Code"
                    }),
                    search.createColumn({name: "binnumber", label: "Bin Number"}),
                    search.createColumn({name: "location", label: "Location"}),
                    search.createColumn({name: "inventorynumber", label: "Inventory Number"}),
                    search.createColumn({name: "status", label: "Status"}),
                    search.createColumn({name: "onhand", label: "On Hand"}),
                    search.createColumn({name: "available", label: "Available"}),
                    search.createColumn({
                        name: "othervendor",
                        join: "item",
                        label: "Vendor"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "{userrole}",
                        label: "Formula (Numeric)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{item.othervendor.id}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "{me}",
                        label: "Formula (Numeric)"
                    }),
                    search.createColumn({
                        name: "preferredstocklevel",
                        join: "item",
                        label: "Preferred Stock Level"
                    })
                ]
            });
            // var searchItemList = search.load({
            //     id : 'customsearch198'
            // });
            // log.debug('search', searchItemList);
            // var searchItemListSet = searchItemList.runPaged().count;
            var resultSet = getAllResults(searchItem);
            var i = 0;
            resultSet.forEach(function(row) {
                var item = row.getValue({
                    name : 'item'
                });
                var itemText = row.getText({
                    name : 'item'
                });

                var upcCode = row.getValue({
                    name : 'upccode'
                });
                var binNumber = row.getValue({
                    name : 'binnumber'
                });
                var location = row.getValue({
                    name : 'location'
                });
                var locationText = row.getText({
                    name : 'location'
                });
                var invNumber = row.getValue({
                    name : 'inventorynumber'
                });
                var status = row.getValue({
                    name : 'status'
                });
                var statusText = row.getText({
                    name : 'status'
                });
                var onhand = row.getValue({
                    name : 'onhand'
                });
                var available = row.getValue({
                    name : 'available'
                });
                var vendorid = row.getText({
                    name: "formulatext",
                    formula: "{item.othervendor.id}",
                });
                var me = row.getText({
                    name: "formulanumeric",
                    formula: "{me}",
                });
                var vendor = row.getText({
                    name: "othervendor",
                    join: "item",
                });
                
                var itemPrefered = row.getValue({
                    name: "preferredstocklevel",
                    join: "item",
                });
                // var firstWordOfVendor = vendor.split(' ')[0];
                // vendor = firstWordOfVendor
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_item",
                    value: itemText,
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_upcode",
                    value: upcCode || " ",
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_bin_number",
                    value: binNumber || " " ,
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_location",
                    value: locationText,
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_invnumber",
                    value: invNumber || " ",
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_status",
                    value: statusText || " ",
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_onhand",
                    value: onhand,
                    line: i,
                });
                sublist.setSublistValue({
                    sublistId: "custpage_sublist_item_list",
                    id: "custpage_sublist_available",
                    value: available,
                    line: i,
                });
                if(itemPrefered){
                    sublist.setSublistValue({
                        sublistId: "custpage_sublist_item_list",
                        id: "custpage_sublist_itemprtefered",
                        value: itemPrefered,
                        line: i,
                    })
                }
                ;
                allData.push({
                    item : item,
                    itemText : itemText,
                    upcCode : upcCode,
                    binNumber : binNumber,
                    location : location,
                    locationText : locationText,
                    invNumber : invNumber,
                    status : status,
                    statusText : statusText,
                    onhand : onhand,
                    available : available,
                    vendor : vendor,
                    itemPrefered : itemPrefered
                })
                i++;
                return true;
            });
            var allDataString = JSON.stringify(allData);
            var listData = form.addField({
                id: "custpage_list_data",
                label: "List Data",
                type: serverWidget.FieldType.TEXTAREA,
            });
            listData.defaultValue = allDataString;

            listData.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN, 
            });
            form.addSubmitButton({
                label: "Download Template",
            });

            context.response.writePage(form);
        }else if (context.request.method === 'POST'){
            try{
                var postData = JSON.parse(context.request.parameters.custpage_list_data);
                log.debug('postData', postData);
                var csvStr = "INTERNAL ID,VENDOR,DATE,CURRENCY,LOCATIONS,ITEMS,QTY,RATE,TAXCODE\n";

                postData.forEach((data) => {
                    var vendor = data.vendor;
                    var locationText = data.locationText;
                    var itemText = data.itemText;
                    var itemPrefered = data.itemPrefered;
                    var onhand = data.onhand
                    var qty;
                    log.debug('itemPrefered', itemPrefered)
                    if(itemPrefered){
                        qty = itemPrefered - onhand
                    }
                    log.debug('qty', qty);
                    // Add data to the CSV string
                    csvStr += ',';
                    csvStr += '"' + vendor + '",';
                    csvStr += ',';
                    csvStr += 'IDR,';
                    csvStr += '"' + locationText + '",';
                    csvStr += '"' + itemText + '",';
                    if(qty){
                        csvStr += '"' + qty + '",';
                    }else{
                        csvStr += ',';
                    }
                    csvStr += ',';
                    csvStr += 'PPN_ID:S-ID\n';
                });

                var objCsvFile = file.create({
                    name: "template_list_vendor_center.csv",
                    fileType: file.Type.CSV,
                    contents: csvStr,
                });

                context.response.writeFile({
                    file: objCsvFile,
                });
            }catch(e){
                log.debug('error',e)
            }
            
        }
        

    }

    return {
        onRequest: onRequest,
    };
});