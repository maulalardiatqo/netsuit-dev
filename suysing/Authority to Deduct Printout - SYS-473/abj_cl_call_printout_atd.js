/***************************************************************************************
 ** Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 ** A‑33‑01, Menara UOA Bangsar, 5 Jalan Bangsar Utama 1, Bangsar, 59000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 * @Client        :  Suy Sing
 * @Script Name   :  - SSCC | CL | Call Printout ATD
 * @script File   :   abj_cl_call_printout_atd.js 
 * @Trigger Type  :  
 * @Release Date  :  APR 28, 2026
 * @Author        :  
 * @Description   :
 * @Enhancement   :
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(["N/record", "N/search", "N/currentRecord", "N/url"], function (record, search, currentRecord, url) {
  /**
   * The fieldChanged entry point is the primary function we'll use.
   * It triggers whenever a user changes a field's value. We'll use it
   * to monitor our "trigger" field on the sublist.
   *
   * @param {Object} scriptContext
   * @param {record.Record} scriptContext.currentRecord - The current record on the form.
   * @param {string} scriptContext.sublistId - The ID of the sublist where the field was changed.
   * @param {string} scriptContext.fieldId - The ID of the field that was changed.
   * @param {number} scriptContext.line - The line number (0-based) of the sublist.
   */
 
  
  /**
   * 1. Page Init Function
   */
  function pageInit(scriptContext) {
    console.log("Page Initialized");
  }
  var records = currentRecord.get();
 
  function printPDF() {
        console.log("test in function");
        var id = records.id;
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_su_printout_atd',
            deploymentId: 'customdeploy_abj_su_printout_atd',
            returnExternalUrl: false
        })
        console.log("id",id);
        console.log("urlpdf", createPDFURL);
        createPDFURL += '&id=' +  id;
            if (createPDFURL) {
                newWindow = window.open(createPDFURL);
            }
        } 
  return {
    pageInit: pageInit,
    printPDF : printPDF
  };
});

