/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", ], function(
  runtime,
  log,
  url,
  currentRecord,
  currency,
  record
) {
  var records = currentRecord.get();

  function pageInit(context) {
    //
  }

  function PAGEFORM() {
    return url.resolveScript({
      scriptId: "customscript349",
      deploymentId: "customdeploy1",
      returnExternalUrl: false,
    });
  }

  function openForm(context) {
    var id = records.id;
    var openPageForm = PAGEFORM();
    openPageForm += "&ibid=" + id;
    //console.log('open form', openPageForm);
    window.location.href = openPageForm;
  }

  function closeform() {
    history.back();
  }

  function fieldChanged(context) {
    var vrecord = context.currentRecord;
    if (context.fieldId == "sublist_gr_cost_currency") {
      const queryString = window.location.search;
      console.log(queryString);
      const urlParams = new URLSearchParams(queryString);
      const ibId = urlParams.get('ibid');
      console.log("ibId", ibId);
      var recInbound = record.load({
        type: "inboundshipment",
        id: ibId,
        isDynamic: true
      });
      var lineTotal = recInbound.getLineCount({
        sublistId: "items",
      });
      var currencyIB = 1;
      console.log("lineTotal", lineTotal);
      for (var i = 0; i < 1; i++) {
        console.log("line", i);
        var poIB = recInbound.getSublistValue({
          sublistId: "items",
          fieldId: "purchaseorder",
          line: i,
        });
        currencyIB = recInbound.getSublistValue({
          sublistId: "items",
          fieldId: "pocurrency",
          line: i,
        });
        console.log("currencyIB", currencyIB);
        console.log("poIB", poIB);
      }
      let selectCurrency = vrecord.getCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_currency"
      });
      console.log("selectCurrency", selectCurrency);
      let exchangeRate = Number(currency.exchangeRate({
        source: currencyIB,
        target: selectCurrency,
      }));
      console.log("exchangeRate", exchangeRate);
      let exchangeRateVal = vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_exchange",
        value: exchangeRate.toFixed(2),
        ignoreFieldChange: true,
      });
    }
  }

  return {
    pageInit: pageInit,
    openForm: openForm,
    fieldChanged: fieldChanged
  };
});