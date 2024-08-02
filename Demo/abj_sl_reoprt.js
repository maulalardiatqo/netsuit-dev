/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/ui/serverWidget", "N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime"], function (serverWidget, render, search, record, log, file, http, config, format, email, runtime) {
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
    function convertCurr(data){
      data = format.format({
          value: data,
          type: format.Type.CURRENCY
      });
  
      return data
  }
    function getMonthYear(dateStr) {
        let dateParts = dateStr.split('/');
        return `${dateParts[1]}/${dateParts[2]}`;
    }

    function parseActualSales(actualSales) {
        return actualSales ? parseInt(actualSales, 10) : 0;
    }

    function groupAndSumSalesByMonth(inventoryData) {
        let groupedData = {};

        inventoryData.forEach(function(entry) {
            let monthYear = getMonthYear(entry.transDate);
            let key = `${entry.item}-${monthYear}`;

            if (!groupedData[key]) {
                groupedData[key] = {
                    item: entry.item,
                    itemName : entry.itemName,
                    monthYear: monthYear,
                    totalSales: 0
                };
            }

            groupedData[key].totalSales += parseActualSales(entry.actualSales);
        });

        return Object.values(groupedData);
    }
    function numberWithCommas(x) {
        x = x.toString();
        var pattern = /(-?\d+)(\d{3})/;
        while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
        return x;
    }
    function convertNumberToMonth(number) {
        const months = [
            "Jan", "Feb", "Ar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ];
        
        if (number < 1 || number > 12) {
            return "Nomor bulan tidak valid";
        }
        
        return months[number - 1];
    }
    function getStartAndEndDateMonth() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
        return {
          startMtd: startOfMonth,
          endMtd: endOfMonth,
        };
      }
      var { startMtd, endMtd } = getStartAndEndDateMonth();
      
    function parseDateDDMMYYYY(dateString) {
        var parts = dateString.split('/');
        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected DD/MM/YYYY.');
        }
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; 
        var year = parseInt(parts[2], 10);
    
        return new Date(year, month, day);
    }
    function getMonthsBeforeAfter(startDateSelected) {
        var startDate = parseDateDDMMYYYY(startDateSelected);
        
        if (isNaN(startDate.getTime())) {
            log.error('Invalid Date', 'The provided startDateSelected is invalid: ' + startDateSelected);
            return { startDate: null, endDate: null };
        }
    
        var year = startDate.getFullYear();
        var month = startDate.getMonth();
        
    
        var startDateOfYear = new Date(year, month, 0);
    
        var endDate = new Date(year, month + 2, 0);
    
        if (endDate.getFullYear() !== year) {
            endDate = new Date(year, 6, 0); 
        }
    
        return {
            startDate: startDateOfYear,
            endDate: endDate
        };
    }
    function getMonthsBefore(startDateSelected) {
        var startDate = parseDateDDMMYYYY(startDateSelected);
        
        if (isNaN(startDate.getTime())) {
            log.error('Invalid Date', 'The provided startDateSelected is invalid: ' + startDateSelected);
            return { startDate: null, endDate: null };
        }
    
        var year = startDate.getFullYear();
        var month = startDate.getMonth();
    
        var startDateOfYear = new Date(year, 0, 1);
    
        var endDate = new Date(year, month - 1, 0);
    
        if (endDate.getFullYear() !== year) {
            endDate = new Date(year, 6, 0); 
        }
    
        return {
            startDate: startDateOfYear,
            endDate: endDate
        };
    }
    function getMonthFromDate(dateString) {
        const dateParts = dateString.split('/');
        const month = dateParts[1];
        return month;
    }
    function onRequest(context) {
        var contextRequest = context.request;
        var qContent = "";
        var jContent = "";
        var sContent = "";
        var dContent = "";
        var fldTable;
        var FLDGRP_TABLE = "custpage_rp_fldgrp_table";
        var form = serverWidget.createForm({
            title: "CMO",
        });
        form.addFieldGroup({
            id: "filteroption",
            label: "FILTERS",
        });
        form.addFieldGroup({
            id: FLDGRP_TABLE,
            label: "CMO",
        });
        var locationField = form.addField({
            id: "custpage_f_location",
            label: "Location",
            type: serverWidget.FieldType.SELECT,
            source: "location",
            container: "filteroption",
        });
        locationField.isMandatory = true;
    
        var startDate = form.addField({
            id: "custpage_f_start_date",
            label: "DATE FROM",
            type: serverWidget.FieldType.DATE,
            container: "filteroption",
        });
        startDate.isMandatory = true;
        startDate.defaultValue = startMtd;
    
        var endDate = form.addField({
            id: "custpage_f_end_date",
            label: "DATE TO",
            type: serverWidget.FieldType.DATE,
            container: "filteroption",
        });
        endDate.isMandatory = true;
        endDate.defaultValue = endMtd;
    
        form.addButton({
            id: "printExcel",
            label: "Export to Excel",
            functionName: "exportReportReconcile",
        });
    
        form.addSubmitButton({
            label: "Search",
        });
    
        form.addResetButton({
            label: "Clear",
        });
        // form.clientScriptModulePath = "";
        if (contextRequest.method == "GET") {
            context.response.writePage(form);
        } else {
            try{
                var startDateSelected = contextRequest.parameters.custpage_f_start_date;
                var endDateSelected = contextRequest.parameters.custpage_f_end_date;
                var locationSelected = contextRequest.parameters.custpage_f_location;
                locationField.defaultValue = locationSelected
                startDate.defaultValue = startDateSelected;
                endDate.defaultValue = endDateSelected;
                var motnhSelected = getMonthFromDate(startDateSelected)
                var monthSelectedBefore = Number(motnhSelected) - 1
                var monthSelectedAfter = Number(motnhSelected) + 1

                var motnhSelectedConvert = convertNumberToMonth(motnhSelected)
                var monthSelectedBeforeConvert = convertNumberToMonth(monthSelectedBefore)
                var monthSelectedAfterConvert = convertNumberToMonth(monthSelectedAfter)
                
                log.debug('startDateSelected', startDateSelected)
                log.debug('endDateSelected', endDateSelected)
                var dateRange = getMonthsBefore(startDateSelected);
                var dateRangeStart = dateRange.startDate
                var dateRangeEnd = dateRange.endDate
                if(dateRangeStart){
                    dateRangeStart = format.format({
                        value: dateRangeStart,
                        type: format.Type.DATE
                    });
                }
                if(dateRangeEnd){
                    dateRangeEnd = format.format({
                        value: dateRangeEnd,
                        type: format.Type.DATE
                    });
                }
                // get two week
                var dateSelectedStart = format.parse({
                    value: startDateSelected,
                    type: format.Type.DATE
                });
                var dateSelectedEnd = format.parse({
                    value: endDateSelected,
                    type: format.Type.DATE
                });
                function getDateWithOffset(date, offsetDays) {
                    var newDate = new Date(date);
                    newDate.setDate(newDate.getDate() + offsetDays);
                    return format.format({
                        value: newDate,
                        type: format.Type.DATE
                    });
                }
                
                var twoWeeksBeforeStart = getDateWithOffset(dateSelectedStart, -14);
                var twoWeeksAfterEnd = getDateWithOffset(dateSelectedEnd, 14);
                log.debug('twoWeeksBeforeStart', twoWeeksBeforeStart);
                log.debug('twoWeeksAfterEnd', twoWeeksAfterEnd)
                var dateRangeForBeAf = getMonthsBeforeAfter(startDateSelected)
                var dateRangeForBeAfStart = dateRangeForBeAf.startDate
                var dateRangeForBeAfEnd = dateRangeForBeAf.endDate
               
                if(dateRangeForBeAfStart){
                    dateRangeForBeAfStart = format.format({
                        value: dateRangeForBeAfStart,
                        type: format.Type.DATE
                    });
                }
                if(dateRangeForBeAfEnd){
                    dateRangeForBeAfEnd = format.format({
                        value: dateRangeForBeAfEnd,
                        type: format.Type.DATE
                    });
                }
    
                var demandPlanSearch = search.load({
                    id: "customsearch_atlas_item_demand_pln_rpt_2",
                });
                demandPlanSearch.filters.push(
                    search.createFilter({
                        name: "location",
                        operator: search.Operator.IS,
                        values: locationSelected,
                    })
                );
                if (dateRangeForBeAfStart && dateRangeForBeAfEnd) {
                    demandPlanSearch.filters.push(
                        search.createFilter({
                            name: "demanddate",
                            operator: search.Operator.ONORAFTER,
                            values: dateRangeForBeAfStart,
                        })
                    );
                    demandPlanSearch.filters.push(
                        search.createFilter({
                            name: "demanddate",
                            operator: search.Operator.ONORBEFORE,
                            values: dateRangeForBeAfEnd,
                        })
                    );
                }
                var myResultsDemand = getAllResults(demandPlanSearch);
                var demandData = [];
                var allItem = []
                myResultsDemand.forEach(function (result) {
                    let item = result.getValue({
                        name: "item",
                        summary: "GROUP",
                    });
                    let forecast = result.getValue({
                        name: "quantity",
                        summary: "SUM",
                    });
                    let units = result.getText({
                        name: "units",
                        summary: "GROUP",
                    });
                    var demandDate = result.getValue({
                        name: "demanddate",
                        summary: "GROUP",
                    })
                    demandData.push({
                        item: item,
                        forecast : forecast,
                        units : units,
                        demandDate : demandDate
                    })
                    allItem.push(item)
                })
    
                var inventorySearch = search.load({
                    id: "customsearch_atlas_inv_forecast_rpt_3",
                });
                inventorySearch.filters.push(
                    search.createFilter({
                        name: "inventorylocation",
                        operator: search.Operator.IS,
                        values: locationSelected,
                    })
                );
                if (startDateSelected && endDateSelected) {
                    inventorySearch.filters.push(
                        search.createFilter({
                            name: "trandate",
                            join: "transaction",
                            operator: search.Operator.ONORAFTER,
                            values: startDateSelected,
                        })
                    );
                    inventorySearch.filters.push(
                        search.createFilter({
                            name: "trandate",
                            join: "transaction",
                            operator: search.Operator.ONORBEFORE,
                            values: endDateSelected,
                        })
                    );
                }
                var myResultInventory = getAllResults(inventorySearch);
                var inventoryData = [];
                myResultInventory.forEach(function (result) {
                    let item = result.getValue({
                        name: "internalid",
                        summary: "GROUP",
                    });
                    let actualSales = result.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "CASE WHEN {transaction.type} IN ('Invoice','Cash Sales','Credit Memo') THEN {transaction.quantity} END"
                    })
                    let beginningStock = result.getValue({
                        name: "formulanumeric",
                        summary: "MAX",
                        formula: "nvl({locationquantityonhand},0)",
                    });
                    let orderTransit = result.getValue({
                        name: "formulanumeric",
                        summary: "MAX",
                        formula: "nvl({locationquantityintransit},0)"
                    })
                    let orderTambahan = result.getValue({
                        name: "formulanumeric",
                        summary: "MAX",
                        formula: "nvl({locationquantityonorder},0)",
                    });
                    let dateTrans = result.getValue({
                        name: "trandate",
                        join: "transaction",
                        summary: "GROUP",
                    })
                    inventoryData.push({
                        item: item,
                        actualSales : actualSales || 0,
                        beginningStock : beginningStock || 0,
                        orderTransit : orderTransit || 0,
                        orderTambahan : orderTambahan || 0,
                        dateTrans : dateTrans
                    })
                })

                var mergedData = demandData.map(function(demandItem) {
                    var matchedInventoryItem = inventoryData.find(function(inventoryItem) {
                        return inventoryItem.item === demandItem.item;
                    });
                    if (matchedInventoryItem) {
                        return {
                            item: demandItem.item,
                            forecast: demandItem.forecast,
                            units : demandItem.units,
                            demandDate : demandItem.demandDate,
                            actualSales: matchedInventoryItem.actualSales,
                            beginningStock: matchedInventoryItem.beginningStock,
                            orderTransit: matchedInventoryItem.orderTransit,
                            orderTambahan: matchedInventoryItem.orderTambahan,
                            dateTrans: matchedInventoryItem.dateTrans
                        };
                    } else {
                        return {
                            item: demandItem.item,
                            forecast: demandItem.forecast,
                            units : null,
                            demandDate : null,
                            actualSales: 0,
                            beginningStock: 0,
                            orderTransit: 0,
                            orderTambahan: 0,
                            dateTrans: null
                        };
                    }
                });
                var inventorySearch2 = search.load({
                    id: "customsearch_atlas_inv_forecast_rpt_3",
                });
                inventorySearch2.filters.push(
                    search.createFilter({
                        name: "inventorylocation",
                        operator: search.Operator.IS,
                        values: locationSelected,
                    })
                );
                if (dateRangeStart && dateRangeEnd) {
                    inventorySearch2.filters.push(
                        search.createFilter({
                            name: "trandate",
                            join: "transaction",
                            operator: search.Operator.ONORAFTER,
                            values: dateRangeStart,
                        })
                    );
                    inventorySearch2.filters.push(
                        search.createFilter({
                            name: "trandate",
                            join: "transaction",
                            operator: search.Operator.ONORBEFORE,
                            values: dateRangeEnd,
                        })
                    );
                }
                log.debug('allItem', allItem)
                if (allItem && allItem.length > 0) {
                    inventorySearch2.filters.push(
                        search.createFilter({
                            name: "internalid",
                            operator: search.Operator.ANYOF,
                            values: allItem,
                        })
                    );
                }
                
                var myResultInventory2 = getAllResults(inventorySearch2);
                var inventoryData2 = [];
                myResultInventory2.forEach(function (result) {
                    let item = result.getValue({
                        name: "internalid",
                        summary: "GROUP",
                    });
                    let itemName = result.getValue({
                        name: "itemid",
                        summary: "GROUP",
                    })
                    var actualSales = result.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "CASE WHEN {transaction.type} IN ('Invoice','Cash Sales','Credit Memo') THEN {transaction.quantity} END"
                    })
                    var transDate = result.getValue({
                        name: "trandate",
                        join: "transaction",
                        summary: "GROUP",
                    })
                    inventoryData2.push({
                        item: item,
                        itemName : itemName,
                        actualSales : actualSales,
                        transDate : transDate
                    })
                })

                var inventoryTwoWeek = search.load({
                    id: "customsearch_atlas_inv_forecast_rpt_3",
                });
                inventoryTwoWeek.filters.push(
                    search.createFilter({
                        name: "inventorylocation",
                        operator: search.Operator.IS,
                        values: locationSelected,
                    })
                );
                if (twoWeeksBeforeStart) {
                    inventoryTwoWeek.filters.push(
                        search.createFilter({
                            name: "trandate",
                            join: "transaction",
                            operator: search.Operator.ON,
                            values: twoWeeksBeforeStart,
                        })
                    );
                    
                }
                if (allItem && allItem.length > 0) {
                    inventoryTwoWeek.filters.push(
                        search.createFilter({
                            name: "internalid",
                            operator: search.Operator.ANYOF,
                            values: allItem,
                        })
                    );
                }
                var myResultTwoWeek = getAllResults(inventoryTwoWeek);
                var inventoryDataTwoWeek = [];
                myResultTwoWeek.forEach(function (result) {
                    let item = result.getValue({
                        name: "internalid",
                        summary: "GROUP",
                    });
                    let itemName = result.getValue({
                        name: "itemid",
                        summary: "GROUP",
                    })
                    var actualSales = result.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "CASE WHEN {transaction.type} IN ('Invoice','Cash Sales','Credit Memo') THEN {transaction.quantity} END"
                    })
                    var transDate = result.getValue({
                        name: "trandate",
                        join: "transaction",
                        summary: "GROUP",
                    })
                    inventoryDataTwoWeek.push({
                        item: item,
                        itemName : itemName,
                        actualSalesTwoWeekBefore : actualSales,
                        transDateTwoWeekBefore : transDate
                    })
                })
                log.debug('inventoryDataTwoWeek', inventoryDataTwoWeek)
                function groupInventoryData(data) {
                    var grouped = {};
                    data.forEach(function (entry) {
                        var key = entry.item + '-' + entry.transDateTwoWeekBefore;
                        if (!grouped[key]) {
                            grouped[key] = {
                                item: entry.item,
                                itemName: entry.itemName,
                                transDateTwoWeekBefore: entry.transDateTwoWeekBefore,
                                actualSalesTwoWeekBefore: 0
                            };
                        }
                        grouped[key].actualSalesTwoWeekBefore += Number(entry.actualSalesTwoWeekBefore);
                    });
                    return Object.values(grouped);
                }
                
                var groupedInventoryData = groupInventoryData(inventoryDataTwoWeek);
                
                var groupedData = groupAndSumSalesByMonth(inventoryData2);

                function getUniqueMonths(data) {
                    var months = [];
                    data.forEach(function(entry) {
                        if (!months.includes(entry.monthYear)) {
                            months.push(entry.monthYear);
                        }
                    });
                    return months.sort();
                }
                
                function groupDataByItem(data) {
                    var grouped = {};
                    data.forEach(function(entry) {
                        if (!grouped[entry.item]) {
                            grouped[entry.item] = {
                                itemName: entry.itemName,
                                salesData: {},
                                totalSales: 0
                            };
                        }
                        grouped[entry.item].salesData[entry.monthYear] = entry.totalSales;
                        grouped[entry.item].totalSales += entry.totalSales;
                    });
                    return grouped;
                }
                
                function convertMonthYear(monthYear) {
                    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var parts = monthYear.split('/');
                    var month = months[parseInt(parts[0]) - 1];
                    var year = parts[1].slice(2); 
                    return month + ' ' + year;
                }
                
                var months = getUniqueMonths(groupedData);
                var dataByItem = groupDataByItem(groupedData);
                var combinedData = {};
                
                function getMonthFromDemandDate(demandDate) {
                    var parts = demandDate.split('/');
                    return parts[1]; 
                }

                var monthSelected = getMonthFromDate(startDateSelected);
                var monthSelectedBefore = Number(monthSelected) - 1;
                var monthSelectedAfter = Number(monthSelected) + 1;

                var monthSelectedConvert = convertNumberToMonth(monthSelected);
                var monthSelectedBeforeConvert = convertNumberToMonth(monthSelectedBefore);
                var monthSelectedAfterConvert = convertNumberToMonth(monthSelectedAfter);

                mergedData.forEach(function(entry) {
                    var itemId = entry.item;
                    if (itemId && dataByItem[itemId]) {
                        combinedData[itemId] = {
                            units: entry.units || "",
                            demandDate: entry.demandDate || "",
                            forecast: entry.forecast || 0,
                            actualSales: entry.actualSales || 0,
                            beginningStock: entry.beginningStock || 0,
                            orderTransit: entry.orderTransit || 0,
                            orderTambahan: entry.orderTambahan || 0,
                            itemName: dataByItem[itemId] ? dataByItem[itemId].itemName : 'Unknown',
                            salesData: dataByItem[itemId] ? dataByItem[itemId].salesData : {},
                            totalSales: dataByItem[itemId] ? dataByItem[itemId].totalSales : 0
                        };
                    }
                });
                
                groupedInventoryData.forEach(function (entry) {
                    var itemId = entry.item;
                    if (!combinedData[itemId]) {
                        combinedData[itemId] = {
                            units: "",
                            demandDate: entry.transDateTwoWeekBefore,
                            forecast: 0,
                            actualSales: 0,
                            beginningStock: 0,
                            orderTransit: 0,
                            orderTambahan: 0,
                            itemName: entry.itemName,
                            salesData: {},
                            totalSales: 0
                        };
                    }
                    combinedData[itemId].actualSalesTwoWeekBefore = entry.actualSalesTwoWeekBefore;
                    combinedData[itemId].transDateTwoWeekBefore = entry.transDateTwoWeekBefore;
                });
                log.debug('combinedata', combinedData)
                fldTable = form.addField({
                    id: "custpage_htmlfield",
                    type: serverWidget.FieldType.INLINEHTML,
                    label: "HTML Image",
                    container: FLDGRP_TABLE,
                });

                var sContent = "";
                sContent += "    <table>";
                sContent += '        <tr class="uir-list-headerrow">';
                sContent += '            <th class="uir-list-header-td" style="text-align: center; width:30px; font-weight: bold; background: #09AA4C !important;">Product</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #09AA4C !important;">Kemasan</th>';

                months.forEach(function(month) {
                    sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #09F17D !important;">' + convertMonthYear(month) + '</th>';
                });

                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #09F17D !important;">Average</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">FC ' + monthSelectedBeforeConvert + '</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Beginning Stock</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Order Transit</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Order Tambahan</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Actual Sales 2 Minggu</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Estimasi Sales s/d akhir bulan</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #E5FC17 !important;">Est. Ending Stock</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #FC9917 !important;">FC ' + monthSelectedConvert + '</th>';
                sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #FC9917 !important;">Estimasi Sales Bln Dpn</th>';
                sContent += "        </tr>";

                var totalSalesPerMonth = {};
                var totalAverageSales = 0;
                var totalForecast = 0;
                var totalActualSales = 0;
                var totalBeginningStock = 0;
                var totalOrderTransit = 0;
                var totalOrderTambahan = 0;
                var totalActualSalesTwoWeekBefore = 0;
                var totalActualSalesTwoWeekAfter = 0
                var totalEndingStock = 0
                var totalFcMonthAfter = 0

                Object.keys(combinedData).forEach(function(item) {
                    var itemData = combinedData[item];
                    var salesData = itemData.salesData;
                    var totalSales = itemData.totalSales;
                    var averageSales = totalSales / months.length;

                    var fcMonthBefore = 0;
                    if (getMonthFromDemandDate(itemData.demandDate) == monthSelectedBefore) {
                        fcMonthBefore = itemData.forecast;
                    }
                    var fcMonthAfter = 0;
                    if (getMonthFromDemandDate(itemData.demandDate) == monthSelectedAfter) {
                        fcMonthAfter = itemData.forecast;
                    }
                    var actualSalesEndOfMonth = 0;
                    if (itemData.demandDate === twoWeeksAfterEnd) {
                        actualSalesEndOfMonth = itemData.actualSales;
                    }

                    sContent += "        <tr>";
                    sContent += '            <td class="uir-list-row-cell" style="text-align: left;">' + itemData.itemName + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: center;">' + itemData.units + '</td>';
                    var totalSalesCount = 0
                    months.forEach(function(month) {
                        var sales = salesData[month] || 0;
                        sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + sales + '</td>';
                        totalSalesCount += Number(sales || 0)
                        totalSalesPerMonth[month] = (totalSalesPerMonth[month] || 0) + sales;
                    });

                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + averageSales.toFixed(2) + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + fcMonthBefore + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + itemData.beginningStock + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + itemData.orderTransit + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + itemData.orderTambahan + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + (itemData.actualSalesTwoWeekBefore || 0) + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + actualSalesEndOfMonth || 0 + '</td>';
                    var endingStock = Number(itemData.beginningStock) + Number(itemData.orderTransit) + Number(itemData.orderTambahan) - (Number(itemData.actualSalesTwoWeekBefore || 0) - Number(actualSalesEndOfMonth || 0));
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + endingStock + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + itemData.actualSales + '</td>';
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + fcMonthAfter + '</td>';
                    sContent += "        </tr>";
                    totalEndingStock += Number(endingStock)
                    totalAverageSales += Number(averageSales);
                    totalForecast += Number(fcMonthBefore);
                    totalActualSales += Number(itemData.actualSales);
                    totalBeginningStock += Number(itemData.beginningStock);
                    totalOrderTransit += Number(itemData.orderTransit);
                    totalOrderTambahan += Number(itemData.orderTambahan);
                    totalActualSalesTwoWeekBefore += Number((itemData.actualSalesTwoWeekBefore) || 0);
                    totalActualSalesTwoWeekAfter += Number(actualSalesEndOfMonth || 0)
                    totalFcMonthAfter += Number(fcMonthAfter)
                });

                sContent += '        <tr class="uir-list-headerrow">';
                sContent += '            <td class="uir-list-row-cell" style="text-align: left; font-weight: bold; background: #B6B6B6"></td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: center; background: #B6B6B6"></td>';

                months.forEach(function(month) {
                    sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + (totalSalesPerMonth[month] || 0) + '</td>';
                });
                
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalAverageSales.toFixed(2) + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalForecast + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalBeginningStock + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalOrderTransit + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalOrderTambahan + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalActualSalesTwoWeekBefore + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalActualSalesTwoWeekAfter + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalEndingStock + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalActualSales + '</td>';
                sContent += '            <td class="uir-list-row-cell" style="text-align: right; font-weight: bold; background: #B6B6B6">' + totalFcMonthAfter + '</td>';
                sContent += "        </tr>";
                
                sContent += "    </table>";
                
                fldTable.defaultValue = sContent;
                context.response.writePage(form);
            }catch(e){
                log.debug('error', e)
            }
           

        }
    }
    return {
      onRequest: onRequest,
    };
  });
  