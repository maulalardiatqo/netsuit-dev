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
          //added by kurnia
          amntServF: 0,
          //
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
      //added by kurnia
      groupedData[key].amntServF += parseFloat(entry.amnServF || 0);
      //
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
      //added by kurnia
      group.amntServF = group.amntServF.toFixed(2);
      //
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
      // log.debug("dataFilter", {
      //   subsidiarySelected: subsidiarySelected,
      //   customerSelected: customerSelected,
      //   startDateSelected: startDateSelected,
      //   endDateSelected: endDateSelected,
      // });
      var userObj = runtime.getCurrentUser();
      var userRole = userObj.role;
      // log.debug('userRole', userRole)
        var roleRecord = record.load({
            type: 'role',
            id: userRole,
        });
      var selectedSubsidiary = roleRecord.getValue('subsidiaryoption');
      // log.debug('selectedSubsidiary', selectedSubsidiary)
      var subsRestrection = roleRecord.getValue('subsidiaryrestriction');
      // log.debug('subsRestrection', subsRestrection)
      var isProcessed = true;
      if(selectedSubsidiary != 'ALL'){
          log.debug('tidak sama dengan all')
          if (!subsRestrection.includes(subsidiarySelected)) {
            log.debug('subsidiarySelected tidak ada di subsRestrection');
            isProcessed = false
          }
      }
      log.debug('isProcessed', isProcessed)
      if(isProcessed == true){
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
          let quoteNumber = result.getValue("tranid");
          let jobNumber = result.getValue("custbody_abj_custom_jobnumber");
          let project = result.getText("class");
          let status = result.getText("statusref");
          let pic = result.getValue("custbody_so_pic");
          // log.debug('pic', pic)
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
          var amntServF,
            amntRetainer,
            amntCF,
            amntSF,
            amntMF,
            amntIncentive,
            amntAdditionalCF,
            amntOthers = "";
            // selain 6 masuk ke others
          switch (revenue) {
            //added by kurnia
            case "Agency Service Fee":
              amntServF = amount;
              break;
            //
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
            //added by kurnia
            amntServF: amntServF || "",
            //
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
          let quoteNumber = result.getValue("tranid");
          let jobNumber = result.getValue("custbody_abj_custom_jobnumber");
          let project = result.getText("class");
          let status = result.getText("statusref");
          let pic = result.getValue("custbody_so_pic");
          // log.debug('pic', pic)
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
          if(item == '2880'){
            amount = 0
          }
          var amntServF,
            amntRetainer,
            amntCF,
            amntSF,
            amntMF,
            amntIncentive,
            amntAdditionalCF,
            amntOthers = "";
          switch (revenue) {
            //added by kurnia
            case "Agency Service Fee":
              amntServF = amount;
              break;
            //
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
            //added by kurnia
            amntServF: amntServF || "",
            //
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
            name: "altname",
            join: "vendor",
          }) 
          var vendorVormula = result.getValue({
            name: "formulatext",
            formula: "{entity}",
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
        const groupedPendingBillArray = pendingBillDataArr.reduce((acc, curr) => {
          const index = acc.findIndex((item) => item.quoteNumberVal === curr.quoteNumberVal);
          if (index !== -1) {
            const accQty = parseInt(acc[index].qty) || 0;
            const currQty = parseInt(curr.qty) || 0;
            acc[index].qty = (accQty + currQty).toString();
            //added by kurnia
            acc[index].amntServF = ((parseFloat(acc[index].amntServF) || 0) + (parseFloat(curr.amntServF) || 0)).toFixed(2);
            //
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
            //added by kurnia
            acc[index].amntServF = ((parseFloat(acc[index].amntServF) || 0) + (parseFloat(curr.amntServF) || 0)).toFixed(2);
            //
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
          }
          // } else {
          //   let mergedItem = {
          //     ...pendingBillItem,
          //     poNo: "",
          //     vendorName: "",
          //     amountPo: "",
          //     total: "",
          //     remarks: "",
          //     paymentStatus: "",
          //   };
          //   mergedPendingBillArray.push(mergedItem);
          // }
        });
        // log.debug('mergedPendingBillArray', mergedPendingBillArray)
        let mergedJobDoneArray = [];
        groupedJobDoneArray.forEach((jobDoneItem) => {
          let matchingPOs = poDataArr.filter((poItem) => {
            var cekJobDOne = jobDoneItem.quoteNumberVal
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
          }
          // } else {
          //   let mergedItem = {
          //     ...jobDoneItem,
          //     poNo: "",
          //     vendorName: "",
          //     amountPo: "",
          //     total: "",
          //     remarks: "",
          //     paymentStatus: "",
          //   };
          //   mergedJobDoneArray.push(mergedItem);
          // }
        });
        log.debug('mergedJobDoneArray', mergedJobDoneArray)
        var totalWIPBilling = 0,
          totalWIPTotal = 0,
          //added by kurnia
          totalWIPServF = 0,
          //
          totalWIIPRetainer = 0,
          totalWIPCF = 0,
          totalWIPSf = 0,
          totalWIPMf = 0,
          totalWIPIf = 0,
          totalWIPadditionalCF = 0,
          totalWIPOthers = 0,
          previousTotalRev = 0,
          previousTotalRevJD = 0;
        var totalBawah = 0;
        if(isProcessed == true){
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
              //added by kurnia
              row.amntServF = "";
              //
              row.amntRetainer = "";
              row.amntCF = "";  
              row.amntSF = "";
              row.amntMF = "";
              row.amntIncentive = "";
              row.amntAdditionalCF = "";
              row.amntOthers = "";
              row.billingBeforeVat = "";
            }
            qContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
            qContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + row.quoteNumberVal + '&whence=" target="_blank" >' + row.quoteNumber || "" + "</a></td>";
            qContent += '            <td class="uir-list-row-cell">' + row.jobNumber || "" + "</td>";
            // qContent += '            <td class="uir-list-row-cell">' + row.project || "" + "</td>";
            qContent += '            <td class="uir-list-row-cell">' + row.status || "" + "</td>";
            qContent += '            <td class="uir-list-row-cell">' + row.pic || "" + "</td>";
            // qContent += '            <td class="uir-list-row-cell">' + row.deliverables || "" + "</td>";
            qContent += '            <td class="uir-list-row-cell">' + row.qty || "" + "</td>";
            qContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=' + row.invoiceNumberVal + '&whence=" target="_blank">' + row.invoiceNumber || "" + "</a></td>";
            qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + (row.billingBeforeVat ? numberWithCommas(row.billingBeforeVat) : "") + "</td>";
            qContent += '            <td class="uir-list-row-cell" style="text-align: right; background: #f4b083 !important;">' + numberWithCommas(totalRev) || "" + "</td>";
            // add by kurnia
            qContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntServF) || "" + "</td>";
            //
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
            //added by kurnia
            totalWIPServF += Number(row.amntServF || 0);
            //
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
            // if (index !== 0 && row.quoteNumberVal === mergedJobDoneArray[index - 1].quoteNumberVal) {
            //   row.billingBeforeVat = "";
            //   totalRev = Number(previousTotalRev) - Number(row.total || 0);
            // }
            if (index !== 0 && row.quoteNumberVal === mergedJobDoneArray[index - 1].quoteNumberVal) {
              totalRev = "";
              row.quoteNumber = "";
              row.jobNumber = "";
              row.project = "";
              row.status = "";
              row.pic = "";
              row.deliverables = "";
              row.qty = "";
              row.invoiceNumber = "";
              //added by kurnia
              row.amntServF = "";
              //
              row.amntRetainer = "";
              row.amntCF = "";  
              row.amntSF = "";
              row.amntMF = "";
              row.amntIncentive = "";
              row.amntAdditionalCF = "";
              row.amntOthers = "";
              row.billingBeforeVat = "";
            }
            totalBawah += Number(totalRev)
            jContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
            jContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/salesord.nl?id=' + row.quoteNumberVal + '&whence=" target="_blank" >' + row.quoteNumber || "" + "</a></td>";
            jContent += '            <td class="uir-list-row-cell">' + row.jobNumber || "" + "</td>";
            // jContent += '            <td class="uir-list-row-cell">' + row.project || "" + "</td>";
            jContent += '            <td class="uir-list-row-cell">' + row.status || "" + "</td>";
            jContent += '            <td class="uir-list-row-cell">' + row.pic || "" + "</td>";
            // jContent += '            <td class="uir-list-row-cell">' + row.deliverables || "" + "</td>";
            jContent += '            <td class="uir-list-row-cell">' + row.qty || "" + "</td>";
            jContent += '            <td class="uir-list-row-cell"><a href="https://8591721.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=' + row.invoiceNumberVal + '&whence=" target="_blank">' + row.invoiceNumber || "" + "</a></td>";
            jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + (row.billingBeforeVat ? numberWithCommas(row.billingBeforeVat) : "") + "</td>";
            jContent += '            <td class="uir-list-row-cell" style="text-align: right; background: #f4b083 !important;">' + numberWithCommas(totalRev) || "" + "</td>";
            //added by kurnia
            jContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + numberWithCommas(row.amntServF) || "" + "</td>";
            //
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
        }
        // sampai sini
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
            
            var amntServF = 0,
                amntRetainer = 0,
                amntCF = 0,
                amntSF = 0,
                amntMF = 0,
                amntIncentive = 0,
                amntAdditionalCF = 0,
                amntOthers = 0;
        
            switch (revenue) {
                //added by kurnia
                case "Agency Service Fee":
                    amntServF = amount;
                    break;
                //
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
                //added by kurnia
                amntServF,
                //
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
            //added by kurnia
            acc[index].amntServF = ((parseFloat(acc[index].amntServF) || 0) + (parseFloat(curr.amntServF) || 0)).toFixed(2);
            //
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
  
        var groupedData = {};
        mergedSummaryData.forEach(function (data) {
            let key = data.year + '-' + data.month;
            if (!groupedData[key]) {
                groupedData[key] = {
                    month: data.month,
                    year: data.year,
                    totalBillingBeforeVat: 0,
                    totalAmountBill: 0,
                    //added by kurnia
                    totalAmntServF: 0,
                    //
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
            //added by kurnia
            groupedData[key].totalAmntServF += Number(data.amntServF);
            //
            groupedData[key].totalAmntRetainer += Number(data.amntRetainer);
            groupedData[key].totalAmntCF += Number(data.amntCF);
            groupedData[key].totalAmntSF += Number(data.amntSF);
            groupedData[key].totalAmntMF += Number(data.amntMF);
            groupedData[key].totalAmntIncentive += Number(data.amntIncentive);
            groupedData[key].totalAmntAdditionalCF += Number(data.amntAdditionalCF);
            groupedData[key].totalAmntOthers += Number(data.amntOthers);
            groupedData[key].totalCostOfBilling += Number(data.amount);
            
        });
        var newsummaryDataArr = [];
        for (var key in groupedData) {
            newsummaryDataArr.push({
                month: groupedData[key].month,
                year: groupedData[key].year,
                totalBillingBeforeVat: groupedData[key].totalBillingBeforeVat,
                totalAmountBill: groupedData[key].totalBillingBeforeVat,
                //added by kurnia
                totalAmntServF: groupedData[key].totalAmntServF,
                //
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
            //added by kurnia
            totalServF = 0,
            //
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
                    //added by kurnia
                    totalAmntServF: 0,
                    //
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
        filledGroupedDataSummary.forEach(function (row) {
            dContent += '        <tr class="uir-list-row-cell uir-list-row-even">';
            dContent += '            <td class="uir-list-row-cell">' + (getMonthName(parseInt(row.month)) || "") + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalBillingBeforeVat || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalUse || 0) + "</td>";
            //added by kurnia
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntServF || 0) + "</td>";
            //
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntRetainer || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntCF || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntSF || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntMF || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntIncentive || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntAdditionalCF || 0) + "</td>";
            dContent += '            <td class="uir-list-row-cell" style="text-align: right;">' + convertCurr(row.totalAmntOthers || 0) + "</td>";
            dContent += "        </tr>";
            totalBilling += Number(row.totalBillingBeforeVat || 0);
            totalTotal += Number(row.totalUse || 0);
            //added by kurnia
            totalServF += Number(row.totalAmntServF || 0);
            //
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
      }else{
          var totalWIPBilling = 0
          totalWIPTotal = 0
          //added by kurnia
          totalWIPServF = 0
          //
          totalWIIPRetainer = 0
          totalWIPCF = 0
          totalWIPSf = 0
          totalWIPMf = 0
          totalWIPIf = 0
          totalAdditionalFC = 0
          totalWIPOthers = 0
          totalBilling = 0
          totalTotal = 0
          //added by kurnia
          totalServF = 0
          //
          totalRetainer = 0
          totalCF = 0
          totalSf = 0
          totalMf = 0
          totalIf = 0
          totalAdditionalFC = 0
          totalOthers = 0
          budgetYear = 0
          balanceToGO = 0
        
      }
      
      // end summary data
      fldTable = form.addField({
        id: "custpage_htmlfield",
        type: serverWidget.FieldType.INLINEHTML,
        label: "HTML Image",
        container: FLDGRP_TABLE,
      });
      sContent += "    <table>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th colspan="7" class="uir-list-header-td" style="text-align: center;font-weight: bold;"></th>';
      sContent += '            <th colspan="9" class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #ed7c39 !important;">REVENUE</th>';
      sContent += '            <th colspan="6" class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #45a147 !important;">COST OF BILLING</th>';
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th colspan="22" class="uir-list-header-td" style="text-align: left;font-weight: bold; background-color: #8eaadc !important">WORK IN PROGRESS</th>';
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">SO NUMBER</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">JOB NO</th>';
      // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">PROJECT</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">STATUS</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">PIC</th>';
      // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">DELIVERABLES</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">QTY</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">INVOICE NUMBER</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold;">BILLING<br/>(BEFORE VAT)</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #c65b2c !important;">TOTAL</th>';
      // add by kurnia 
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Agency Service Fee</th>';
      //
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
      if(isProcessed == true){
        sContent += qContent;
      }
      
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;">TOTAL WIP</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      // sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;"></th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPBilling) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPTotal) + "</th>";
      //added by kurnia
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #bdd6ee !important;">' + numberWithCommas(totalWIPServF) + "</th>";
      //
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
      if(isProcessed == true){
        sContent += jContent;
      }
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
      
      //added by kurnia
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">AGENCY SERVICE FEE</th>';
      //
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">RETAINER</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">CREATIVE FEE</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">SUPERVISION FEE</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">MEDIA FEE</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">3rd Party Production</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">Additional Creative Fee</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #f7caac !important;">OTHERS</th>';
      sContent += "        </tr>";
      if(isProcessed == true){
        sContent += dContent;
      }
      
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #d5a6bd !important;">TOTAL</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalBilling) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalTotal) + "</th>";
      //added by kurnia
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalServF) + "</th>";
      //
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalRetainer) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalCF) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalSf) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalMf) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalIf) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalAdditionalFC) + "</th>";
      sContent += '            <th class="uir-list-header-td" style="text-align: right;font-weight: bold; background: #d5a6bd !important;">' + convertCurr(totalOthers) + "</th>";
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">BUDGET</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">'+ convertCurr(budgetYear)+'</th>';
      sContent += "        </tr>";
      sContent += '        <tr class="uir-list-headerrow">';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">BALANCE TO GO</th>';
      sContent += '            <th class="uir-list-header-td" style="text-align: center;font-weight: bold; background: #fcd964 !important;">'+convertCurr(balanceToGO)+'</th>';
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
