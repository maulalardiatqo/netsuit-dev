/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

define([
  "N/error",
  "N/ui/dialog",
  "N/url",
  "N/record",
  "N/currentRecord",
  "N/log",
], function(error, dialog, url, record, currentRecord, log) {
  var records = currentRecord.get();

  function pageInit(context) {
    console.log("test in");
  }

  function QuoteSummURL() {
    return url.resolveScript({
      scriptId: "customscriptafc_quote_summ_print_sl",
      deploymentId: "customdeploy1",
      returnExternalUrl: false,
    });
  }

  function PrintQuoteSumm(context) {
    var id = records.id;
    var createQuoteSummURL = QuoteSummURL();
    createQuoteSummURL += "&id=" + id;
    window.location.href = createQuoteSummURL;
  }

  return {
    pageInit: pageInit,
    PrintQuoteSumm: PrintQuoteSumm,
  };
});