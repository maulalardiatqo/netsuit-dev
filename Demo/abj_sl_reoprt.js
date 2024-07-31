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
    function numberWithCommas(x) {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
      return x;
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
      
      function getMonthsBefore(startDateSelected) {
        var startDate = new Date(startDateSelected);
        
        var year = startDate.getFullYear();
        var month = startDate.getMonth(); 
    
        var startDateOfYear = new Date(year, 0, 1);
    
        var endDate = new Date(year, month, 0); 
        if (endDate.getFullYear() !== year) {
            endDate = new Date(year, 6, 0); 
        }
    
        return {
            startDate: startDateOfYear,
            endDate: endDate
        };
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
    
                log.debug('startDateSelected', startDateSelected)
                var dateRange = getMonthsBefore(startDateSelected);
                function formatDate(dateString, format) {
                    var date = new Date(dateString);
                    var year = date.getFullYear();
                    var month = (date.getMonth() + 1).toString();
                    var day = date.getDate().toString();
                
                    if (format === 'D/M/YYYY') {
                        return parseInt(day) + '/' + parseInt(month) + '/' + year;
                    } else if (format === 'DD/MM/YYYY') {
                        return day.padStart(2, '0') + '/' + month.padStart(2, '0') + '/' + year;
                    } else {
                        // Default format if no or unknown format specified
                        return year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
                    }
                }
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
                log.debug('Start Date', dateRangeStart);
                log.debug('End Date', dateRangeEnd);
    
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
                if (startDateSelected && endDateSelected) {
                    demandPlanSearch.filters.push(
                        search.createFilter({
                            name: "demanddate",
                            operator: search.Operator.ONORAFTER,
                            values: startDateSelected,
                        })
                    );
                    demandPlanSearch.filters.push(
                        search.createFilter({
                            name: "demanddate",
                            operator: search.Operator.ONORBEFORE,
                            values: endDateSelected,
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
                    demandData.push({
                        item: item,
                        forecast : forecast
                    })
                    allItem.push(item)
                })
                log.debug('demandData', demandData);
    
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
                    var actualSales = result.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "CASE WHEN {transaction.type} IN ('Invoice','Cash Sales','Credit Memo') THEN {transaction.quantity} END"
                    })
                    inventoryData.push({
                        item: item,
                        actualSales : actualSales
                    })
                })
                log.debug('inventoryData', inventoryData);
                var mergedData = demandData.map(function(demandItem) {
                    var matchedInventoryItem = inventoryData.find(function(inventoryItem) {
                        return inventoryItem.item === demandItem.item;
                    });
                    if (matchedInventoryItem) {
                        return {
                            item: demandItem.item,
                            forecast: demandItem.forecast,
                            actualSales: matchedInventoryItem.actualSales
                        };
                    } else {
                        return {
                            item: demandItem.item,
                            forecast: demandItem.forecast,
                            actualSales: null
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
                if(allItem){
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
                    var actualSales = result.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "CASE WHEN {transaction.type} IN ('Invoice','Cash Sales','Credit Memo') THEN {transaction.quantity} END"
                    })
                    inventoryData2.push({
                        item: item,
                        actualSales : actualSales
                    })
                })
                log.debug('mergedData', mergedData);
                log.debug('inventoryData2', inventoryData2)
            }catch(e){
                log.debug('error', e)
            }
           

        }
    }
    return {
      onRequest: onRequest,
    };
  });
  