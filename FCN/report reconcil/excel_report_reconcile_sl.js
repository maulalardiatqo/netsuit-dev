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
          amntAdditionalCF: 0,
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
      groupedData[key].amntAdditionalCF += parseFloat(entry.amntAdditionalCF || 0);
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
      group.amntAdditionalCF = group.amntAdditionalCF.toFixed(2);
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
        let item = result.getValue('item');
        log.debug('item', item)
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
        var discount = 0;
        let discLine = result.getValue('custcol_abj_disc_line');
        let discBody = result.getValue('discountamount');
        if(discLine && discLine != 0){
          discount = discLine
        }else if(discBody && discBody != 0){
          discount = discBody 
        }
        let revenue = result.getText("line.cseg_abjproj_cust_");
        let amountBefor = result.getValue("amount");
        let amount = Number(amountBefor) - Number(discount)
        if(item == '2880'){
          amount = 0
        }
        var amntRetainer,
          amntCF,
          amntSF,
          amntMF,
          amntIncentive,
          amntAdditionalCF,
          amntOthers = "";
          // selain 6 masuk ke others
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
          case "3rd Party Production":
            amntIncentive = amount;
            break;
          case "Additional Creative Fee":
            amntAdditionalCF = amount;
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
          amntAdditionalCF : amntAdditionalCF || "",
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
        let item = result.getValue('item');
        log.debug('item', item)
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
        var discount = 0;
        let discLine = result.getValue('custcol_abj_disc_line');
        let discBody = result.getValue('discountamount');
        if(discLine && discLine != 0){
          discount = discLine
        }else if(discBody && discBody != 0){
          discount = discBody 
        }
        let amountBefor = result.getValue("amount");
        let amount = Number(amountBefor) - Number(discount)
        log.debug('penjumlahan', {amount : amount, amountBefor : amountBefor, discount : discount});
        if(item == '2880'){
          amount = 0
        }
        var amntRetainer,
          amntCF,
          amntSF,
          amntMF,
          amntIncentive,
          amntAdditionalCF,
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
          case "3rd Party Production":
            amntIncentive = amount;
            break;
          case "Additional Creative Fee":
            amntAdditionalCF = amount;
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
          amntAdditionalCF : amntAdditionalCF || "",
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
      const groupedPendingBillArray = pendingBillDataArr.reduce((acc, curr) => {
        const index = acc.findIndex((item) => item.quoteNumberVal === curr.quoteNumberVal);
        if (index !== -1) {
          const accQty = parseInt(acc[index].qty) || 0;
          const currQty = parseInt(curr.qty) || 0;
          acc[index].qty = (accQty + currQty).toString();
          acc[index].amntRetainer = ((parseFloat(acc[index].amntRetainer) || 0) + (parseFloat(curr.amntRetainer) || 0)).toFixed(2);
          acc[index].amntCF = ((parseFloat(acc[index].amntCF) || 0) + (parseFloat(curr.amntCF) || 0)).toFixed(2);
          acc[index].amntSF = ((parseFloat(acc[index].amntSF) || 0) + (parseFloat(curr.amntSF) || 0)).toFixed(2);
          acc[index].amntMF = ((parseFloat(acc[index].amntMF) || 0) + (parseFloat(curr.amntMF) || 0)).toFixed(2);
          acc[index].amntIncentive = ((parseFloat(acc[index].amntIncentive) || 0) + (parseFloat(curr.amntIncentive) || 0)).toFixed(2);
          acc[index].amntAdditionalCF = ((parseFloat(acc[index].amntAdditionalCF) || 0) + (parseFloat(curr.amntAdditionalCF) || 0)).toFixed(2);
          acc[index].amntOthers = ((parseFloat(acc[index].amntOthers) || 0) + (parseFloat(curr.amntOthers) || 0)).toFixed(2);
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
      const groupedJobDoneArray = jobDoneDataArr.reduce((acc, curr) => {
        const index = acc.findIndex((item) => item.quoteNumberVal === curr.quoteNumberVal);
        if (index !== -1) {
          const accQty = parseInt(acc[index].qty) || 0;
          const currQty = parseInt(curr.qty) || 0;
          acc[index].qty = (accQty + currQty).toString();
          acc[index].amntRetainer = ((parseFloat(acc[index].amntRetainer) || 0) + (parseFloat(curr.amntRetainer) || 0)).toFixed(2);
          acc[index].amntCF = ((parseFloat(acc[index].amntCF) || 0) + (parseFloat(curr.amntCF) || 0)).toFixed(2);
          acc[index].amntSF = ((parseFloat(acc[index].amntSF) || 0) + (parseFloat(curr.amntSF) || 0)).toFixed(2);
          acc[index].amntMF = ((parseFloat(acc[index].amntMF) || 0) + (parseFloat(curr.amntMF) || 0)).toFixed(2);
          acc[index].amntIncentive = ((parseFloat(acc[index].amntIncentive) || 0) + (parseFloat(curr.amntIncentive) || 0)).toFixed(2);
          acc[index].amntAdditionalCF = ((parseFloat(acc[index].amntAdditionalCF) || 0) + (parseFloat(curr.amntAdditionalCF) || 0)).toFixed(2);
          acc[index].amntOthers = ((parseFloat(acc[index].amntOthers) || 0) + (parseFloat(curr.amntOthers) || 0)).toFixed(2);
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
      let mergedPendingBillArray = [];
      groupedPendingBillArray.forEach((pendingBillItem) => {
        let matchingPOs = poDataArr.filter((poItem) => {
          var nomorPO = poItem.poNo
          
          
          return poItem.quoteNumberVal === pendingBillItem.quoteNumberVal && poItem.projectVal === pendingBillItem.projectVal && poItem.deliverablesVal === pendingBillItem.deliverablesVal;
        });
        if (matchingPOs.length > 0) {
          matchingPOs.forEach((matchingPO) => {
            let mergedItem = {
              ...pendingBillItem,
              poNo: matchingPO.poNo || "",
              vendorName: matchingPO.vendorName || "",
              amountPo: matchingPO.amountPo || "",
              total: matchingPO.total || "",
              remarks: matchingPO.remarks || "",
              paymentStatus: matchingPO.paymentStatus || "",
            };
            mergedPendingBillArray.push(mergedItem);
          });
        } else {
          let mergedItem = {
            ...pendingBillItem,
            poNo: "",
            vendorName: "",
            amountPo: "",
            total: "",
            remarks: "",
            paymentStatus: "",
          };
          mergedPendingBillArray.push(mergedItem);
        }
      });

      let mergedJobDoneArray = [];
      groupedJobDoneArray.forEach((jobDoneItem) => {
        let matchingPOs = poDataArr.filter((poItem) => {
          return poItem.quoteNumberVal === jobDoneItem.quoteNumberVal && poItem.projectVal === jobDoneItem.projectVal && poItem.deliverablesVal === jobDoneItem.deliverablesVal;
        });
        if (matchingPOs.length > 0) {
          matchingPOs.forEach((matchingPO) => {
            let mergedItem = {
              ...jobDoneItem,
              poNo: matchingPO.poNo || "",
              vendorName: matchingPO.vendorName || "",
              amountPo: matchingPO.amountPo || "",
              total: matchingPO.total || "",
              remarks: matchingPO.remarks || "",
              paymentStatus: matchingPO.paymentStatus || "",
            };
            mergedJobDoneArray.push(mergedItem);
          });
        } else {
          let mergedItem = {
            ...jobDoneItem,
            poNo: "",
            vendorName: "",
            amountPo: "",
            total: "",
            remarks: "",
            paymentStatus: "",
          };
          mergedJobDoneArray.push(mergedItem);
        }
      });
      var totalWIPBilling = 0,
        totalWIPTotal = 0,
        totalWIIPRetainer = 0,
        totalWIPCF = 0,
        totalWIPSf = 0,
        totalWIPMf = 0,
        totalWIPIf = 0,
        totalWIPadditionalCF = 0,
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
          "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='500' />" +
          "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='200' />" +
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
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">SO Number</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Job No</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Status</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">PIC</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Qty</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HGREY"><Data ss:Type="String">Invoice Number</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">BILLING&#10;(BEFORE VAT)</Data></Cell>' +
          '<Cell ss:MergeAcross="7" ss:StyleID="HREVENUE"><Data ss:Type="String">REVENUE</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">Payment Status</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">PO NO</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">VENDOR NAME</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">AMOUNT ( EXC VAT )</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">TOTAL</Data></Cell>' +
          '<Cell ss:MergeDown="1" ss:StyleID="HBLUE"><Data ss:Type="String">REMARKS</Data></Cell>' +
          "</Row>" +
          "<Row ss:Index='6' ss:Height='20'>" +
          '<Cell ss:Index="8" ss:StyleID="HTOTAL"><Data ss:Type="String">TOTAL</Data></Cell>' +
          '<Cell ss:Index="9" ss:StyleID="HORANGE"><Data ss:Type="String">Retainer</Data></Cell>' +
          '<Cell ss:Index="10" ss:StyleID="HORANGE"><Data ss:Type="String">Agency Commission/Creative Fee</Data></Cell>' +
          '<Cell ss:Index="11" ss:StyleID="HORANGE"><Data ss:Type="String">Supervision Fee</Data></Cell>' +
          '<Cell ss:Index="12" ss:StyleID="HORANGE"><Data ss:Type="String">Media Fee</Data></Cell>' +
          '<Cell ss:Index="13" ss:StyleID="HORANGE"><Data ss:Type="String">3rd Party Production</Data></Cell>' +
          '<Cell ss:Index="14" ss:StyleID="HORANGE"><Data ss:Type="String">Additional Creative Fee</Data></Cell>' +
          '<Cell ss:Index="15" ss:StyleID="HORANGE"><Data ss:Type="String">Others</Data></Cell>' +
          "</Row>" +
          "<Row ss:Index='7' ss:Height='20'>" +
          '<Cell ss:StyleID="HPENDING" ss:MergeAcross="20" ><Data ss:Type="String">WORK IN PROGRESS</Data></Cell>' +
          "</Row>";
        mergedPendingBillArray.forEach((row) => {
          var totalRev = Number(row.billingBeforeVat || 0) - Number(row.total || 0);
          xmlStr += `
          <Row>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.quoteNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.jobNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.status || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.pic || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.qty || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.invoiceNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.billingBeforeVat || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${totalRev || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntRetainer || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntCF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntSF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntMF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntIncentive || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntAdditionalCF || ""}</Data></Cell>
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
          totalWIPadditionalCF += Number(row.amntAdditionalCF);
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
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPBilling || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPTotal || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIIPRetainer || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPCF || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPSf || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPMf || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPIf || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPadditionalCF || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"><Data ss:Type="Number">${totalWIPOthers || ""}</Data></Cell>
          <Cell ss:StyleID="HTOTALWIP"/>
          <Cell ss:StyleID="HTOTALWIP"/>
          <Cell ss:StyleID="HTOTALWIP"/>
          <Cell ss:StyleID="HTOTALWIP"/>
          <Cell ss:StyleID="HTOTALWIP"/>
          <Cell ss:StyleID="HTOTALWIP"/>
          </Row>
        `;
        xmlStr += "<Row>" + '<Cell ss:StyleID="HJOBDONE" ss:MergeAcross="20" ><Data ss:Type="String">JOB DONE</Data></Cell>' + "</Row>";
        mergedJobDoneArray.forEach((row) => {
          var totalRev = Number(row.billingBeforeVat || 0) - Number(row.total || 0);
          xmlStr += `
          <Row>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.quoteNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.jobNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.status || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.pic || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.qty || ""}</Data></Cell>
          <Cell ss:StyleID="NB"><Data ss:Type="String">${row.invoiceNumber || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.billingBeforeVat || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${totalRev || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntRetainer || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntCF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntSF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntMF || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntIncentive || ""}</Data></Cell>
          <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.amntAdditionalCF || ""}</Data></Cell>
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

        var newSummaryData = search.load({
          id: "customsearch807",
        });
        
        newSummaryData.filters.push(
            search.createFilter({
                name: "subsidiary",
                operator: search.Operator.IS,
                values: subsidiarySelected,
            })
        );
        
        if (subsidiarySelected) {
            newSummaryData.filters.push(
                search.createFilter({
                    name: "subsidiary",
                    operator: search.Operator.IS,
                    values: subsidiarySelected,
                })
            );
        }
        
        if (customerSelected) {
            newSummaryData.filters.push(
                search.createFilter({
                    name: "entity",
                    operator: search.Operator.IS,
                    values: customerSelected,
                })
            );
        }
        if (startDateSelected && endDateSelected) {
            newSummaryData.filters.push(
                search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORAFTER,
                    values: startDateSelected,
                })
            );
            newSummaryData.filters.push(
                search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORBEFORE,
                    values: endDateSelected,
                })
            );
        }
        
        var ResultnewSummaryData = getAllResults(newSummaryData);
        var newsummaryDataArr = [];
        
        function getMonthAndYearFromDate(dateString) {
            var dateParts = dateString.split('/');
            var day = dateParts[0];
            var month = dateParts[1];
            var year = dateParts[2];
            return { month: month, year: year };
        }
        
        var rawData = [];
        var uniqueIds = new Set();
        
        ResultnewSummaryData.forEach(function (result) {
            let quoteNumberVal = result.getValue("internalid");
            let projectVal = result.getValue("class");
            let deliverablesVal = result.getValue("line.cseg_abjproj_cust_");
            let item = result.getValue('item');
            let idTran = result.getValue('internalid');
            let trandate = result.getValue("trandate");
            let { month, year } = getMonthAndYearFromDate(trandate);
            let billingBeforeVat = parseFloat(result.getValue({
                name: "formulacurrency",
                formula: "{totalamount}-{taxtotal}",
            })) || 0;
            let revenue = result.getText("line.cseg_abjproj_cust_");
            var discount = 0;
            let discLine = result.getValue('custcol_abj_disc_line');
            let discBody = result.getValue('discountamount');
            if (discLine && discLine != 0) {
                discount = discLine;
            } else if (discBody && discBody != 0) {
                discount = discBody;
            }
            let amountBefor = result.getValue("amount");
            let amount = Number(amountBefor) - Number(discount);
            if(item == '2880'){
                amount = 0;
            }
            
            var amntRetainer = 0,
                amntCF = 0,
                amntSF = 0,
                amntMF = 0,
                amntIncentive = 0,
                amntAdditionalCF = 0,
                amntOthers = 0;
        
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
                case "3rd Party Production":
                    amntIncentive = amount;
                    break;
                case "Additional Creative Fee":
                    amntAdditionalCF = amount;
                    break;
                default:
                    amntOthers = amount;
                    break;
            }
            
            rawData.push({
                quoteNumberVal,
                projectVal,
                deliverablesVal,
                idTran,
                month,
                year,
                billingBeforeVat,
                amount,
                amntRetainer,
                amntCF,
                amntSF,
                amntMF,
                amntIncentive,
                amntAdditionalCF,
                amntOthers
            });
        });
        const groupedSummary = rawData.reduce((acc, curr) => {
          const index = acc.findIndex((item) => item.quoteNumberVal === curr.quoteNumberVal);
          if (index !== -1) {
            const accQty = parseInt(acc[index].qty) || 0;
            const currQty = parseInt(curr.qty) || 0;
            acc[index].qty = (accQty + currQty).toString();
            acc[index].amntRetainer = ((parseFloat(acc[index].amntRetainer) || 0) + (parseFloat(curr.amntRetainer) || 0)).toFixed(2);
            acc[index].amntCF = ((parseFloat(acc[index].amntCF) || 0) + (parseFloat(curr.amntCF) || 0)).toFixed(2);
            acc[index].amntSF = ((parseFloat(acc[index].amntSF) || 0) + (parseFloat(curr.amntSF) || 0)).toFixed(2);
            acc[index].amntMF = ((parseFloat(acc[index].amntMF) || 0) + (parseFloat(curr.amntMF) || 0)).toFixed(2);
            acc[index].amntIncentive = ((parseFloat(acc[index].amntIncentive) || 0) + (parseFloat(curr.amntIncentive) || 0)).toFixed(2);
            acc[index].amntAdditionalCF = ((parseFloat(acc[index].amntAdditionalCF) || 0) + (parseFloat(curr.amntAdditionalCF) || 0)).toFixed(2);
            acc[index].amntOthers = ((parseFloat(acc[index].amntOthers) || 0) + (parseFloat(curr.amntOthers) || 0)).toFixed(2);
          } else {
            acc.push(curr);
          }
          return acc;
        }, []);
  
        let mergedSummaryData = [];
        groupedSummary.forEach((jobDoneItem) => {
            let matchingPOs = poDataArr.filter((poItem) => {
                return poItem.quoteNumberVal === jobDoneItem.quoteNumberVal && poItem.projectVal === jobDoneItem.projectVal && poItem.deliverablesVal === jobDoneItem.deliverablesVal;
            });
            if (matchingPOs.length > 0) {
                matchingPOs.forEach((matchingPO) => {
                    let mergedItem = {
                        ...jobDoneItem,
                        poNo: matchingPO.poNo || "",
                        vendorName: matchingPO.vendorName || "",
                        amountPo: matchingPO.amountPo || "",
                        total: matchingPO.total || "",
                        remarks: matchingPO.remarks || "",
                        paymentStatus: matchingPO.paymentStatus || "",
                        totalRev: (jobDoneItem.billingBeforeVat - (matchingPO.amountPo ? parseFloat(matchingPO.amountPo) : 0)).toFixed(2)
                    };
                    mergedSummaryData.push(mergedItem);
                });
            } else {
                let mergedItem = {
                    ...jobDoneItem,
                    poNo: "",
                    vendorName: "",
                    amountPo: "",
                    total: "",
                    remarks: "",
                    paymentStatus: "",
                    totalRev: (jobDoneItem.billingBeforeVat - 0).toFixed(2)
                };
                mergedSummaryData.push(mergedItem);
            }
        });
        log.debug('mergedSummaryData', mergedSummaryData)
   
        var groupedData = {};
        mergedSummaryData.forEach(function (data) {
            let key = data.year + '-' + data.month;
            if (!groupedData[key]) {
                groupedData[key] = {
                    month: data.month,
                    year: data.year,
                    totalBillingBeforeVat: 0,
                    totalAmountBill: 0,
                    totalAmntRetainer: 0,
                    totalAmntCF: 0,
                    totalAmntSF: 0,
                    totalAmntMF: 0,
                    totalAmntIncentive: 0,
                    totalAmntAdditionalCF: 0,
                    totalAmntOthers: 0,
                    totalCostOfBilling: 0,
                    totalUse: 0
                };
            }
        
            if (!uniqueIds.has(data.idTran)) {
                groupedData[key].totalBillingBeforeVat += Number(data.billingBeforeVat);
                groupedData[key].totalUse += Number(data.totalRev);
                uniqueIds.add(data.idTran);
            }
        
            groupedData[key].totalAmountBill += Number(data.amount);
            groupedData[key].totalAmntRetainer += Number(data.amntRetainer);
            groupedData[key].totalAmntCF += Number(data.amntCF);
            groupedData[key].totalAmntSF += Number(data.amntSF);
            groupedData[key].totalAmntMF += Number(data.amntMF);
            groupedData[key].totalAmntIncentive += Number(data.amntIncentive);
            groupedData[key].totalAmntAdditionalCF += Number(data.amntAdditionalCF);
            groupedData[key].totalAmntOthers += Number(data.amntOthers);
            groupedData[key].totalCostOfBilling += Number(data.amount);
            
        });
        log.debug('groupedData', groupedData)
        var newsummaryDataArr = [];
        for (var key in groupedData) {
            newsummaryDataArr.push({
                month: groupedData[key].month,
                year: groupedData[key].year,
                totalBillingBeforeVat: groupedData[key].totalBillingBeforeVat,
                totalAmountBill: groupedData[key].totalBillingBeforeVat,
                totalAmntRetainer: groupedData[key].totalAmntRetainer,
                totalAmntCF: groupedData[key].totalAmntCF,
                totalAmntSF: groupedData[key].totalAmntSF,
                totalAmntMF: groupedData[key].totalAmntMF,
                totalAmntIncentive: groupedData[key].totalAmntIncentive,
                totalAmntAdditionalCF: groupedData[key].totalAmntAdditionalCF,
                totalAmntOthers: groupedData[key].totalAmntOthers,
                totalCostOfBilling: groupedData[key].totalCostOfBilling,
                totalUse: groupedData[key].totalUse
            });
        }
      
        const groupedNewSummaryData = newsummaryDataArr;
        var totalBilling = 0,
            totalTotal = 0,
            totalRetainer = 0,
            totalCF = 0,
            totalSf = 0,
            totalMf = 0,
            totalIf = 0,
            totalAdditionalFC = 0,
            totalOthers = 0;
        var startDate = new Date(startDateSelected.split('/').reverse().join('-'));
        var endDate = new Date(endDateSelected.split('/').reverse().join('-'));
        var filterYear = endDate.getFullYear().toString();
        
        function getMonthName(month) {
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return monthNames[month - 1];
        }
        
        function getMonthsInRange(startDate, endDate) {
            var months = [];
            var currentDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
        
            while (currentDate <= endDate) {
                var month = ('0' + (currentDate.getUTCMonth() + 1)).slice(-2);
                var year = currentDate.getUTCFullYear().toString();
        
                months.push({
                    month: month,
                    year: year
                });
                currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                if (currentDate > endDate) {
                    break;
                }
            }
        
            return months;
        }
        
        var monthsInRange = getMonthsInRange(startDate, endDate);
        var filledGroupedDataSummary = monthsInRange.map(function (monthInfo) {
            var existingData = groupedNewSummaryData.find(function (row) {
                return row.month === monthInfo.month && row.year === monthInfo.year;
            });
        
            if (existingData) {
                return existingData;
            } else {
                return {
                    month: monthInfo.month,
                    year: monthInfo.year,
                    totalAmountBill: 0,
                    totalAmntRetainer: 0,
                    totalAmntCF: 0,
                    totalAmntSF: 0,
                    totalAmntMF: 0,
                    totalAmntIncentive: 0,
                    totalAmntAdditionalCF: 0,
                    totalAmntOthers: 0
                };
            }
        });
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
      xmlStr += "<Row ss:Height='20'>" + '<Cell ss:StyleID="HYELLOW" ss:MergeAcross="9" ><Data ss:Type="String">SUMMARY</Data></Cell>' + "</Row>";

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
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">3rd Party Production</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Additional Creative Fee</Data></Cell>
            <Cell ss:StyleID="HORANGE"><Data ss:Type="String">Others</Data></Cell>
        </Row>
      `;
      filledGroupedDataSummary.forEach(function (row) {
        xmlStr += `
        <Row>
        <Cell ss:StyleID="NB"><Data ss:Type="String">${getMonthName(parseInt(row.month)) || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalBillingBeforeVat || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalUse || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntRetainer || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntCF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntSF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntMF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntIncentive || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntAdditionalCF || ""}</Data></Cell>
        <Cell ss:StyleID="NBN"><Data ss:Type="Number">${row.totalAmntOthers || ""}</Data></Cell>
        </Row>
        `;
        totalBilling += Number(row.totalBillingBeforeVat || 0);
        totalTotal += Number(row.totalUse || 0);
        totalRetainer += Number(row.totalAmntRetainer || 0);
        totalCF += Number(row.totalAmntCF || 0);
        totalSf += Number(row.totalAmntSF || 0);
        totalMf += Number(row.totalAmntMF || 0);
        totalIf += Number(row.totalAmntIncentive || 0);
        totalAdditionalFC += Number(row.totalAmntAdditionalCF || 0);
        totalOthers += Number(row.totalAmntOthers || 0);
      });

      var periodName = 'FY ' + filterYear;
      var periodSearch = search.create({
          type: "accountingperiod",
          filters: [
              ["periodname", "is", periodName]
          ],
          columns: ["internalid"]
      });

      var periodId;
      periodSearch.run().each(function(result) {
          periodId = result.getValue({ name: 'internalid' });
          return false;
      });
      // budget
      var sales = search.load({
        id: "customsearch808",
      });
      if(subsidiarySelected){
          sales.filters.push(
            search.createFilter({
                name: "subsidiary",
                operator: search.Operator.IS,
                values: subsidiarySelected,
            })
        );
      }
      if(periodId){
          sales.filters.push(
            search.createFilter({
                name: "year",
                operator: search.Operator.IS,
                values: periodId,
            })
        );
      }
      var resultSales = getAllResults(sales);
      var salesData = 0;
      resultSales.forEach(function (result) {
          let amount = result.getValue({
            name: "amount",
            summary: "SUM"
          });
          salesData = amount || 0;
      });

      var costOfSales = search.load({
        id: "customsearch809",
      });
      if(subsidiarySelected){
        costOfSales.filters.push(
            search.createFilter({
                name: "subsidiary",
                operator: search.Operator.IS,
                values: subsidiarySelected,
            })
        );
      }
      if(periodId){
        costOfSales.filters.push(
            search.createFilter({
                name: "year",
                operator: search.Operator.IS,
                values: periodId,
            })
        );
      }
      var resultcostOfSales = getAllResults(costOfSales);
      var costOfSalesData = 0;
      resultcostOfSales.forEach(function (result) {
          let amount = result.getValue({
            name: "amount",
            summary: "SUM"
          });
          costOfSalesData = amount || 0;
      });
      
      var budgetYear = Number(salesData) - Number(costOfSalesData);
      var balanceToGO = Number(budgetYear) - Number(totalTotal)

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
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalAdditionalFC || ""}</Data></Cell>
        <Cell ss:StyleID="MONTHTOTAL"><Data ss:Type="Number">${totalOthers || ""}</Data></Cell>
        </Row>
      `;
      xmlStr += `
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">BUDGET</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="Number">${budgetYear}</Data></Cell>
        </Row>
        <Row>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="String">BALANCE TO GO</Data></Cell>
            <Cell ss:StyleID="BUDGET"><Data ss:Type="Number">${balanceToGO}</Data></Cell>
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
