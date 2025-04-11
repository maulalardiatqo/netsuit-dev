/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/ui/serverWidget", "N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime", "N/currency"], function (serverWidget, render, search, record, log, file, http, config, format, email, runtime, currency) {
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

  function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
    return x;
  }

  function getMonthName(monthNumber) {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const index = parseInt(monthNumber, 10) - 1;
    return months[index] || "";
  }

  function format_date_for_save_search(vDate) {
    var vDate = new Date(vDate);
    var hari = vDate.getDate();
    var bulan = vDate.getMonth() + 1;
    var tahun = vDate.getFullYear();
    var vDate = hari + "/" + bulan + "/" + tahun;
    return vDate;
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

  function onRequest(context) {
    var contextRequest = context.request;
    var sContent = "";
    var rContent = "";
    var fldTable;
    var FLDGRP_TABLE = "custpage_rp_fldgrp_table_revenue";
    var form = serverWidget.createForm({
      title: "Stock Report",
    });
    form.addFieldGroup({
      id: "filteroption",
      label: "FILTERS",
    });
    form.addFieldGroup({
      id: "filteroptiondate",
      label: "DATE RANGE",
    });
    form.addFieldGroup({
      id: FLDGRP_TABLE,
      label: "REPORT",
    });
    var salesRepField = form.addField({
      id: "custpage_f_salesrep",
      label: "SALES REP",
      type: serverWidget.FieldType.SELECT,
      container: "filteroption",
    });
    var cekalldept_Field = form.addField({
      id: "cekall_salesrep",
      label: "ALL SALES REP",
      type: serverWidget.FieldType.CHECKBOX,
      container: "filteroption",
    });

    var startDate = form.addField({
      id: "custpage_f_start_date",
      label: "DATE FROM",
      type: serverWidget.FieldType.DATE,
      container: "filteroptiondate",
    });
    startDate.defaultValue = startMtd;

    var endDate = form.addField({
      id: "custpage_f_end_date",
      label: "DATE TO",
      type: serverWidget.FieldType.DATE,
      container: "filteroptiondate",
    });
    endDate.defaultValue = endMtd;

    var employeeSearchObj = search.create({
      type: "employee",
      filters: [["salesrep", "is", "T"]],
      columns: ["entityid", "altname", "internalid"],
    });
    var resultSetUsage = getAllResults(employeeSearchObj);
    salesRepField.addSelectOption({
      value: "",
      text: "-Select Sales Rep-",
    });
    resultSetUsage.forEach(function (row) {
      let selectItemVal = row.getValue("internalid");
      let selectItemText = row.getValue("altname");
      salesRepField.addSelectOption({
        value: selectItemVal,
        text: selectItemText,
      });
      return true;
    });

    form.addButton({
      id: "printExcel",
      label: "Export to Excel",
      functionName: "exportStockSalesRep",
    });

    form.addSubmitButton({
      label: "Search",
    });

    form.addResetButton({
      label: "Clear",
    });
    form.clientScriptModulePath = "SuiteScripts/report_item_by_salesrep_cs.js";
    if (contextRequest.method == "GET") {
      context.response.writePage(form);
    } else {
      var salesRepSelected = contextRequest.parameters.custpage_f_salesrep;
      var startDateSelected = contextRequest.parameters.custpage_f_start_date;
      var endDateSelected = contextRequest.parameters.custpage_f_end_date;
      var allSalesRep = contextRequest.parameters.cekall_salesrep;
      salesRepField.defaultValue = salesRepSelected;
      startDate.defaultValue = startDateSelected;
      endDate.defaultValue = endDateSelected;
      log.debug("dataFilter", {
        salesRepSelected: salesRepSelected,
        startDateSelected: startDateSelected,
        endDateSelected: endDateSelected,
        allSalesRep: allSalesRep,
      });
      // search data total revenue list
      // var inventoryAging = search.load({
      //   id: "customsearch_atlas_inv_aging_2",
      // });

      // update saved search 4/9/2025 ardi

      
      var inventoryAging = search.load({
        id: "customsearch_atlas_inv_aging_2_3",
      });
      if (salesRepSelected) {
        inventoryAging.filters.push(
          search.createFilter({
            name: "salesrep",
            operator: search.Operator.ANYOF,
            values: salesRepSelected,
          })
        );
      }
      if (startDateSelected && endDateSelected) {
        inventoryAging.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        inventoryAging.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      // end search data total revenue list

      var salesRepArr = [];
      var totalSalesRep = 0;
      // search stock per sales rep
      var employeeSearchObj = search.create({
        type: "employee",
        filters: [["salesrep", "is", "T"]],
        columns: ["entityid", "altname", "internalid"],
      });
      if (salesRepSelected) {
        employeeSearchObj.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: salesRepSelected,
          })
        );
      }
      var resultSetUsage = getAllResults(employeeSearchObj);
      resultSetUsage.forEach(function (row) {
        let employeeName = row.getValue("altname");
        var stokPerSales = search.load({
          id: "customsearch_atlas_inv_aging_2_2",
        });
        stokPerSales.filters.push(
          search.createFilter({
            name: "salesrep",
            operator: search.Operator.ANYOF,
            values: row.getValue("internalid"),
          })
        );
        if (startDateSelected && endDateSelected) {
          stokPerSales.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORAFTER,
              values: startDateSelected,
            })
          );
          stokPerSales.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORBEFORE,
              values: endDateSelected,
            })
          );
        }
        var myResultsSalesRep = getAllResults(stokPerSales);
        myResultsSalesRep.forEach(function (result) {
          let quantity = result.getValue({
            name: "quantity",
            summary: "SUM",
          });
          let itemID = result.getValue({
            name: "item",
            summary: "GROUP",
          });
          salesRepArr.push({
            employeeName: employeeName,
            itemID: itemID,
            quantity: quantity,
          });
        });
        totalSalesRep++;
        return true;
      });
      // end search stock per sales rep

      var inventoryAgingArr = [];
      var arrayItem = [];
      var inventoryAgingSet = inventoryAging.run();
      var inventoryAging = inventoryAgingSet.getRange(0, 999);
      for (let index = 0; index < inventoryAging.length; index++) {
        var itemName = inventoryAging[index].getText({
          name: inventoryAgingSet.columns[0],
        });
        var itemID = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[0],
        });
        var agingLessthan30 = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[3],
        });
        var aging3060 = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[4],
        });
        var aging6190 = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[5],
        });
        var aging91120 = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[6],
        });
        var morethan120 = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[7],
        });
        var totalStock = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[8],
        });
        var unitType = inventoryAging[index].getText({
          name: inventoryAgingSet.columns[9],
        });
        var lastPurchasePrice = inventoryAging[index].getValue({
          name: inventoryAgingSet.columns[10],
        });
        var principals = inventoryAging[index].getText({
          name: inventoryAgingSet.columns[11],
        });
        inventoryAgingArr.push({
          itemID: itemID,
          itemName: itemName,
          principals: principals,
          unitType: unitType,
          agingLessthan30: agingLessthan30,
          aging3060: aging3060,
          aging6190: aging6190,
          aging91120: aging91120,
          morethan120: morethan120,
          totalStock: totalStock,
          lastPurchasePrice: lastPurchasePrice,
        });
        arrayItem.push(itemID);
      }

      var itemCustomer = [];
      log.debug("arrayItem", arrayItem);
      if (arrayItem.length > 0) {
        var inventoryitemSearchObj = search.create({
          type: "inventoryitem",
          filters: [["type", "anyof", "InvtPart"], "AND", ["transaction.type", "anyof", "SalesOrd"], "AND", ["internalid", "anyof", arrayItem]],
          columns: [
            "internalid",
            search.createColumn({
              name: "itemid",
              sort: search.Sort.ASC,
            }),
            search.createColumn({
              name: "type",
              join: "transaction",
            }),
            search.createColumn({
              name: "entity",
              join: "transaction",
            }),
          ],
        });
        var searchResultCount = inventoryitemSearchObj.runPaged().count;
        log.debug("inventoryitemSearchObj result count", searchResultCount);
        inventoryitemSearchObj.run().each(function (result) {
          let customerName = result.getText({
            name: "entity",
            join: "transaction",
          });
          let itemID = result.getValue("internalid");
          itemCustomer.push({
            itemID: itemID,
            customerName: customerName,
          });
          return true;
        });
      }

      log.debug("inventoryAgingArr", inventoryAgingArr);
      log.debug("salesRepArr", salesRepArr);
      log.debug("itemCustomer", itemCustomer);

      const quantitiesMap = {};
      salesRepArr.forEach(({ employeeName, itemID, quantity }) => {
        if (!quantitiesMap[itemID]) {
          quantitiesMap[itemID] = {};
        }
        quantitiesMap[itemID][employeeName.replace(/\s+/g, "")] = quantity;
      });

      inventoryAgingArr.forEach((obj) => {
        Object.keys(quantitiesMap).forEach((itemID) => {
          Object.keys(quantitiesMap[itemID]).forEach((employeeName) => {
            if (!obj[employeeName]) {
              obj[employeeName] = "";
            }
          });
        });
      });

      inventoryAgingArr.forEach((obj) => {
        const itemID = obj.itemID;
        if (quantitiesMap[itemID]) {
          Object.entries(quantitiesMap[itemID]).forEach(([employeeName, quantity]) => {
            obj[employeeName] = quantity;
          });
        }
      });

      log.debug("inventoryAgingArr _2", inventoryAgingArr);
      const customerNamesMap = {};
      itemCustomer.forEach(({ itemID, customerName }) => {
        if (!customerNamesMap[itemID]) {
          customerNamesMap[itemID] = new Set();
        }
        customerNamesMap[itemID].add(customerName);
      });

      inventoryAgingArr.forEach((item) => {
        const { itemID } = item;
        if (customerNamesMap[itemID]) {
          item.customerData = [...customerNamesMap[itemID]].join(", ");
        } else {
          item.customerData = ""; // Set default value if no customers found for the itemID
        }
      });
      log.debug("inventoryAgingArr _3", inventoryAgingArr);

      const groupedByEmployeeName = salesRepArr.reduce((acc, obj) => {
        const { employeeName, ...rest } = obj;
        if (!acc[employeeName]) {
          acc[employeeName] = [];
        }
        acc[employeeName].push(rest);
        return acc;
      }, {});
      const groupedEntries = Object.entries(groupedByEmployeeName);

      var rate = currency.exchangeRate({
        source: "IDR",
        target: "USD",
      });
      log.debug("rate", rate);
      var totalCurrentMonth = 0,
        totalMtd = 0;
      inventoryAgingArr.forEach((row) => {
        totalStockBySales = 0;
        rContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: left;">' + row.itemName || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: left;">' + row.principals || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.agingLessthan30 || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.aging3060 || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.aging6190 || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.aging91120 || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.morethan120 || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.totalStock || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + row.unitType || "" + "</td>";
        groupedEntries.forEach(([employeeName, group]) => {
          rContent += '            <td class="uir-list-row-cell" style=" border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: center;">' + (row[employeeName.replace(/\s+/g, "")] || "") + "</td>";
          totalStockBySales += parseFloat(row[employeeName.replace(/\s+/g, "")] || 0);
        });
        var priceUSD = parseFloat(row.lastPurchasePrice || 0) * rate;
        var totalPriceUSD = priceUSD * parseFloat(totalStockBySales || 0);
        var totalPriceIDR = totalPriceUSD / rate;
        var rhjLessThan30 = 0,
          rhj3060 = 0,
          rhj6190 = 0,
          rhj91120 = 0,
          rhjMorethan120 = 0;
        if (totalPriceIDR) {
          rhjLessThan30 = ((parseFloat(row.agingLessthan30 || 0) * totalPriceIDR) / totalStockBySales) * (totalStockBySales / parseFloat(row.totalStock));
          rhj3060 = ((parseFloat(row.aging3060 || 0) * totalPriceIDR) / totalStockBySales) * (totalStockBySales / parseFloat(row.totalStock));
          rhj6190 = ((parseFloat(row.aging6190 || 0) * totalPriceIDR) / totalStockBySales) * (totalStockBySales / parseFloat(row.totalStock));
          rhj91120 = ((parseFloat(row.aging91120 || 0) * totalPriceIDR) / totalStockBySales) * (totalStockBySales / parseFloat(row.totalStock));
          rhjMorethan120 = ((parseFloat(row.morethan120 || 0) * totalPriceIDR) / totalStockBySales) * (totalStockBySales / parseFloat(row.totalStock));
        }
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(priceUSD.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(totalPriceUSD.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(totalPriceIDR.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(rhjLessThan30.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(rhj3060.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(rhj6190.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(rhj91120.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: right;">' + numberWithCommas(rhjMorethan120.toFixed(2)) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="border-bottom: 1px solid #000; border-right: 1px solid #000;  text-align: left;">' + row.customerData || "" + "</td>";
        rContent += "        </tr>";
        totalCurrentMonth += Number(row.amount);
        totalMtd += Number(row.amountMtd);
      });

      fldTable = form.addField({
        id: "custpage_htmlfield",
        type: serverWidget.FieldType.INLINEHTML,
        label: "HTML Image",
        container: FLDGRP_TABLE,
      });
      sContent += "    <table id='table'>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" rowspan="2">ITEM NAME</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" rowspan="2">PRINCIPALS</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" colspan="6">INVENTORY AGING (DAYS)</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" rowspan="2">UNIT</th>';
      if (groupedEntries.length > 0) {
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" colspan=" ' + groupedEntries.length + ' ">STOK BARANG</th>';
      }
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" colspan="3">ESTIMASI HARGA JUAL</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" colspan="5">RINCIAN HARGA JUAL ATAS INVENTORY AGING</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" rowspan="2">CUSTOMER</th>';

      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;"><=30</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" width="120px">30-60</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" width="120px">61-90</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;" width="120px">91-120</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">>120</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">Total Stock</th>';
      groupedEntries.forEach(([employeeName, group]) => {
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">' + employeeName + "</th>";
      });
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">Price / KG (USD)</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">Total Price (USD)</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">Total Price (IDR)</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;"><=30</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">30-60</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">61-90</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">91-120</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffe598 !important;">>120</th>';
      sContent += "        </tr>";
      sContent += rContent;
      sContent += "    </table>";
      fldTable.defaultValue = sContent;
      context.response.writePage(form);
    }
  }
  return {
    onRequest: onRequest,
  };
});
