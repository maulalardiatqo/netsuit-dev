/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog'], function(search, dialog) {

  var mode = undefined;

  function pageInit(context) {
    mode = context.mode;
    if (context.currentRecord.type != "vendorbill") {
      window.onbeforeunload = null;
    }
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    let paymentFileFormat = rec.getValue('custbody_sol_payment_format');
    if (paymentFileFormat) {
      let failed_dialog = {
        title: 'Error',
        message: "Open Bills are using EFT Payment File Format that is Different from Currently Selected EFT Payment Format. It is suggested to process payment for open bills of this supplier before processing the current bill."
      };
      dialog.alert(failed_dialog);
      return false;
    }
    return true;
  }

  function fieldChanged(context) {
    try {
      if (context.fieldId == "sublist_budgetlist_page") {
        let pageno = context.currentRecord.getValue('sublist_budgetlist_page');
        var href = new URL(location.href);
        href.searchParams.set('custom_pageno', pageno);
        location.href = href;
      }

      if (context.fieldId == "custpage_budget_accountype" || context.fieldId == "custpage_budget_costcenter") {
        let cc = context.currentRecord.getValue('custpage_budget_costcenter');
        let acctype = context.currentRecord.getValue('custpage_budget_accountype');
        console.log(cc, acctype);
        var href = new URL(location.href);
        if (acctype) {
          href.searchParams.set('custom_sum_acctype', acctype);
        }
        href.searchParams.set('custom_sum_cctype', cc);
        location.href = href;
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  function validateField(context) {
    //validation for vendor bill payment file format
    if (context.fieldId == "custbody_sol_payment_format" && context.currentRecord.getValue('custbody_sol_payment_format')) {
      if (getOpenBillsWithPFF(context)) {
        alert("Open bills are existed with payment file format.");
        return false;
      }
    }
    return true;
  }

  function saveRecord(context) {
    //validation for vendor bill payment file format
    if (context.currentRecord.type == "vendorbill" && context.currentRecord.getValue('custbody_sol_payment_format')) {
      if (getOpenBillsWithPFF(context)) {
        alert("Open bills are existed with payment file format.");
        return true;
      }
    }
    return true;
  }


  function getOpenBillsWithPFF(context) {
    var payFileFormatId = context.currentRecord.getValue('custbody_sol_payment_format');

    var billMainFil = [
      ["type", "anyof", "VendBill"],
      "AND",
      ["custbody_sol_payment_format", "noneof", '@NONE@'],
      "AND",
      ["status", "anyof", "VendBill:A"],
      "AND",
      ["custcol_15529_eft_enabled", "is", "T"],
      "AND",
      ["mainline", "is", "T"],
      "AND",
      ["vendor.internalid", "anyof", context.currentRecord.getValue('entity')]
    ];

    if (mode == "edit") {
      billMainFil.push("AND", ["internalid", "noneof", context.currentRecord.id]);
    }

    let billSearch = search.create({
      type: "vendorbill",
      filters: billMainFil,
      columns: [
        search.createColumn({
          name: "tranid",
          label: "Document Number"
        }),
        search.createColumn({
          name: "custbody_sol_payment_format",
          label: "Payment file Format "
        })
      ]
    }).run().getRange(0, 10);

    return (billSearch.length > 0 && billSearch[0].getValue('custbody_sol_payment_format') != payFileFormatId);
  }

  function rejectBills() {
    nlapiSetFieldValue("custpage_reject_selected", "T");
    jQuery("#submitter").click();
  }

  function rejectBudgets() {
    nlapiSetFieldValue("custpage_recject_budget", true);
    jQuery("#submitter").click();
  }

  return {
    pageInit: pageInit,
    saveRecord: saveRecord,
    validateField: validateField,
    fieldChanged: fieldChanged,
    rejectBills: rejectBills,
    rejectBudgets: rejectBudgets
  }
});