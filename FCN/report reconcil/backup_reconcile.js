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
        groupedData[key].amntIncentive += parseFloat(entry.amntAdditionalCF || 0);
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
      var qContent = "";
      var jContent = "";
      var sContent = "";
      var dContent = "";
      var fldTable;
      var FLDGRP_TABLE = "custpage_rp_fldgrp_table";
      var form = serverWidget.createForm({
        title: "Report Reconcile",
      });
      form.addFieldGroup({
        id: "filteroption",
        label: "FILTERS",
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
  
      var customerField = form.addField({
        id: "custpage_f_customer",
        label: "CUSTOMER",
        type: serverWidget.FieldType.SELECT,
        source: "customer",
        container: "filteroption",
      });
  
      var startDate = form.addField({
        id: "custpage_f_start_date",
        label: "DATE FROM",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
      startDate.defaultValue = startMtd;
  
      var endDate = form.addField({
        id: "custpage_f_end_date",
        label: "DATE TO",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
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
      form.clientScriptModulePath = "SuiteScripts/report_reconcile_cs.js";
      if (contextRequest.method == "GET") {
        context.response.writePage(form);
      } else {
        var subsidiarySelected = contextRequest.parameters.custpage_f_subsidiary;
        var startDateSelected = contextRequest.parameters.custpage_f_start_date;
        var endDateSelected = contextRequest.parameters.custpage_f_end_date;
        var customerSelected = contextRequest.parameters.custpage_f_customer;
        subsidiaryField.defaultValue = subsidiarySelected;
        if (customerSelected) {
          customerField.defaultValue = customerSelected;
        }
        startDate.defaultValue = startDateSelected;
        endDate.defaultValue = endDateSelected;
        log.debug("dataFilter", {
          subsidiarySelected: subsidiarySelected,
          customerSelected: customerSelected,
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
        log.debug("pendingBillDataArr", pendingBillDataArr);
  
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
        log.debug('myResultsPO length', myResultsPO.length)
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
        log.debug("poDataArr", poDataArr);
  
        const groupedPendingBillArray = pendingBillDataArr.reduce((acc, curr) => {
          const index = acc.findIndex((item) => item.quoteNumberVal === curr.quoteNumberVal);
          if (index !== -1) {
            log.debug('index', index)
            const accQty = parseInt(acc[index].qty) || 0;
            const currQty = parseInt(curr.qty) || 0;
            acc[index].qty = (accQty + currQty).toString();
            log.debug('curr.qty', curr.qty);
            log.debug('acc[index].qty', acc[index].qty)
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
        log.debug('groupedPendingBillArray debug', groupedPendingBillArray)
        let mergedPendingBillArray = [];
        groupedPendingBillArray.forEach((pendingBillItem) => {
          let matchingPOs = poDataArr.filter((poItem) => {
            var nomorPO = poItem.poNo
            if(nomorPO == "FCN PO2405001"){
              log.debug('nomorPO', nomorPO)
              log.debug('poItem.quoteNumberVal', poItem.quoteNumberVal)
              log.debug('pendingBillItem.quoteNumberVal', pendingBillItem.quoteNumberVal)
              log.debug('pendingBillItem.projectVal', pendingBillItem.projectVal)
              log.debug('poItem.projectVal', poItem.projectVal)
              log.debug('poItem.deliverablesVal', poItem.deliverablesVal)
              log.debug('pendingBillItem.deliverablesVal', pendingBillItem.deliverablesVal)
            }
            
            return poItem.quoteNumberVal === pendingBillItem.quoteNumberVal && poItem.projectVal === pendingBillItem.projectVal && poItem.deliverablesVal === pendingBillItem.deliverablesVal;
          });
          log.debug('matchingPOs', matchingPOs)
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
        log.debug("dataa", mergedPendingBillArray);
  
        let mergedJobDoneArray = [];
        jobDoneDataArr.forEach((jobDoneItem) => {
          // Find matching entry in poDataArr
          let matchingPOs = poDataArr.filter((poItem) => {
            
            return poItem.quoteNumberVal === jobDoneItem.quoteNumberVal && poItem.projectVal === jobDoneItem.projectVal && poItem.deliverablesVal === jobDoneItem.deliverablesVal;
          });
          if (matchingPOs.length > 0) {
            matchingPOs.forEach((matchingPO) => {
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
          totalWIPOthers = 0,
          previousTotalRev = 0,
          previousTotalRevJD = 0;
  
        const updatedArrayMergedPendingBill = [];
        let previousQuoteNumberVal = null;
        let quoteNumberValTotals = {};
  
        mergedPendingBillArray.forEach((row) => {
          if (!quoteNumberValTotals[row.quoteNumberVal]) {
            quoteNumberValTotals[row.quoteNumberVal] = 0;
          }
          quoteNumberValTotals[row.quoteNumberVal] += Number(row.total || 0);
        });
  
        mergedPendingBillArray.forEach((row) => {
          if (row.quoteNumberVal !== previousQuoteNumberVal) {
            const totalRev = Number(row.billingBeforeVat) - quoteNumberValTotals[row.quoteNumberVal];
            row.totalRev = totalRev;
            previousQuoteNumberVal = row.quoteNumberVal;
          } else {
            row.totalRev = "";
          }
  
          updatedArrayMergedPendingBill.push(row);
        });
  
        updatedArrayMergedPendingBill.forEach((row, index) => {
          var totalRev = Number(row.totalRev);
          if (index !== 0 && row.quoteNumberVal === updatedArrayMergedPendingBill[index - 1].quoteNumberVal) {
            totalRev = "";
            row.quoteNumber = "";
            row.jobNumber = "";
            row.project = "";
            row.status = "";
            row.pic = "";
            row.deliverables = "";
            row.qty = "";
            row.invoiceNumber = "";
            row.amntRetainer = "";
            row.amntCF = "";  
            row.amntSF = "";
            row.amntMF = "";
            row.amntIncentive = "";
            row.amntAdditionalCF = "";
            row.amntOthers = "";
            row.billingBeforeVat = "";
          }
          log.debug('row.qty', row.qty)
          qContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
          qContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + row.quoteNumberVal + '&whence=" target="_blank" >' + row.quoteNumber || "" + "</a></td>";
          qContent += '            <td class="uir-list-row-cell">' + row.jobNumber || "" + "</td>";
          // qContent += '            <td class="uir-list-row-cell">' + row.project || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.status || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.pic || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.deliverables || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.qty || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=' + row.invoiceNumberVal + '&whence=" target="_blank">' + row.invoiceNumber || "" + "</a></td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + (row.billingBeforeVat ? numberWithCommas(row.billingBeforeVat) : "") + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right; background: #f4b083 !important;">' + numberWithCommas(totalRev) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntRetainer) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntCF) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntSF) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntMF) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntIncentive) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntAdditionalCF) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntOthers) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.paymentStatus || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.poNo || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.vendorName || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amountPo) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.total) || "" + "</td>";
          qContent += '            <td class="uir-list-row-cell">' + row.remarks || "" + "</td>";
          qContent += "        </tr>";
          totalWIPBilling += row.quoteNumberVal !== mergedPendingBillArray[index - 1]?.quoteNumberVal ? Number(row.billingBeforeVat || 0) : 0;
          totalWIPTotal += totalRev || 0;
          totalWIIPRetainer += Number(row.amntRetainer || 0);
          totalWIPCF += Number(row.amntCF || 0);
          totalWIPSf += Number(row.amntSF || 0);
          totalWIPMf += Number(row.amntMF || 0);
          totalWIPIf += Number(row.amntIncentive || 0);
          totalWIPadditionalCF += Number(row.amntAdditionalCF || 0);
          totalWIPOthers += Number(row.amntOthers || 0);
        });
        mergedJobDoneArray.forEach((row, index) => {
          var totalRev = Number(row.billingBeforeVat || 0) - Number(row.total || 0);
          if (index !== 0 && row.quoteNumberVal === mergedJobDoneArray[index - 1].quoteNumberVal) {
            row.billingBeforeVat = "";
            totalRev = Number(previousTotalRev) - Number(row.total || 0);
          }
          jContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
          jContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + row.quoteNumberVal + '&whence=" target="_blank" >' + row.quoteNumber || "" + "</a></td>";
          jContent += '            <td class="uir-list-row-cell">' + row.jobNumber || "" + "</td>";
          // jContent += '            <td class="uir-list-row-cell">' + row.project || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.status || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.pic || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.deliverables || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.qty || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=' + row.invoiceNumberVal + '&whence=" target="_blank">' + row.invoiceNumber || "" + "</a></td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + (row.billingBeforeVat ? numberWithCommas(row.billingBeforeVat) : "") + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right; background: #f4b083 !important;">' + numberWithCommas(totalRev) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntRetainer) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntCF) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntSF) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntMF) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntIncentive) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntAdditionalCF) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntOthers) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.paymentStatus || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.poNo || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.vendorName || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amountPo) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.total) || "" + "</td>";
          jContent += '            <td class="uir-list-row-cell">' + row.remarks || "" + "</td>";
          jContent += "        </tr>";
          previousTotalRevJD = totalRev;
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
            amntAdditionalCF,
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
            case "3rd Party Production":
              amntIncentive = total;
              break;
            case "Additional Creative Fee":
              amntAdditionalCF = amount;
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
            amntAdditionalCF : amntAdditionalCF || "",
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
          totalAdditionalFC = 0,
          totalOthers = 0;
        groupedDataSummary.forEach(function (row) {
          dContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
          dContent += '            <td class="uir-list-row-cell">' + getMonthName(row.month) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.billing) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.total) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntRetainer) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntCF) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntSF) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntMF) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntIncentive) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntAdditionalCF) || "" + "</td>";
          dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntOthers) || "" + "</td>";
          dContent += "        </tr>";
          totalBilling += Number(row.billing || 0);
          totalTotal += Number(row.total || 0);
          totalRetainer += Number(row.amntRetainer || 0);
          totalCF += Number(row.amntCF || 0);
          totalSf += Number(row.amntSF || 0);
          totalMf += Number(row.amntMF || 0);
          totalIf += Number(row.amntIncentive || 0);
          totalAdditionalFC += Number(row.amntAdditionalCF || 0)
          totalOthers += Number(row.amntOthers || 0);
        });
        // end summary data
        fldTable = form.addField({
          id: "custpage_htmlfield",
          type: serverWidget.FieldType.INLINEHTML,
          label: "HTML Image",
          container: FLDGRP_TABLE,
        });
        sContent += "    <table>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th colspan="8" class="uir-list-header-td" style="text-align: center;font-weight: bold;"></th>';
        sContent += '            <th colspan="8" class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ed7c39 !important;">REVENUE</th>';
        sContent += '            <th colspan="6" class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #45a147 !important;">COST OF BILLING</th>';
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th colspan="23" class="uir-list-header-td" style="text-align: left;font-weight: bold; background-color: #8eaadc !important">WORK IN PROGRESS</th>';
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">SO NUMBER</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">JOB NO</th>';
        // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">PROJECT</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">STATUS</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">PIC</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">DELIVERABLES</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">QTY</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">INVOICE NUMBER</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">BILLING<br/>(BEFORE VAT)</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #c65b2c !important;">TOTAL</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Retainer</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Agency<br/>Commission/Creative<br/>Fee</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Supervision Fee</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Media Fee</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">3rd Party Production</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Additional Creative Fee</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Others</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">Payment Status</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">PO NO</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">VENDOR NAME</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">AMOUNT ( EXC VAT )</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">TOTAL</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">REMARKS</th>';
        sContent += "        </tr>";
        sContent += qContent;
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;">TOTAL WIP</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPBilling) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPTotal) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIIPRetainer) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPCF) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPSf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPMf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPIf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalAdditionalFC) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPOthers) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th colspan="22" class="uir-list-header-td" style="text-align: left;font-weight: bold; background: #a8d18d !important;">JOB DONE</th>';
        sContent += "        </tr>";
        sContent += jContent;
        sContent += "    </table>";
        sContent += "    <br><br>";
        sContent += "    <table>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th colspan="10" class="uir-list-header-td" style="text-align: left;font-weight: bold;">SUMMARY</th>';
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">MONTH</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">BILLING</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">TOTAL</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">RETAINER</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">CREATIVE FEE</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">SUPERVISION FEE</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">MEDIA FEE</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">3rd Party Production</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Additional Creative Fee</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">OTHERS</th>';
        sContent += "        </tr>";
        sContent += dContent;
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #d5a6bd !important;">TOTAL</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalBilling) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalTotal) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalRetainer) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalCF) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalSf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalMf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalIf) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalAdditionalFC) + "</th>";
        sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + numberWithCommas(totalOthers) + "</th>";
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">BUDGET</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">-</th>';
        sContent += "        </tr>";
        sContent += '        <tr class="uir-list-headerrow">';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">BALANCE TO GO</th>';
        sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">-</th>';
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
  