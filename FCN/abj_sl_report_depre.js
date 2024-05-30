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
    "N/xml","N/file","N/encode","N/ui/message"
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,xml,file, encode, message
) {
    
    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "FAM Asset Listing",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            
            var from = form.addField({
                id: "custpage_from_option",
                label: "FROM",
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
            });
            from.isMandatory = true
            var to = form.addField({
                id: "custpage_to_option",
                label: "TO",
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
            });
            to.isMandatory = true
            var subsFilter = form.addField({
                id: "custpage_subs_option",
                label: "Subsidiary",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "subsidiary",
            });
            subsFilter.isMandatory = true
            var periodFilter = form.addField({
                id: "custpage_assets_option",
                label: "Asset Type",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "customrecord_ncfar_assettype",
            });
            form.addSubmitButton({
                label: "Download",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                function convertCurr(data){
                    data = format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });

                    return data
                }
                var subsidiary = context.request.parameters.custpage_subs_option;
                var assets = context.request.parameters.custpage_assets_option;
                if(assets == ""){
                    assets = "@ALL@"
                }
                var from = context.request.parameters.custpage_from_option;
                var to = context.request.parameters.custpage_to_option;
                log.debug('filters',{from:from, to:to, subsidiary : subsidiary, assets : assets})
                var customrecord_ncfar_deprhistorySearchObj = search.create({
                    type: "customrecord_ncfar_deprhistory",
                    filters:
                    [
                        ["custrecord_deprhistsubsidiary","anyof",subsidiary], 
                        "AND", 
                        ["custrecord_deprhistassettype","anyof",assets],
                        "AND", 
                        ["custrecord_deprhistdate","within",from,to]
                    ],
                    columns:
                    [
                        search.createColumn({name: "custrecord_deprhistassettype", label: "Asset Type"}),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Name"
                        }),
                        search.createColumn({name: "custrecord_deprhistsubsidiary", label: "Subsidiary"}),
                        search.createColumn({
                            name: "custrecord_assetpurchasedate",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Purchase Date"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'dd')",
                            label: "Date"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'mm')",
                            label: "Month"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'yyyy')",
                            label: "Year"
                        }),
                        search.createColumn({
                            name: "custrecord_assetcost",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Asset Original Cost"
                        }),
                        search.createColumn({
                            name: "custrecord_assetlastdepramt",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Last Depreciation Amount"
                        }),
                        search.createColumn({
                            name: "custrecord_assetaccmethod",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Depreciation Method"
                        }),
                        search.createColumn({
                            name: "custrecord_assetdeprstartdate",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Depreciation Start Date"
                        }),
                        search.createColumn({
                            name: "custrecord_assetdeprenddate",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Depreciation End Date"
                        }),
                        search.createColumn({
                            name: "custrecord_assetbookvalue",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Current Net Book Value"
                        }),
                        search.createColumn({
                            name: "custrecord_assetdeprtodate",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Cumulative Depreciation"
                        }),
                        search.createColumn({name: "custrecord_deprhistbookvalue", label: "Net Book Value based per depreciation date filter"}),
                        search.createColumn({
                            name: "custrecord_assetlifetime",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Asset Lifetime"
                        }),
                        search.createColumn({
                            name: "custrecord_assetcurrentage",
                            join: "CUSTRECORD_DEPRHISTASSET",
                            label: "Last Depreciation Period"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "{custrecord_deprhistasset.custrecord_assetlifetime}-{custrecord_deprhistasset.custrecord_assetcurrentage}",
                            label: "Umur Ekonomis"
                        }),
                        search.createColumn({name: "custrecord_deprhistamount", label: "Transaction Amount"})
                    ]
                });
                var searchResultCount = customrecord_ncfar_deprhistorySearchObj.runPaged().count;
                log.debug('searchResultCount', searchResultCount)
                var allData = [];
                var groupedData = {}
                var printSubsidiary
                var printAssets
                customrecord_ncfar_deprhistorySearchObj.run().each(function(result){
                    var assetType = result.getText({
                        name: "custrecord_deprhistassettype",
                    })
                    if(assets == "@ALL@"){
                        printAssets = "All Assets"
                    }else{
                        printAssets = assetType
                    }
                    var internalId = result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    })
                    var id = result.getValue({
                        name: "name",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    })
                    var name = result.getValue({
                        name: "altname",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var subsidiarie = result.getText({
                        name: "custrecord_deprhistsubsidiary"
                    });
                    printSubsidiary = subsidiarie
                    var purchaseDate = result.getValue({
                        name: "custrecord_assetpurchasedate",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    
                    var dateParts = purchaseDate.split('/');

                    var date = dateParts[0]; 
                    var month = dateParts[1]; 
                    // var date = result.getValue({
                    //     name: "formulanumeric",
                    //     formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'dd')",
                    // });
                    // var month = result.getValue({
                    //     name: "formulanumeric",
                    //     formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'mm')",
                    // });
                    var year = result.getValue({
                        name: "formulatext",
                        formula: "TO_CHAR({custrecord_deprhistasset.custrecord_assetpurchasedate},'yyyy')",
                    });
                    var assetOriginalCost = result.getValue({
                        name: "custrecord_assetcost",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var lastDepreAmount = result.getValue({
                        name: "custrecord_assetlastdepramt",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var depreMethod = result.getText({
                        name: "custrecord_assetaccmethod",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var depreStartDate = result.getValue({
                        name: "custrecord_assetdeprstartdate",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var depreEndDate = result.getValue({
                        name: "custrecord_assetdeprenddate",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var currentNetBook = result.getValue({
                        name: "custrecord_assetbookvalue",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var comulativeDepre = result.getValue({
                        name: "custrecord_assetdeprtodate",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var assetsLifeTime = result.getValue({
                        name: "custrecord_assetlifetime",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var netbookValue = result.getValue({
                        name : "custrecord_deprhistbookvalue"
                    });
                    var lastDeprePeriod = result.getValue({
                        name: "custrecord_assetcurrentage",
                        join: "CUSTRECORD_DEPRHISTASSET",
                    });
                    var umurDepre = result.getValue({
                        name: "formulanumeric",
                        formula: "{custrecord_deprhistasset.custrecord_assetlifetime}-{custrecord_deprhistasset.custrecord_assetcurrentage}",
                    });
                    var depreAmount = parseFloat(result.getValue({
                        name : "custrecord_deprhistamount"
                    })) || 0
                    log.debug("Processing depreAmount for internalId: " + internalId, depreAmount);

                    if (groupedData[internalId]) {
                        groupedData[internalId].depreAmount += depreAmount;
                        groupedData[internalId].assetType = assetType;
                        groupedData[internalId].id = id;
                        groupedData[internalId].name = name;
                        groupedData[internalId].subsidiarie = subsidiarie;
                        groupedData[internalId].purchaseDate = purchaseDate;
                        groupedData[internalId].date = date;
                        groupedData[internalId].month = month;
                        groupedData[internalId].year = year;
                        groupedData[internalId].assetOriginalCost = assetOriginalCost;
                        groupedData[internalId].lastDepreAmount = lastDepreAmount;
                        groupedData[internalId].depreMethod = depreMethod;
                        groupedData[internalId].depreStartDate = depreStartDate;
                        groupedData[internalId].depreEndDate = depreEndDate;
                        groupedData[internalId].currentNetBook = currentNetBook;
                        groupedData[internalId].comulativeDepre = comulativeDepre;
                        groupedData[internalId].netbookValue = netbookValue;
                        groupedData[internalId].assetsLifeTime = assetsLifeTime;
                        groupedData[internalId].lastDeprePeriod = lastDeprePeriod;
                        groupedData[internalId].umurDepre = umurDepre;
                        log.debug("Updated data for internalId: " + internalId, groupedData[internalId]);
                    } else {
                        groupedData[internalId] = {
                            assetType: assetType,
                            internalId: internalId,
                            id: id,
                            name: name,
                            subsidiarie: subsidiarie,
                            purchaseDate: purchaseDate,
                            date: date,
                            month: month,
                            year: year,
                            assetOriginalCost: assetOriginalCost,
                            lastDepreAmount: lastDepreAmount,
                            depreMethod: depreMethod,
                            depreStartDate: depreStartDate,
                            depreEndDate: depreEndDate,
                            currentNetBook: currentNetBook,
                            comulativeDepre: comulativeDepre,
                            netbookValue: netbookValue,
                            assetsLifeTime: assetsLifeTime,
                            lastDeprePeriod: lastDeprePeriod,
                            umurDepre: umurDepre,
                            depreAmount: depreAmount
                        };
                        log.debug("Created new entry for internalId: " + internalId, groupedData[internalId]);
                    }
                    return true;
                    
                });
                for (var key in groupedData) {
                    if (groupedData.hasOwnProperty(key)) {
                        allData.push(groupedData[key]);
                    }
                }
                
                log.debug("allData length", allData.length);
                log.debug('alldata', allData)
                if(allData.length > 0){
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
                            "<Font ss:Color='#0E0D0D' ss:FontName='Calibri' ss:Size='12' />";
                        xmlStr += "<Interior ss:Color='#A9AAAA' ss:Pattern='Solid' />";
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
                        xmlStr += "<Style ss:ID='headerStyle1'>";
                        xmlStr += "<Alignment />";
                        xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                        xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                        xmlStr += "<NumberFormat ss:Format='Standard' />";
                        xmlStr += "</Style>";
                        xmlStr += "</Styles>";
                        //   End Styles

                        // Sheet Name
                        xmlStr += '<Worksheet ss:Name="Sheet1">';
                        // End Sheet Name
                        // Kolom Excel Header
                        xmlStr +=
                        "<Table>" +
                        "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='130' />" +
                        "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='100' />" +
                        "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                        "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='450' />" +
                        "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='150' />" +
                        "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='70' />" +
                        "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='70' />" +
                        "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='70' />" +
                        "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='17' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='250' />" +
                        "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='250' />" +

                        "<Row ss:Index='1' ss:Height='20'>" +
                        '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String">Fixed Asset Type</Data></Cell>' +
                        '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String">'+printAssets+'</Data></Cell>' +
                        "</Row>";
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String">Subsidiary</Data></Cell>' +
                        '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String">'+printSubsidiary+'</Data></Cell>' +
                        "</Row>";
                        xmlStr +=
                        "<Row>" +
                        '<Cell ss:StyleID="headerStyle1" ss:MergeAcross="2"><Data ss:Type="String">'+from+' sd '+to+'</Data></Cell>' +
                        "</Row>";
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Asset Type</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Internal ID</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">ID</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Name</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Subsidiary</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Purchase Date</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Date</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Month</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Year</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Asset Original Cost</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Last Depreciation Amount</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Depreciation Method</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Depreciation Start Date</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Depreciation End Date</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Current Net Book Value</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Cumulative Depreciation</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Net Book Value based per depreciation date filter</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Asset Lifetime</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Last Depreciation Period</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Umur Ekonomis</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Cummulative depreciation per date</Data></Cell>' +
                            "</Row>";
                        allData.forEach((data)=>{
                            var assetType= data.assetType;
                            var internalId= data.internalId;
                            var id= data.id;
                            var name= data.name;
                            var subsidiarie= data.subsidiarie;
                            var purchaseDate = data.purchaseDate;
                            var date= data.date;
                            var month= data.month;
                            var year= data.year;
                            var assetOriginalCost= data.assetOriginalCost;
                            var lastDepreAmount= data.lastDepreAmount;
                            var depreMethod= data.depreMethod;
                            var depreStartDate= data.depreStartDate;
                            var depreEndDate= data.depreEndDate;
                            var currentNetBook= data.currentNetBook;
                            var comulativeDepre= data.comulativeDepre;
                            var netbookValue = data.netbookValue
                            var assetsLifeTime= data.assetsLifeTime;
                            var lastDeprePeriod= data.lastDeprePeriod;
                            var umurDepre= data.umurDepre;
                            var depreAmount= data.depreAmount;

                            xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + assetType + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + internalId + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + id + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + name + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + subsidiarie + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + purchaseDate + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + date + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + month + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + year + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(assetOriginalCost) + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(lastDepreAmount) + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + depreMethod + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + depreStartDate + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + depreEndDate + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(currentNetBook) + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(comulativeDepre) + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(netbookValue) + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + assetsLifeTime + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + lastDeprePeriod + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + umurDepre + '</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + convertCurr(depreAmount) + '</Data></Cell>' +
                            "</Row>";
                        });
                        xmlStr += "</Table></Worksheet></Workbook>";
                        var strXmlEncoded = encode.convert({
                            string: xmlStr,
                            inputEncoding: encode.Encoding.UTF_8,
                            outputEncoding: encode.Encoding.BASE_64,
                        });
                
                        var objXlsFile = file.create({
                            name: "FAM Asset Listing.xls",
                            fileType: file.Type.EXCEL,
                            contents: strXmlEncoded,
                        });
                
                        context.response.writeFile({
                            file: objXlsFile,
                        });
                }else{
                    var html = `<html>
                    <h3>No Data for this selection!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;
                    var form_result = serverWidget.createForm({
                        title: "Result Download Cash Flow",
                    });
                    form_result.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "No Data!",
                        message: html,
                    });
                    context.response.writePage(form_result);
                }

            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        onRequest : onRequest
    }
});