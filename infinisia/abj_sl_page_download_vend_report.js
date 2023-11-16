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
                            ["vendor.internalid","anyof",vendId]
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
                    i ++
                })
                form.addSubmitButton({
                    label: 'Download'
                });
                context.response.writePage(form);
            }else{
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
                log.debug("vendorSearchObj result count",searchResultCount);
                var budgetVanedor = 0;
                vendorSearchObj.run().each(function(result){
                    var vendExtId = result.getValue({
                        name : "entityid"
                    });
                    var vendId = result.getValue({
                        name : "internalid"
                    });
                    var vendName = result.getValue({
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
                log.debug('allDataVendor', allDataVendor);
                if(allDataVendor.length>0){
                    log.debug('length', allDataVendor.length);
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
                        "<Font ss:Bold='1' ss:Color='#0A0A0A' ss:FontName='Calibri' ss:Size='12' />";
                    xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
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
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='50' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='80' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='150' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='80' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">No.</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">External ID</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Vendor Name</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Budget</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Achive (Bill)/Open</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">Achive (Bill Payment)/Paid In Full</Data></Cell>' +
                    '<Cell ss:StyleID="BC"><Data ss:Type="String">%</Data></Cell>' +
                    "</Row>";
                    var No = 1;
                    allDataVendor.forEach((data)=>{
                        var vendId = data.vendId;
                        var vendName = data.vendName;
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
                                ["vendor.internalid","anyof",vendId]
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
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + No + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + vendExtId + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + vendName + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + budgetVanedor + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalAmountOpen + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + prosentaseBudgetOpen + '%</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalAmountPaid + '</Data></Cell>' +
                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + prosentaseBudgetPaid + '%</Data></Cell>' +
                        "</Row>";
                        No ++
                    })
                    xmlStr += "</Table></Worksheet></Workbook>";
                    var strXmlEncoded = encode.convert({
                        string: xmlStr,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64,
                    });
                    var objXlsFile = file.create({
                        name: "BudgetVendorReport.xls",
                        fileType: file.Type.EXCEL,
                        contents: strXmlEncoded,
                    });
            
                    context.response.writeFile({
                        file: objXlsFile,
                    });
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