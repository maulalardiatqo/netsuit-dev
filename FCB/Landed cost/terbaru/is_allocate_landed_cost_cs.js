/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", 'N/ui/message'], function(
  runtime,
  log,
  url,
  currentRecord,
  currency,
  record,
  search,
  message
) {
  var records = currentRecord.get();

  /**
   * Get the value of a URL parameter by name
   * @param {string} name - the name of the URL parameter
   * @returns {string|null} - the value of the URL parameter or null if not found
   */
  function getUrlParameter(name) {
    // Get the URL parameters as an object
    var params = new URLSearchParams(window.location.search);

    // Check if the parameter exists
    if (params.has(name)) {
      // Return the parameter value
      return params.get(name);
    }

    // Parameter not found
    return null;
  }

  function pageInit(context) {}

  /**
   * Navigates back to the previous page
   */
  function goBack() {
    var url = document.referrer;
    window.location.href = url;
  }

  function checkArrayValues(array) {
    return array.every(function(element) {
      return element === array[0];
    });
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

  function doRecalculate(id) {
    console.log(id);
    var datatranss = search.load({
      id: "customsearchabj_ib_rec_trans",
    });
    datatranss.filters.push(
      search.createFilter({
        name: "internalid",
        operator: search.Operator.IS,
        values: id,
      })
    );
    var datatransset = datatranss.run();
    datatranss = datatransset.getRange(0, 1);
    var exchangeRateGr;
    datatranss.forEach(function(datatrans) {
      var grId = datatrans.getValue({
        name: datatransset.columns[2]
      });
      var ir_data_to_update = record.load({
        type: record.Type.ITEM_RECEIPT,
        id: grId,
      });
      exchangeRateGr = ir_data_to_update.getValue('exchangerate');
    });
    console.log("exchangeRateGr", exchangeRateGr);

    var LcCostAllocs = search.create({
      type: 'customrecordabj_ib_cost_allocation',
      columns: ['custrecord_ca_ib_cost_category',
        'custrecord_ca_ib_cost_amount',
        'custrecord_ca_ib_cost_currency',
        'custrecord_ca_ib_cost_exchange_rate',
        'custrecord_ca_ib_cost_alloc_method',
        'custrecord_exchangerate1'
      ],
      filters: [{
        name: 'custrecord_abj_ca_ib_number',
        operator: 'is',
        values: id
      }, ]
    }).run().getRange({
      start: 0,
      end: 4
    });
    console.log("LcCostAllocs", LcCostAllocs);
    var vrecord = records;
    var count = vrecord.getLineCount({
      sublistId: 'sublist'
    });
    for (var idx = count - 1; idx >= 0; idx--) {
      try {
        vrecord.removeLine({
          sublistId: 'sublist',
          line: idx,
          ignoreRecalc: true
        });
      } catch (e) {
        console.log("error", e.name + ': ' + e.message);
      }
      console.log("var idx", idx);
      console.log("var count", count);
    }

    var idx = 0;
    LcCostAllocs.forEach(function(LcCostAlloc) {
      var cost_Category = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_category'
      })
      vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_category",
        value: cost_Category,
        ignoreFieldChange: true,
      });
      console.log("cost_Category", cost_Category);

      var cost_Amount = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_amount'
      })
      vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_amount",
        value: cost_Amount,
        ignoreFieldChange: true,
      });
      console.log("cost_Amount", cost_Amount);

      var cost_Currency = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_currency'
      })
      vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_currency",
        value: cost_Currency || shipmentbasecurrency,
        ignoreFieldChange: true,
      });
      console.log("cost_Currency", cost_Currency);

      var cost_ExchangeRate = LcCostAlloc.getValue({
        name: 'custrecord_exchangerate1'
      })
      if (cost_ExchangeRate == 1) {
        vrecord.setCurrentSublistValue({
          sublistId: "sublist",
          fieldId: "sublist_gr_exchange",
          value: 1,
          ignoreFieldChange: true,
        });
      } else {
        vrecord.setCurrentSublistValue({
          sublistId: "sublist",
          fieldId: "sublist_gr_exchange",
          value: 1 / parseFloat(exchangeRateGr),
          ignoreFieldChange: true,
        });
      }

      var cost_allocMethod = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_alloc_method'
      })
      vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_allocation_method",
        value: cost_allocMethod,
        ignoreFieldChange: true,
      });
      console.log("cost_allocMethod", cost_allocMethod);

      vrecord.commitLine({
        sublistId: "sublist",
        ignoreRecalc: true
      });
      idx++;
    });

    var successMessage = message.create({
      title: 'Success!',
      message: 'Exchange rate recalculated. Please re Allocate to change the GR Landed Cost.',
      type: message.Type.CONFIRMATION
    });
    successMessage.show();
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
        source: selectCurrency,
        target: currencyIB,
      }));
      console.log("exchangeRate", exchangeRate.toFixed(15));
      let exchangeRateVal = vrecord.setCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_exchange",
        value: exchangeRate.toFixed(15),
        ignoreFieldChange: true,
      });
    }

    if (context.fieldId == "sublist_gr_cost_allocation_method") {
      let selectMethod = vrecord.getCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_allocation_method"
      });
      console.log("selectMethod", selectMethod);
    }

    if (context.fieldId == "sublist_gr_cost_category") {
      let selectCategory = vrecord.getCurrentSublistValue({
        sublistId: "sublist",
        fieldId: "sublist_gr_cost_category"
      });
      console.log("selectCategory", selectCategory);
    }
  }
  function redirectToCostAllocate() {
    console.log('call')
    var url = "https://6865308.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=330";
    window.location = url;
  }

  return {
    redirectToCostAllocate : redirectToCostAllocate,
    pageInit: pageInit,
    goBack: goBack,
    openForm: openForm,
    doRecalculate: doRecalculate,
    fieldChanged: fieldChanged
  };
});