/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/search", "N/currentRecord", "N/query", "N/record", "N/format", "N/ui/dialog", "N/runtime", "N/ui/message", "N/url"], function (search, currentRecord, query, record, format, dialog, runtime, message, url) {
  var exports = {};
  var recordCurrent = currentRecord.get();

  function format_date_for_save_search(vDate) {
    var vDate = new Date(vDate);
    var hari = vDate.getDate();
    var bulan = vDate.getMonth() + 1;
    var tahun = vDate.getFullYear();
    var vDate = hari + "/" + bulan + "/" + tahun;
    return vDate;
  }

  function pageInit(scriptContext) {}

  function exportReportReconcile(context) {
    var records = currentRecord.get();
    try {
      var fSubsidiary = records.getValue("custpage_f_subsidiary");
      var fStartDate = records.getValue("custpage_f_start_date");
      var fEndDate = records.getValue("custpage_f_end_date");
      var fCustomer = records.getValue("custpage_f_customer");
      if (!fSubsidiary) {
        alert("Subsidiary is mandatory!");
        return false;
      }
      console.log("fSubsidiary", {
        fSubsidiary: fSubsidiary,
        fStartDate: format_date_for_save_search(fStartDate),
        fEndDate: format_date_for_save_search(fEndDate),
        fCustomer: fCustomer,
      });
      var createURL = url.resolveScript({
        scriptId: "customscript1110",
        deploymentId: "customdeploy1",
        params: { fsubsidiary: fSubsidiary, fcustomer: fCustomer, fstartdate: encodeURIComponent(format_date_for_save_search(fStartDate)), fenddate: encodeURIComponent(format_date_for_save_search(fEndDate)) },
        returnExternalUrl: false,
      });
      window.open(createURL, "_blank");
    } catch (error) {
      console.log("error", error.message);
    }
  }

  function exportTotalRevenue(context) {
    var records = currentRecord.get();
    try {
      var fSubsidiary = records.getValue("custpage_f_subsidiary");
      var fStartDate = records.getValue("custpage_f_start_date");
      var fEndDate = records.getValue("custpage_f_end_date");
      if (!fSubsidiary) {
        alert("Subsidiary is mandatory!");
        return false;
      }
      console.log("fSubsidiary", {
        fSubsidiary: fSubsidiary,
        fStartDate: format_date_for_save_search(fStartDate),
        fEndDate: format_date_for_save_search(fEndDate),
      });
      var createURL = url.resolveScript({
        scriptId: "customscript1109",
        deploymentId: "customdeploy1",
        params: { fsubsidiary: fSubsidiary, fstartdate: encodeURIComponent(format_date_for_save_search(fStartDate)), fenddate: encodeURIComponent(format_date_for_save_search(fEndDate)) },
        returnExternalUrl: false,
      });
      window.open(createURL, "_blank");
    } catch (error) {
      console.log("error", error.message);
    }
  }

  exports.exportReportReconcile = exportReportReconcile;
  exports.exportTotalRevenue = exportTotalRevenue;
  exports.pageInit = pageInit;

  return exports;
});
