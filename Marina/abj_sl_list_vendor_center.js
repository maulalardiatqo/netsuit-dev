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
                var vendorid = row.getValue({
                    name: "formulatext",
                    formula: "{item.othervendor.id}",
                });
                var me = row.getValue({
                    name: "formulanumeric",
                    formula: "{me}",
                });
                log.debug('item', item);
                
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
                    available : available
                })
                i++;
                return true;
            });
            log.debug('allData', allData);
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

                var xmlStr =
                        '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                    xmlStr +=
                        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                    xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                    xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                    xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                    // Styles
                    xmlStr += "<Styles>";
                    xmlStr += "<Style ss:ID='BC'>";
                    xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#317A8A' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";

                    xmlStr += "<Style ss:ID='Subtotal'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#FFFF00' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='ColAB'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#f79925' ss:Pattern='Solid' />";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNC'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='BNCN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr +=
                        "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NB'>";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "<Style ss:ID='NBN'>";
                    xmlStr += "<NumberFormat ss:Format='Standard' />";
                    xmlStr += "<Alignment />";
                    xmlStr += "<Borders>";
                    xmlStr +=
                        "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr +=
                        "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                    xmlStr += "</Borders>";
                    xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "</Style>";
                    xmlStr += "</Styles>";
                    //   End Styles

                    // Sheet Name
                    xmlStr += '<Worksheet ss:Name="Sheet1">';
                    // End Sheet Name
                    // Kolom Excel Header
                    xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='125' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='120' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='70' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">INTERNAL ID</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">VENDOR</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">DATE</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">CURRENCY</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">LOCATIONS</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">ITEMS</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">QTY</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">RATE</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">TAXCODE</Data></Cell>' +
                    "</Row>";

                postData.forEach((data)=>{
                    var itemText = data.itemText;
                    var upcCode = data.upcCode;
                    log.debug('upcCode', upcCode);
                    var binNumber = data.binNumber;
                    var locationText = data.locationText;
                    var inventorynumber = data.invNumber;
                    var statusText = data.statusText;
                    var onhand = data.onhand;
                    var available = data.available;

                    xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+locationText+'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">'+ itemText +'</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            "</Row>";

                });
                xmlStr += "</Table></Worksheet></Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "template_list_vendor_center.xls",
                    fileType: file.Type.EXCEL,
                    contents: strXmlEncoded,
                });
        
                context.response.writeFile({
                    file: objXlsFile,
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