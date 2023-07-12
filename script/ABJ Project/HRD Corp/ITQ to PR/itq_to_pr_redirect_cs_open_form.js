/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord"], function(
  runtime,
  log,
  url,
  currentRecord,
) {
  var records = currentRecord.get();

  function pageInit(context) {
    //
  }

  function openForm(context) {
    let id = records.id;
    let linkUrl = url.resolveRecord({
      recordType: "purchaserequisition",
      isEditMode: true,
      params: {
        'itq_id': id,
        'type': 'itq'
      }
    });
    window.location.href = linkUrl;
  }

  return {
    pageInit: pageInit,
    openForm: openForm
  };
});