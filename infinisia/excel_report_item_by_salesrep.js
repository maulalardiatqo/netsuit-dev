/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/ui/serverWidget", "N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime", "N/currency", "N/encode"], function (serverWidget, render, search, record, log, file, http, config, format, email, runtime, currency, encode) {
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
    var salesRepSelected = contextRequest.parameters.fSalesRep;
    var startDateSelected = decodeURIComponent(contextRequest.parameters.fstartdate);
    var endDateSelected = decodeURIComponent(contextRequest.parameters.fenddate);
    var allSalesRep = decodeURIComponent(contextRequest.parameters.fAllSalesRep);
    if (contextRequest.method == "GET") {
      log.debug("dataFilter", {
        salesRepSelected: salesRepSelected,
        startDateSelected: startDateSelected,
        endDateSelected: endDateSelected,
        allSalesRep: allSalesRep,
      });
      // search data total revenue list
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
        log.debug('kondisi salesRepSelected', salesRepSelected)
        employeeSearchObj.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: salesRepSelected,
          })
        );
      }
      var resultSetUsage = getAllResults(employeeSearchObj);
      log.debug('resultSetUsage', resultSetUsage)
      resultSetUsage.forEach(function (row) {
        let employeeName = row.getValue("altname");
        log.debug('employeeName', employeeName)
        let idEmp = row.getValue("internalid");
        log.debug('idEmp', idEmp)
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
      // log.debug("arrayItem", arrayItem);
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
        // log.debug("inventoryitemSearchObj result count", searchResultCount);
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

      // log.debug("inventoryAgingArr", inventoryAgingArr);
      log.debug("salesRepArr", salesRepArr);
      // log.debug("itemCustomer", itemCustomer);

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

      // log.debug("inventoryAgingArr _2", inventoryAgingArr);
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
      // log.debug("inventoryAgingArr _3", inventoryAgingArr);

      const groupedByEmployeeName = salesRepArr.reduce((acc, obj) => {
        const { employeeName, ...rest } = obj;
        if (!acc[employeeName]) {
          acc[employeeName] = [];
        }
        acc[employeeName].push(rest);
        return acc;
      }, {});
      const groupedEntries = Object.entries(groupedByEmployeeName);
      // log.debug('groupedEntries', groupedEntries)

      var rate = currency.exchangeRate({
        source: "IDR",
        target: "USD",
      });
      // log.debug("rate", rate);
      var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
      xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
      xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

      // Styles
      xmlStr += "<Styles>";
      xmlStr += "<Style ss:ID='OA'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#ffc001' ss:Pattern='Solid' />";
      xmlStr += "</Style>";
      xmlStr += "<Style ss:ID='OAC'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#ffc001' ss:Pattern='Solid' />";
      xmlStr += "</Style>";
      xmlStr += "<Style ss:ID='NB'>";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "</Style>";
      xmlStr += "<Style ss:ID='NBN'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "</Style>";
      xmlStr += "<Style ss:ID='FNB'>";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#8abf7e' ss:Pattern='Solid' />";
      xmlStr += "</Style>";
      xmlStr += "<Style ss:ID='FNBN'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#8abf7e' ss:Pattern='Solid' />";
      xmlStr += "</Style>";
      xmlStr += "</Styles>";
      //   End Styles

      // Sheet Name
      xmlStr += '<Worksheet ss:Name="Sheet1">';
      // End Sheet Name

      // Kolom Excel Header
      var dataEmployee = "";
      groupedEntries.forEach(([employeeName, group]) => {
        dataEmployee += employeeName + ",";
      });
      var selectedEmployee = "";
      var trimmedResult = ""
      if (dataEmployee) {
        trimmedResult = dataEmployee.substring(0, dataEmployee.length - 1);
      }
      xmlStr +=
      "<Table>" +
      "<Row ss:Index='1' ss:Height='20'>" +
      '<Cell><Data ss:Type="String">STOK BARANG</Data></Cell>' +
      '<Cell><Data ss:Type="String">' +
      trimmedResult +
      "</Data></Cell>" +
      "</Row>" +
      "<Row ss:Index='2' ss:Height='20'>" +
      '<Cell><Data ss:Type="String">DATE RANGE</Data></Cell>' +
      '<Cell><Data ss:Type="String">' +
      startDateSelected +
      " sd " +
      endDateSelected +
      "</Data></Cell>" +
      "</Row>" +
     "<Row ss:Index='3' ss:Height='20'>" +
      '<Cell ss:MergeDown="1" ss:StyleID="OAC"><Data ss:Type="String">ITEM NAME</Data></Cell>' +
      '<Cell ss:MergeDown="1" ss:StyleID="OAC"><Data ss:Type="String">PRINCIPALS</Data></Cell>' +
      '<Cell ss:MergeAcross="5" ss:StyleID="OAC"><Data ss:Type="String">INVENTORY AGING (DAYS)</Data></Cell>' +
      '<Cell ss:MergeDown="1" ss:StyleID="OAC"><Data ss:Type="String">UNIT</Data></Cell>' +
      (groupedEntries.length > 0
        ? '<Cell ss:MergeAcross="' + (groupedEntries.length - 1) + '" ss:StyleID="OAC"><Data ss:Type="String">STOK BARANG</Data></Cell>'
        : '') +
      '<Cell ss:MergeAcross="2" ss:StyleID="OAC"><Data ss:Type="String">ESTIMASI HARGA JUAL</Data></Cell>' +
      '<Cell ss:MergeAcross="4" ss:StyleID="OAC"><Data ss:Type="String">RINCIAN HARGA JUAL ATAS INVENTORY AGING</Data></Cell>' +
      '<Cell ss:MergeDown="1" ss:StyleID="OAC"><Data ss:Type="String">CUSTOMER</Data></Cell>' +
    "</Row>" +
      "<Row ss:Index='4' ss:Height='20'>" +
      '<Cell ss:Index="3" ss:StyleID="OAC"><Data ss:Type="String"><= 30</Data></Cell>' +
      '<Cell ss:StyleID="OAC"><Data ss:Type="String">30 - 60</Data></Cell>' +
      '<Cell ss:StyleID="OAC"><Data ss:Type="String">61 - 90</Data></Cell>' +
      '<Cell ss:StyleID="OAC"><Data ss:Type="String">91 - 120</Data></Cell>' +
      '<Cell ss:StyleID="OAC"><Data ss:Type="String">> 121</Data></Cell>' +
      '<Cell ss:StyleID="OAC"><Data ss:Type="String">Total Stock</Data></Cell>';
      var indexCol = 10;
      log.debug('groupedEntries.length', groupedEntries.length)
      if(groupedEntries.length>0){
        log.debug('masuk kondisi if sini')
        groupedEntries.forEach(([employeeName, group]) => {
          log.debug('employueename', employeeName);
          log.debug('indexCol', indexCol)
          xmlStr += "<Cell ss:Index='" + indexCol + "' ss:StyleID='OAC'><Data ss:Type='String'>" + employeeName + "</Data></Cell>";
          indexCol++;
        });
      }else{
        indexCol = indexCol - 1;
      }
      // log.debug('indexCol', indexCol + 1)
      xmlStr += '<Cell ss:Index="'+(indexCol + 1) +'" ss:StyleID="OAC"><Data ss:Type="String">Price / KG (USD)</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 2) +'" ss:StyleID="OAC"><Data ss:Type="String">Total Price (USD)</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 3) +'" ss:StyleID="OAC"><Data ss:Type="String">Total Price (IDR)</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 4) +'" ss:StyleID="OAC"><Data ss:Type="String"><=30</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 5) +'" ss:StyleID="OAC"><Data ss:Type="String">30-60</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 6) +'" ss:StyleID="OAC"><Data ss:Type="String">61-90</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 7) +'" ss:StyleID="OAC"><Data ss:Type="String">91-120</Data></Cell>';
      xmlStr += '<Cell ss:Index="'+(indexCol + 8) +'" ss:StyleID="OAC"><Data ss:Type="String">>120</Data></Cell>';
      xmlStr += "</Row>";
      // End Kolom Excel Header

      // content
      var subTotalPriceIDR = 0;
      var subTotalrhjLessThan30 = 0;
      var subTotalrhj3060 = 0;
      var subTotalrhj6190 = 0;
      var subTotalrhj91120 = 0;
      var subTotalrhjMorethan120 = 0;
      inventoryAgingArr.forEach((row) => {
        totalStockBySales = 0;
        xmlStr += `
        <Row>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.itemName || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.principals || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.agingLessthan30 || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.aging3060 || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.aging6190 || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.aging91120 || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.morethan120 || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalStock || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.unitType || ""}</Data></Cell>
        `;
        if(groupedEntries.length>0){
          groupedEntries.forEach(([employeeName, group]) => {
            xmlStr += `<Cell ss:StyleID="NBN"><Data ss:Type="Number">${row[employeeName.replace(/\s+/g, "")] || ""}</Data></Cell>`;
            totalStockBySales += parseFloat(row[employeeName.replace(/\s+/g, "")] || 0);
          });
        }
       
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
        xmlStr += `
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(priceUSD.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(totalPriceUSD.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(totalPriceIDR.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(rhjLessThan30.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(rhj3060.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(rhj6190.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(rhj91120.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${numberWithCommas(rhjMorethan120.toFixed(2)) || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.customerData || ""}</Data></Cell>
        </Row>
        `;
        subTotalPriceIDR += totalPriceIDR;
        subTotalrhjLessThan30 += rhjLessThan30;
        subTotalrhj3060 += rhj3060;
        subTotalrhj6190 += rhj6190;
        subTotalrhj91120 += rhj91120;
        subTotalrhjMorethan120 += rhjMorethan120;
      });
      // end content

      // footer
      var accrosTotal = 10 + Number(groupedEntries.length);
      // log.debug("accrosTotal", {
      //   accrosTotal: accrosTotal,
      //   subTotalPriceIDR: subTotalPriceIDR,
      //   subTotalrhjLessThan30: subTotalrhjLessThan30,
      //   subTotalrhj3060: subTotalrhj3060,
      //   subTotalrhj6190: subTotalrhj6190,
      //   subTotalrhj91120: subTotalrhj91120,
      //   subTotalrhjMorethan120: subTotalrhjMorethan120,
      // });
      xmlStr += `
      <Row>
        <Cell ss:MergeAcross='${accrosTotal}' ss:StyleID="FNB"><Data ss:Type="String">TOTAL STOK</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalPriceIDR.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalrhjLessThan30.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalrhj3060.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalrhj6190.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalrhj91120.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNBN"><Data ss:Type="Number">${subTotalrhjMorethan120.toFixed(2) || ""}</Data></Cell>
        <Cell ss:StyleID="FNB"/>
      </Row>
      `;
      // end footer

      xmlStr += "</Table></Worksheet></Workbook>";

      var strXmlEncoded = encode.convert({
        string: xmlStr,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64,
      });

      var objXlsFile = file.create({
        name: "Report.xls",
        fileType: file.Type.EXCEL,
        contents: strXmlEncoded,
      });

      log.debug("log", objXlsFile);

      context.response.writeFile({
        file: objXlsFile,
      });
    }
  }
  return {
    onRequest: onRequest,
  };
});
