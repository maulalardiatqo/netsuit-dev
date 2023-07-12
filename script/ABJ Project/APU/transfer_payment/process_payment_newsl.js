/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record',
    'N/runtime',
    'N/ui/serverWidget',
    'N/ui/message',
    'N/search',
    'N/url',
    'N/format',
    'N/redirect'
  ],
  function(record, runtime, serverWidget, message, search, url, format, redirect) {

    function onRequest(context) {
      var params = context.request;
      var custpage_customer = params.parameters.customer;
      var trans_date_from = params.parameters.startdate;
      var trans_date_to = params.parameters.enddate;
      log.debug("post", {
        customer: customer,
        startdate: startdate,
        enddate: enddate
      });
      var allPaymentData = search.load({
        id: "customsearch1748",
      });

      var allUnpaidData = search.load({
        id: "customsearchtransactiondefaultview_10",
      });

      if (custpage_customer) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: custpage_customer,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: custpage_customer,
          })
        );
      }

      const formula_trandate = "case when {salesorder}=' ' then {applyingtransaction.trandate} else {trandate} end";
      if (trans_date_from) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "FORMULADATE",
            formula: formula_trandate,
            operator: search.Operator.ONORAFTER,
            values: trans_date_from,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: trans_date_from,
          })
        );
      }

      if (trans_date_to) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "FORMULADATE",
            formula: formula_trandate,
            operator: search.Operator.ONORBEFORE,
            values: trans_date_to,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: trans_date_to,
          })
        );
      }

      var allPaymentDataSet = allPaymentData.run();
      allPaymentData = allPaymentDataSet.getRange({
        start: 0,
        end: 100
      });
      var allUnpaidDataSet = allUnpaidData.run();
      allUnpaidData = allUnpaidDataSet.getRange({
        start: 0,
        end: 100
      });

      log.debug("allUnpaidData", allUnpaidData);
      log.debug("allPaymentData", allPaymentData);
      for (var i = 0; i < allPaymentData.length; i++) {
        var py = allPaymentData[i];
        var item_no_payment = py.getValue(allPaymentDataSet.columns[0]);
        var item_desc_payment = py.getValue(allPaymentDataSet.columns[1]);
        var payable_payment = py.getValue(allPaymentDataSet.columns[2]);
        var collacted_payment = py.getValue(allPaymentDataSet.columns[3]);
        var no_invoice = py.getValue(allPaymentDataSet.columns[4]);
        var trans_internal_id = py.getValue(allPaymentDataSet.columns[5]);
        var trans_type = py.getValue(allPaymentDataSet.columns[6]);
        var subsidiary = py.getValue(allPaymentDataSet.columns[7]);
        var InvcSOid = py.getValue(allPaymentDataSet.columns[8]);
        var transDate = py.getValue(allPaymentDataSet.columns[9]);
        transDate = format.format({
          value: transDate,
          type: format.Type.DATE,
        });
      }

      var text_for_revDoc_url = '';
      var text_for_RefundDoc_url = '';
      var success_create_count = 0;
      var success_refund_count = 0;
      var failed_count = 0;
      var failed_refund_count = 0;
      var err_messages = '';
      var refund_err_messages = '';
      var record_Text;
      var payment_list = [];
      for (var i = 0; i < allPaymentData.length; i++) {
        var py = allPaymentData[i];
        var transType = py.getValue(allPaymentDataSet.columns[6]);
        log.debug('transType0', transType);
        if (transType == 'CustInvc') {
          var payment_id = py.getValue(allPaymentDataSet.columns[5]);
          payment_list.push(payment_id);
        }
      }
      log.debug('payment_list', payment_list);

      if (payment_list.length > 0) {
        var gltrans_pmts = search.load({
          id: 'customsearch_abj_gl_custpmt_deposit',
        });

        gltrans_pmts.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: payment_list
        }, ));

        var gltrans_pmtset = gltrans_pmts.run();
        gltrans_pmts = gltrans_pmtset.getRange(0, 1000);

        log.debug('gltrans_pmt', gltrans_pmts);
      }

      for (var i = 0; i < allPaymentData.length; i++) {
        var py = allPaymentData[i];
        try {
          var transNumber = py.getValue(allPaymentDataSet.columns[5]);
          var transDocNumber = py.getValue(allPaymentDataSet.columns[0]);
          var transType = py.getValue(allPaymentDataSet.columns[6]);
          var subsidiary = py.getValue(allPaymentDataSet.columns[7]);
          // var transferoutAmount = py.getValue(allPaymentDataSet.columns[7]);
        } catch (e) {
          var err_msg = 'failed to process transaction # ' + transDocNumber + ' ' + e.name + ': ' + e.message + '<br/>';
          log.debug("Error messages", err_msg);
          if (transType == 'CustInvc') {
            failed_count += 1;
            err_messages += '&nbsp;' + err_msg;
          } else {
            failed_refund_count += 1;
            refund_err_messages += '&nbsp;' + err_msg;
          }
        }
      }

      for (var i = 0; i < allUnpaidData.length; i++) {
        var up = allUnpaidData[i];
        var item_no_unpaid = up.getValue(allUnpaidDataSet.columns[0]);
        var item_desc_unpaid = up.getValue(allUnpaidDataSet.columns[1]);
        var payable_unpaid = up.getValue(allUnpaidDataSet.columns[2]);
        var collacted_unpaid = up.getValue(allUnpaidDataSet.columns[3]);
        var balance_unpaid = up.getValue(allUnpaidDataSet.columns[4]);
        var trans_internalid = up.getValue(allUnpaidDataSet.columns[5]);
        var trans_type = up.getValue(allUnpaidDataSet.columns[6]);
        var subsidiary = up.getValue(allUnpaidDataSet.columns[7]);
        var transDate = up.getValue(allPaymentDataSet.columns[8]);
        transDate = format.format({
          value: transDate,
          type: format.Type.DATE,
        });
      }
    }

    return {
      onRequest: onRequest
    };
  });