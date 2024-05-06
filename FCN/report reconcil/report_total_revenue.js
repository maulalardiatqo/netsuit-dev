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

  function numberWithCommas(x) {
    x = x.toString();
    x = x.split(".")[0];
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
      title: "Report Total Revenue",
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
    var subsidiaryField = form.addField({
      id: "custpage_f_subsidiary",
      label: "SUBSIDIARY",
      type: serverWidget.FieldType.SELECT,
      source: "subsidiary",
      container: "filteroption",
    });
    subsidiaryField.isMandatory = true;

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

    form.addButton({
      id: "printExcel",
      label: "Export to Excel",
      functionName: "exportTotalRevenue",
    });

    form.addSubmitButton({
      label: "Search",
    });

    form.addResetButton({
      label: "Clear",
    });
    form.clientScriptModulePath = "SuiteScripts/report_reconcile_cs.js";
    if (contextRequest.method == "GET") {
      context.response.writePage(form);
    } else {
      var subsidiarySelected = contextRequest.parameters.custpage_f_subsidiary;
      var startDateSelected = contextRequest.parameters.custpage_f_start_date;
      var endDateSelected = contextRequest.parameters.custpage_f_end_date;
      subsidiaryField.defaultValue = subsidiarySelected;
      startDate.defaultValue = startDateSelected;
      endDate.defaultValue = endDateSelected;
      log.debug("dataFilter", {
        subsidiarySelected: subsidiarySelected,
        startDateSelected: startDateSelected,
        endDateSelected: endDateSelected,
      });
      // search data total revenue list
      var totalRevenueList = search.load({
        id: "customsearch663",
      });
      totalRevenueList.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      if (startDateSelected && endDateSelected) {
        totalRevenueList.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        totalRevenueList.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      // end search data total revenue list
      // search data total revenue MTD
      var todayDate = new Date();
      var startOfTodayMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      var setTodayDate = format_date_for_save_search(todayDate);
      var setstartOfTodayMonth = format_date_for_save_search(startOfTodayMonth);
      log.debug("datee", {
        setTodayDate: setTodayDate,
        setstartOfTodayMonth: setstartOfTodayMonth,
      });

      var totalRevenueMTD = search.load({
        id: "customsearch670",
      });
      totalRevenueMTD.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      // end search data total revenue MTD
      // search total revenue
      var totalRevenue = search.load({
        id: "customsearch664",
      });
      totalRevenue.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      if (startDateSelected && endDateSelected) {
        totalRevenue.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        totalRevenue.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      // end search search total revenue

      var myResults = getAllResults(totalRevenueList);
      var totalRevenueListArr = [];

      myResults.forEach(function (result) {
        let customer = result.getText({
          name: "entity",
          summary: "GROUP",
        });
        let customerVal = result.getValue({
          name: "entity",
          summary: "GROUP",
        });
        let amount = result.getValue({
          name: "formulacurrency",
          summary: "SUM",
          formula: "({totalamount}-{taxtotal})-NVL({custbody_sales_amt_bill},0)",
        });
        let billing = result.getValue({
          name: "formulacurrency",
          summary: "SUM",
          formula: "({totalamount}-{taxtotal})-NVL({custbody_sales_amt_bill},0)",
        });
        totalRevenueListArr.push({
          customer: customer,
          customerVal: customerVal,
          amount: amount,
          billing: billing,
        });
      });
      log.debug("totalRevenueListArr", totalRevenueListArr);

      var myResultsMTD = getAllResults(totalRevenueMTD);
      var totalRevenueMtdArr = [];
      myResultsMTD.forEach(function (result) {
        let customerVal = result.getValue({
          name: "entity",
          summary: "GROUP",
        });
        let customer = result.getText({
          name: "entity",
          summary: "GROUP",
        });
        let amount = result.getValue({
          name: "formulacurrency",
          summary: "SUM",
          formula: "({totalamount}-{taxtotal})-NVL({custbody_sales_amt_bill},0)",
        });
        totalRevenueMtdArr.push({
          customer: customer,
          customerVal: customerVal,
          amountMtd: amount,
        });
      });
      log.debug("totalRevenueMtdArr", totalRevenueMtdArr);

      // merge array
      let mergedRevenueList = [];
      totalRevenueListArr.forEach((itemList) => {
        // Find matching entry in poDataArr
        let matchingMtd = totalRevenueMtdArr.find((mtdItem) => {
          return mtdItem.customerVal === itemList.customerVal;
        });
        let mergedItem = {
          ...itemList,
          amountMtd: matchingMtd ? matchingMtd.amountMtd : "",
        };
        mergedRevenueList.push(mergedItem);
      });

      totalRevenueMtdArr.forEach((mtdItem) => {
        if (!totalRevenueListArr.some((itemList) => itemList.customerVal === mtdItem.customerVal)) {
          mergedRevenueList.push({
            customer: mtdItem.customer,
            customerVal: mtdItem.customerVal,
            amount: "",
            billing: "",
            amountMtd: mtdItem.amountMtd,
          });
        }
      });
      log.debug("mergedRevenueList", mergedRevenueList);
      // end merge array

      var myResultsTotal = getAllResults(totalRevenue);
      var totalAnnualRevenue = 0,
        totalBalanceTogo = 0;
      myResultsTotal.forEach(function (result) {
        let amountTotal = result.getValue({
          name: "amount",
          summary: "SUM",
          label: "Amount",
        });
        let billingTotal = result.getValue({
          name: "formulacurrency",
          summary: "SUM",
          formula: "{totalamount}-{taxtotal}",
          label: "Billing",
        });
        totalAnnualRevenue = amountTotal;
        totalBalanceTogo = billingTotal;
      });

      var totalCurrentMonth = 0,
        totalMtd = 0;
      mergedRevenueList.forEach((row) => {
        rContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
        rContent += '            <td class="uir-list-row-cell" style="text-align: left;">' + row.customer || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amount) || "" + "</td>";
        rContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amountMtd) || "" + "</td>";
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
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fffb00 !important;">TOTAL REVENUE</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffc001 !important;">CURRENT MONTH</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #71ac47 !important;">MTD</th>';
      sContent += "        </tr>";
      sContent += rContent;
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fffb00 !important;">TOTAL REVENUE</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #ffc001 !important;">' + numberWithCommas(totalCurrentMonth) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #71ac47 !important;">' + numberWithCommas(totalMtd) + "</th>";
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <td class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffda65 !important;">ANNUAL REVENUE TARGET</th>';
      sContent += '            <td colspan="2" class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #ffda65 !important;">' + numberWithCommas(totalAnnualRevenue) + "</th>";
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <td class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ffda65 !important;">BALANCE TO GO</th>';
      sContent += '            <td colspan="2" class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #ffda65 !important;">' + numberWithCommas(totalAnnualRevenue) + "</th>";
      sContent += "        </tr>";
      sContent += "    </table>";
      fldTable.defaultValue = sContent;
      context.response.writePage(form);
    }
  }
  return {
    onRequest: onRequest,
  };
});
