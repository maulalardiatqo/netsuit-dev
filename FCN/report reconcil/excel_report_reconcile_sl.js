/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/ui/serverWidget", "N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime", "N/encode"], function (serverWidget, render, search, record, log, file, http, config, format, email, runtime, encode) {
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

  function groupByMonthAndYear(data) {
    const groupedData = {};
    data.forEach((entry) => {
      const key = entry.year + "-" + entry.month;
      if (!groupedData[key]) {
        groupedData[key] = {
          month: entry.month,
          year: entry.year,
          total: 0,
          billing: 0,
          amntRetainer: 0,
          amntCF: 0,
          amntSF: 0,
          amntMF: 0,
          amntIncentive: 0,
          amntOthers: 0,
        };
      }
      groupedData[key].total += parseFloat(entry.total || 0);
      groupedData[key].billing += parseFloat(entry.billing || 0);
      groupedData[key].amntRetainer += parseFloat(entry.amntRetainer || 0);
      groupedData[key].amntCF += parseFloat(entry.amntCF || 0);
      groupedData[key].amntSF += parseFloat(entry.amntSF || 0);
      groupedData[key].amntMF += parseFloat(entry.amntMF || 0);
      groupedData[key].amntIncentive += parseFloat(entry.amntIncentive || 0);
      groupedData[key].amntOthers += parseFloat(entry.amntOthers || 0);
    });
    const resultArray = Object.values(groupedData);
    resultArray.forEach((group) => {
      group.total = group.total.toFixed(2);
      group.billing = group.billing.toFixed(2);
      group.amntRetainer = group.amntRetainer.toFixed(2);
      group.amntCF = group.amntCF.toFixed(2);
      group.amntSF = group.amntSF.toFixed(2);
      group.amntMF = group.amntMF.toFixed(2);
      group.amntIncentive = group.amntIncentive.toFixed(2);
      group.amntOthers = group.amntOthers.toFixed(2);
    });

    return resultArray;
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
    var subsidiarySelected = contextRequest.parameters.fsubsidiary;
    var customerSelected = contextRequest.parameters.fcustomer;
    var startDateSelected = decodeURIComponent(contextRequest.parameters.fstartdate);
    var endDateSelected = decodeURIComponent(contextRequest.parameters.fenddate);

    if (contextRequest.method == "GET") {
      var fieldLookUpSubs = search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: subsidiarySelected,
        columns: ["name"],
      });
      var fieldLookUpSubsText = fieldLookUpSubs.name;
      var customerName = "All",
        brandName = "";
      if (customerSelected) {
        var customerSearchObj = search.create({
          type: "customer",
          filters: [["internalid", "anyof", customerSelected]],
          columns: ["entityid", "altname", "custentity_cust_brand"],
        });
        customerSearchObj.run().each(function (result) {
          customerName = result.getValue("altname");
          brandName = result.getValue("custentity_cust_brand");
        });
      }

      log.debug("filter", {
        subsidiarySelected: subsidiarySelected,
        startDateSelected: startDateSelected,
        endDateSelected: endDateSelected,
      });
      // search data pending billing
      var pendingBillData = search.load({
        id: "customsearch660",
      });
      pendingBillData.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      if (customerSelected) {
        pendingBillData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: customerSelected,
          })
        );
      }
      if (startDateSelected && endDateSelected) {
        pendingBillData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        pendingBillData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      // end search data pending billing
      // search data job done
      var jobDoneData = search.load({
        id: "customsearch666",
      });
      jobDoneData.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      if (customerSelected) {
        jobDoneData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: customerSelected,
          })
        );
      }
      if (startDateSelected && endDateSelected) {
        jobDoneData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        jobDoneData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      // end search data job done
      // search data PO
      var poData = search.load({
        id: "customsearch665",
      });
      poData.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      // end search data PO
      var myResults = getAllResults(pendingBillData);
      var pendingBillDataArr = [];
      myResults.forEach(function (result) {
        let quoteNumber = result.getValue("tranid");
        let jobNumber = result.getValue("custbody_abj_custom_jobnumber");
        let project = result.getText("class");
        let status = result.getText("statusref");
        let pic = result.getText("custbody_so_pic");
        let deliverables = result.getText("line.cseg_abjproj_cust_");
        let qty = result.getValue("quantity");
        let invoiceNumber = result.getValue({
          name: "tranid",
          join: "applyingTransaction",
        });
        let invoiceNumberVal = result.getValue({
          name: "internalid",
          join: "applyingTransaction",
        });
        let billingBeforeVat = result.getValue({
          name: "formulacurrency",
          formula: "{totalamount}-{taxtotal}",
        });
        let revenue = result.getText("line.cseg_abjproj_cust_");
        let amount = result.getValue("amount");
        var amntRetainer,
          amntCF,
          amntSF,
          amntMF,
          amntIncentive,
          amntOthers = "";
        switch (revenue) {
          case "Retainer":
            amntRetainer = amount;
            break;
          case "Agency Commission/Creative Fee":
            amntCF = amount;
            break;
          case "Supervision Fee":
            amntSF = amount;
            break;
          case "Media Fee":
            amntMF = amount;
            break;
          case "Incentive":
            amntIncentive = amount;
            break;

          default:
            amntOthers = amount;
            break;
        }
        let quoteNumberVal = result.getValue("internalid");
        let projectVal = result.getValue("class");
        let deliverablesVal = result.getValue("line.cseg_abjproj_cust_");
        pendingBillDataArr.push({
          quoteNumber: quoteNumber,
          jobNumber: jobNumber,
          project: project,
          status: status,
          pic: pic,
          deliverables: deliverables,
          qty: qty,
          invoiceNumber: invoiceNumber,
          invoiceNumberVal: invoiceNumberVal,
          billingBeforeVat: billingBeforeVat,
          amountBill: amount,
          amntRetainer: amntRetainer || "",
          amntCF: amntCF || "",
          amntSF: amntSF || "",
          amntMF: amntMF || "",
          amntIncentive: amntIncentive || "",
          amntOthers: amntOthers || "",
          costOfBilling: amount,
          quoteNumberVal: quoteNumberVal,
          projectVal: projectVal,
          deliverablesVal: deliverablesVal,
        });
      });

      var myResultsJob = getAllResults(jobDoneData);
      var jobDoneDataArr = [];
      myResultsJob.forEach(function (result) {
        let quoteNumber = result.getValue("tranid");
        let jobNumber = result.getValue("custbody_abj_custom_jobnumber");
        let project = result.getText("class");
        let status = result.getText("statusref");
        let pic = result.getText("custbody_so_pic");
        let deliverables = result.getText("line.cseg_abjproj_cust_");
        let qty = result.getValue("quantity");
        let invoiceNumber = result.getValue({
          name: "tranid",
          join: "applyingTransaction",
        });
        let invoiceNumberVal = result.getValue({
          name: "internalid",
          join: "applyingTransaction",
        });
        let billingBeforeVat = result.getValue({
          name: "formulacurrency",
          formula: "{totalamount}-{taxtotal}",
        });
        let revenue = result.getText("line.cseg_abjproj_cust_");
        let amount = result.getValue("amount");
        var amntRetainer,
          amntCF,
          amntSF,
          amntMF,
          amntIncentive,
          amntOthers = "";
        switch (revenue) {
          case "Retainer":
            amntRetainer = amount;
            break;
          case "Agency Commission/Creative Fee":
            amntCF = amount;
            break;
          case "Supervision Fee":
            amntSF = amount;
            break;
          case "Media Fee":
            amntMF = amount;
            break;
          case "Incentive":
            amntIncentive = amount;
            break;

          default:
            amntOthers = amount;
            break;
        }
        let quoteNumberVal = result.getValue("internalid");
        let projectVal = result.getValue("class");
        let deliverablesVal = result.getValue("line.cseg_abjproj_cust_");
        jobDoneDataArr.push({
          quoteNumber: quoteNumber,
          jobNumber: jobNumber,
          project: project,
          status: status,
          pic: pic,
          deliverables: deliverables,
          qty: qty,
          invoiceNumber: invoiceNumber,
          invoiceNumberVal: invoiceNumberVal,
          billingBeforeVat: billingBeforeVat,
          amountBill: amount,
          amntRetainer: amntRetainer || "",
          amntCF: amntCF || "",
          amntSF: amntSF || "",
          amntMF: amntMF || "",
          amntIncentive: amntIncentive || "",
          amntOthers: amntOthers || "",
          costOfBilling: amount,
          quoteNumberVal: quoteNumberVal,
          projectVal: projectVal,
          deliverablesVal: deliverablesVal,
        });
      });

      var myResultsPO = getAllResults(poData);
      var poDataArr = [];
      myResultsPO.forEach(function (result) {
        let poNo = result.getValue("tranid");
        let vendorName = result.getValue({
          name: "companyname",
          join: "vendor",
        });
        let memo = result.getValue("memomain");
        let amount = result.getValue("amount");
        let quoteNumber = result.getValue("custbody_po_so_no_project");
        let project = result.getValue("class");
        let deliverables = result.getValue("line.cseg_abjproj_cust_");
        let paymentStatus = result.getText("statusref");
        poDataArr.push({
          poNo: poNo,
          vendorName: vendorName,
          amountPo: amount,
          total: amount,
          remarks: memo,
          paymentStatus: paymentStatus,
          quoteNumberVal: quoteNumber,
          projectVal: project,
          deliverablesVal: deliverables,
        });
      });
      log.debug("poDataArr", poDataArr.length);

      let mergedPendingBillArray = [];
      pendingBillDataArr.forEach((pendingBillItem) => {
        // Find matching entry in poDataArr
        let matchingPO = poDataArr.find((poItem) => {
          return poItem.quoteNumberVal === pendingBillItem.quoteNumberVal && poItem.projectVal === pendingBillItem.projectVal && poItem.deliverablesVal === pendingBillItem.deliverablesVal;
        });
        let mergedItem = {
          ...pendingBillItem,
          poNo: matchingPO ? matchingPO.poNo : "",
          vendorName: matchingPO ? matchingPO.vendorName : "",
          amountPo: matchingPO ? matchingPO.amountPo : "",
          total: matchingPO ? matchingPO.total : "",
          remarks: matchingPO ? matchingPO.remarks : "",
          paymentStatus: matchingPO ? matchingPO.paymentStatus : "",
        };
        mergedPendingBillArray.push(mergedItem);
      });
      log.debug("dataa", mergedPendingBillArray);

      let mergedJobDoneArray = [];
      jobDoneDataArr.forEach((jobDoneItem) => {
        // Find matching entry in poDataArr
        let matchingPO = poDataArr.find((poItem) => {
          return poItem.quoteNumberVal === jobDoneItem.quoteNumberVal && poItem.projectVal === jobDoneItem.projectVal && poItem.deliverablesVal === jobDoneItem.deliverablesVal;
        });
        let mergedItem = {
          ...jobDoneItem,
          poNo: matchingPO ? matchingPO.poNo : "",
          vendorName: matchingPO ? matchingPO.vendorName : "",
          amountPo: matchingPO ? matchingPO.amountPo : "",
          total: matchingPO ? matchingPO.total : "",
          remarks: matchingPO ? matchingPO.remarks : "",
          paymentStatus: matchingPO ? matchingPO.paymentStatus : "",
        };
        mergedJobDoneArray.push(mergedItem);
      });
      var totalWIPBilling = 0,
        totalWIPTotal = 0,
        totalWIIPRetainer = 0,
        totalWIPCF = 0,
        totalWIPSf = 0,
        totalWIPMf = 0,
        totalWIPIf = 0,
        totalWIPOthers = 0;

      var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
      xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
      xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

      // Styles
      xmlStr += "<Styles>";
      xmlStr += "<Style ss:ID='HGREY'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#d9d9d9' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HBLUE'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#5a9bd6' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HYELLOW'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#fdf851' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HORANGE'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#ed7c39' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HREVENUE'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#f7caac' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HTOTAL'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center'/>";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#c65b2c' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HPENDING'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#8eaadc' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HJOBDONE'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#a8d18d' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HTOTALWIP'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#bdd6ee' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='HMONTH'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#5a9bd6' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='CMONTH'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#bdd6ee' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='MONTHTOTAL'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#d5a6bd' ss:Pattern='Solid' />";
      xmlStr += "</Style>";

      xmlStr += "<Style ss:ID='BUDGET'>";
      xmlStr += "<NumberFormat ss:Format='Standard' />";
      xmlStr += "<Alignment />";
      xmlStr += "<Borders>";
      xmlStr += "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
      xmlStr += "</Borders>";
      xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
      xmlStr += "<Interior ss:Color='#f8c046' ss:Pattern='Solid' />";
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
      xmlStr += "</Styles>";
      //   End Styles

      // Sheet Name
      xmlStr += '<Worksheet ss:Name="Sheet1">';
      // End Sheet Name

      xmlStr +=
        "<Table>" +
        "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='500' />" +
        "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Column ss:Index='26' ss:AutoFitWidth='0' ss:Width='200' />" +
        "<Row ss:Index='1' ss:Height='20'>" +
        '<Cell><Data ss:Type="String">SUBSIDIARY</Data></Cell>' +
        '<Cell><Data ss:Type="String">' +
        fieldLookUpSubsText +
        "</Data></Cell>" +
        "</Row>" +
        "<Row ss:Index='2' ss:Height='20'>" +
        '<Cell><Data ss:Type="String">CLIENT</Data></Cell>' +
        '<Cell><Data ss:Type="String">' +
        customerName +
        "</Data></Cell>" +
        "</Row>" +
        "<Row ss:Index='3' ss:Height='20'>" +
        '<Cell><Data ss:Type="String">BRAND</Data></Cell>' +
        '<Cell><Data ss:Type="String">' +
        brandName +
        "</Data></Cell>" +
        "</Row>" +
        "<Row ss:Index='4' ss:Height='20'>" +
        '<Cell><Data ss:Type="String">DATE RANGE</Data></Cell>' +
        '<Cell><Data ss:Type="String">' +
        startDateSelected +
        " sd " +
        endDateSelected +
        "</Data></Cell>" +
        "</Row>" +
        "<Row ss:Index='5' ss:Height='20'>" +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Quote Number</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Job No</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Project</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Status</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">PIC</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Deliverables</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Qty</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Invoice Number</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">BILLING&#10;(BEFORE VAT)</Data></Cell>' +
        '<Cell ss:MergeAcross="6" ss:StyleID="HREVENUE"><Data ss:Type="String">REVENUE</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">Payment Status</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">PO NO</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">VENDOR NAME</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">AMOUNT ( EXC VAT )</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">TOTAL</Data></Cell>' +
        '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">REMARKS</Data></Cell>' +
        "</Row>" +
        "<Row ss:Index='6' ss:Height='20'>" +
        '<Cell ss:Index="10" ss:StyleID="HTOTAL"><Data ss:Type="String">TOTAL</Data></Cell>' +
        '<Cell ss:Index="11" ss:StyleID="HORANGE"><Data ss:Type="String">Retainer</Data></Cell>' +
        '<Cell ss:Index="12" ss:StyleID="HORANGE"><Data ss:Type="String">Agency Commission/Creative Fee</Data></Cell>' +
        '<Cell ss:Index="13" ss:StyleID="HORANGE"><Data ss:Type="String">Supervision Fee</Data></Cell>' +
        '<Cell ss:Index="14" ss:StyleID="HORANGE"><Data ss:Type="String">Media Fee</Data></Cell>' +
        '<Cell ss:Index="15" ss:StyleID="HORANGE"><Data ss:Type="String">Incentive</Data></Cell>' +
        '<Cell ss:Index="16" ss:StyleID="HORANGE"><Data ss:Type="String">Others/Rebate</Data></Cell>' +
        "</Row>" +
        "<Row ss:Index='7' ss:Height='20'>" +
        '<Cell ss:StyleID="HPENDING" ss:MergeAcross="21" ><Data ss:Type="String">WORK IN PROGRESS</Data></Cell>' +
        "</Row>";
      mergedPendingBillArray.forEach((row) => {
        var totalRev = Number(row.billingBeforeVat || 0) - Number(row.total || 0);
        xmlStr += `
        <Row>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.quoteNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.jobNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.project || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.status || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.pic || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.deliverables || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.qty || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.invoiceNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.billingBeforeVat || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${totalRev || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntCF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntSF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntMF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntIncentive || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntOthers || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.paymentStatus || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.poNo || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.vendorName || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amountPo || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.total || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.remarks || ""}</Data></Cell>
        </Row>
        `;
        totalWIPBilling += Number(row.billingBeforeVat || 0);
        totalWIPTotal += Number(row.amountBill || 0);
        totalWIIPRetainer += Number(row.amntRetainer || 0);
        totalWIPCF += Number(row.amntCF || 0);
        totalWIPSf += Number(row.amntSF || 0);
        totalWIPMf += Number(row.amntMF || 0);
        totalWIPIf += Number(row.amntIncentive || 0);
        totalWIPOthers += Number(row.amntOthers || 0);
      });

      xmlStr += `
      <Row>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="String">TOTAL WIP</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPBilling || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPTotal || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIIPRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPCF || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPSf || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPMf || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPIf || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPOthers || ""}</Data></Cell>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        <Cell ss:StyleID="HTOTALWIP"/>
        </Row>
      `;
      xmlStr += "<Row>" + '<Cell ss:StyleID="HJOBDONE" ss:MergeAcross="21" ><Data ss:Type="String">JOB DONE</Data></Cell>' + "</Row>";
      mergedJobDoneArray.forEach((row) => {
        var totalRev = Number(row.billingBeforeVat || 0) - Number(row.total || 0);
        xmlStr += `
        <Row>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.quoteNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.jobNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.project || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.status || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.pic || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.deliverables || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.qty || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.invoiceNumber || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.billingBeforeVat || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${totalRev || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntCF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntSF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntMF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntIncentive || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntOthers || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.paymentStatus || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.poNo || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.vendorName || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amountPo || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.total || ""}</Data></Cell>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${row.remarks || ""}</Data></Cell>
        </Row>
        `;
      });

      // summary data
      var summaryData = search.load({
        id: "customsearch662",
      });
      summaryData.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: subsidiarySelected,
        })
      );
      if (customerSelected) {
        summaryData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: customerSelected,
          })
        );
      }
      if (startDateSelected && endDateSelected) {
        summaryData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: startDateSelected,
          })
        );
        summaryData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: endDateSelected,
          })
        );
      }
      /*if (endDateSelected) {
        var endDateParts = endDateSelected.split("/");
        let endDate = endDateParts[2];
        summaryData.filters.push(
          search.createFilter({
            name: "formulatext",
            operator: search.Operator.IS,
            values: endDate,
            formula: "TO_CHAR({trandate}, 'YYYY')",
          })
        );
      }*/

      var myResultsSummary = getAllResults(summaryData);
      var summaryDataArr = [];
      myResultsSummary.forEach(function (result) {
        let monthD = result.getValue({
          name: "formulatext",
          summary: "GROUP",
          formula: "TO_CHAR({trandate}, 'MM')",
        });
        let yearD = result.getValue({
          name: "formulatext",
          summary: "GROUP",
          formula: "TO_CHAR({trandate}, 'YYYY')",
        });
        let total = result.getValue({
          name: "amount",
          summary: "SUM",
        });
        let billing = result.getValue({
          name: "formulacurrency",
          summary: "SUM",
          formula: "{totalamount}-{taxtotal}",
        });
        let revenue = result.getText({
          name: "line.cseg_abjproj_cust_",
          summary: "GROUP",
        });

        var amntRetainer,
          amntCF,
          amntSF,
          amntMF,
          amntIncentive,
          amntOthers = "";
        switch (revenue) {
          case "Retainer":
            amntRetainer = total;
            break;
          case "Agency Commission/Creative Fee":
            amntCF = total;
            break;
          case "Supervision Fee":
            amntSF = total;
            break;
          case "Media Fee":
            amntMF = total;
            break;
          case "Incentive":
            amntIncentive = total;
            break;

          default:
            amntOthers = total;
            break;
        }
        summaryDataArr.push({
          month: monthD,
          year: yearD,
          total: total,
          billing: billing,
          amntRetainer: amntRetainer || "",
          amntCF: amntCF || "",
          amntSF: amntSF || "",
          amntMF: amntMF || "",
          amntIncentive: amntIncentive || "",
          amntOthers: amntOthers || "",
        });
      });
      const groupedDataSummary = groupByMonthAndYear(summaryDataArr);
      log.debug("summaryDataArr", summaryDataArr);
      log.debug("groupedData", groupedDataSummary);
      var totalBilling = 0,
        totalTotal = 0,
        totalRetainer = 0,
        totalCF = 0,
        totalSf = 0,
        totalMf = 0,
        totalIf = 0,
        totalOthers = 0;

      xmlStr += `
        <Row>
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
        </Row>
        `;
      xmlStr += "<Row ss:Height='20'>" + '<Cell ss:StyleID="HYELLOW" ss:MergeAcross="8" ><Data ss:Type="String">SUMMARY</Data></Cell>' + "</Row>";

      xmlStr += `
        <Row>
            <Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">MONTH</Data></Cell>
            <Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">BILLING</Data></Cell>
            <Cell ss:MergeAcross="6" ss:StyleID="HREVENUE"><Data ss:Type="String">REVENUE</Data></Cell>
        </Row>
        <Row>
            <Cell ss:Index="3" ss:StyleID="HORANGE"><Data ss:Type="String">Total</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Retainer</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Creative Fee</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Supervision Fee</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Media Fee</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Incentive</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Others</Data></Cell>
        </Row>
      `;
      groupedDataSummary.forEach(function (row) {
        xmlStr += `
        <Row>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${getMonthName(row.month) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.billing || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.total || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntCF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntSF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntMF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntIncentive || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntOthers || ""}</Data></Cell>
        </Row>
        `;
        totalBilling += Number(row.billing || 0);
        totalTotal += Number(row.total || 0);
        totalRetainer += Number(row.amntRetainer || 0);
        totalCF += Number(row.amntCF || 0);
        totalSf += Number(row.amntSF || 0);
        totalMf += Number(row.amntMF || 0);
        totalIf += Number(row.amntIncentive || 0);
        totalOthers += Number(row.amntOthers || 0);
      });
      xmlStr += `
      <Row>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="String">TOTAL</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalBilling || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalTotal || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalCF || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalSf || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalMf || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalIf || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalOthers || ""}</Data></Cell>
        </Row>
      `;
      xmlStr += `
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">BUDGET</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">-</Data></Cell>
        </Row>
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">TOTAL JOB</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">-</Data></Cell>
        </Row>
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">BALANCE BUDGET</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">-</Data></Cell>
        </Row>
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">BALANCE TO GO</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">-</Data></Cell>
        </Row>
      `;
      xmlStr += "</Table></Worksheet></Workbook>";

      var strXmlEncoded = encode.convert({
        string: xmlStr,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64,
      });

      var objXlsFile = file.create({
        name: "TRX MONTLY RECONCILE " + fieldLookUpSubsText + " - " + startDateSelected + " s/d " + endDateSelected + " .xls",
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
