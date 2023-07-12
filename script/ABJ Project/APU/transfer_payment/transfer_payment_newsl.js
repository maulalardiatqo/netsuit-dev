/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/url",
  "N/runtime",
  "N/currency",
  "N/error",
  "N/config",
  "N/format",
], function(serverWidget, search, record, url, runtime, currency, error, config, format) {
  function onRequest(context) {
    try {
      var contextRequest = context.request;

      var form = serverWidget.createForm({
        title: "Transfer Payment",
      });
      var optionfield = form.addFieldGroup({
        id: "optionfieldid",
        label: "STUDENT",
      });
      var filteroption = form.addFieldGroup({
        id: "filteroption",
        label: "FILTER DATE",
      });
      var transfield = form.addFieldGroup({
        id: "trans",
        label: "TOTAL",
      });
      var customerField = form.addField({
        id: "custpage_customer",
        label: "STUDENT",
        type: serverWidget.FieldType.SELECT,
        source: "customer",
        container: "optionfieldid",
      });
      var transdatefrom = form.addField({
        id: "custpage_transdatefrom",
        label: "DATE FROM",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
      transdatefrom.defaultValue = new Date();

      var transdateto = form.addField({
        id: "custpage_transdateto",
        label: "DATE TO",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
      transdateto.defaultValue = new Date();

      var transtotalField_out = form.addField({
        id: "custpage_transtotal_out",
        label: "TRANSFER OUT",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      transtotalField_out.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE, /// disable
      });
      transtotalField_out.defaultValue = 0.0;

      var transtotalField_in = form.addField({
        id: "custpage_transtotal_in",
        label: "TRANSFER IN",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      transtotalField_in.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE, /// disable
      });
      transtotalField_in.defaultValue = 0.0;

      var lastAmount_out = form.addField({
        id: "custpage_last_amount_out",
        label: "LAST AMOUNT OUT",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      lastAmount_out.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN, /// disable
      });
      lastAmount_out.defaultValue = 0.0;

      var lastAmount_in = form.addField({
        id: "custpage_last_amount_in",
        label: "LAST AMOUNT IN",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      lastAmount_in.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN, /// disable
      });
      lastAmount_in.defaultValue = 0.0;

      form.addSubmitButton({
        label: "Query",
      });

      form.addResetButton({
        label: "Clear",
      });

      form.addButton({
        id: 'buttonload',
        label: "Process Payment",
        functionName: 'makePayment',
      });

      form.clientScriptModulePath = "SuiteScripts/transfer_payment_newcs.js";

      if (contextRequest.method == "GET") {
        context.response.writePage(form);
      } else {
        var custpage_customer, trans_date_from, trans_date_to;
        custpage_customer = context.request.parameters.custpage_customer;
        trans_date_from = context.request.parameters.custpage_transdatefrom;
        trans_date_to = context.request.parameters.custpage_transdateto;
        log.debug("custpage_customer", {
          custpage_customer: custpage_customer,
          trans_date_from: trans_date_from,
          trans_date_to: trans_date_to
        });
        customerField.defaultValue = custpage_customer
        transdatefrom.defaultValue = trans_date_from
        transdateto.defaultValue = trans_date_to

        // if (trans_date_from) {
        //   trans_date_from = format_date_for_save_search(trans_date_from);
        // }
        // if (trans_date_to) {
        //   trans_date_to = format_date_for_save_search(trans_date_to);
        // }

        if (!custpage_customer) {
          alert("Please select cutsomer first!");
        } else {
          var currentRecord_out = createSublistOut('custpage_sublist_out', form);
          var currentRecord_in = createSublistIn('custpage_sublist_in', form);
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
          if (typeof allPaymentData !== "undefined" && typeof currentRecord_out !== "undefined") {
            for (var i = 0; i < allPaymentData.length; i++) {
              currentRecord_out.setSublistValue({
                sublistId: "custpage_sublist_out",
                id: "sublist_out_trans_item_no",
                line: i,
                value: allPaymentData[i].getValue(allPaymentDataSet.columns[0])
              })
            }
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
              if (item_no_payment) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_item_no",
                  value: item_no_payment,
                  line: i,
                });
              }

              if (item_desc_payment) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_item_desc",
                  value: item_desc_payment,
                  line: i,
                });
              }

              if (payable_payment) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_payable",
                  value: payable_payment,
                  line: i,
                });
              }

              if (collacted_payment) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_collected",
                  value: collacted_payment,
                  line: i,
                });
              }

              if (no_invoice) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_invoice_no",
                  value: no_invoice,
                  line: i,
                });
              }

              if (trans_internal_id) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_payment_id",
                  value: trans_internal_id,
                  line: i,
                });
              }

              if (trans_type) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_trans_type",
                  value: trans_type,
                  line: i,
                });
              }

              if (subsidiary) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_subsidiary",
                  value: subsidiary,
                  line: i,
                });
              }

              if (InvcSOid) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_invcsoid",
                  value: InvcSOid,
                  line: i,
                });
              }

              if (transDate) {
                currentRecord_out.setSublistValue({
                  sublistId: "custpage_sublist_out",
                  id: "sublist_out_transdate",
                  value: transDate,
                  line: i,
                });
              }
            }
          }

          if (typeof allUnpaidData !== "undefined" && typeof currentRecord_in !== "undefined") {
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

              if (item_no_unpaid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_item_no",
                  value: item_no_unpaid,
                  line: i,
                });
              }

              if (item_desc_unpaid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_item_desc",
                  value: item_desc_unpaid,
                  line: i,
                });
              }

              if (payable_unpaid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_payable",
                  value: payable_unpaid,
                  line: i,
                });
              }

              if (collacted_unpaid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_collected",
                  value: collacted_unpaid,
                  line: i,
                });
              }

              if (balance_unpaid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_balance",
                  value: balance_unpaid,
                  line: i,
                });
              }

              if (trans_internalid) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_trans_internalid",
                  value: trans_internalid,
                  line: i,
                });
              }

              if (trans_type) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_trans_type",
                  value: trans_type,
                  line: i,
                });
              }

              if (subsidiary) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_subsidiary",
                  value: subsidiary,
                  line: i,
                });
              }

              if (transDate) {
                currentRecord_in.setSublistValue({
                  sublistId: "custpage_sublist_in",
                  id: "custpage_sublist_in_trans_date",
                  value: transDate,
                  line: i,
                });
              }
            }
          }
          context.response.writePage(form);
        }
      }
    } catch (e) {
      log.error("error", e);
    }
  }
  return {
    onRequest: onRequest,
  };

  function format_date_for_save_search(vDate) {
    var vDate = new Date(vDate);
    var hari = vDate.getDate();
    var bulan = vDate.getMonth() + 1;
    var tahun = vDate.getFullYear();
    var vDate = hari + "/" + bulan + "/" + tahun;
    return vDate;
  }

  function createSublistIn(sublistname, form) {
    // START TRANSFER IN
    var sublist_in = form.addSublist({
      id: sublistname,
      type: serverWidget.SublistType.LIST,
      label: 'Transfer In (Max 100 Row)',
      tab: 'matchedtab'
    });

    // Ceckbox Sublist
    sublist_in
      .addField({
        id: "custpage_sublist_in_select",
        label: "Select",
        type: serverWidget.FieldType.CHECKBOX,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_item_no",
        label: "ITEM NO",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_item_desc",
        label: "ITEM DESCRIPTION",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_date",
        label: "DATE",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_payable",
        label: "PAYABLE",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_collected",
        label: "TOTAL COLLECTED",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_in_trans_balance",
        label: "BALANCE",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_in
      .addField({
        id: "custpage_sublist_trans_transfer_amount",
        label: "AMOUNT TRANSFER IN",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_in
      .addField({
        id: "custpage_trans_internalid",
        label: "internal id",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_in
      .addField({
        id: "custpage_trans_type",
        label: "internal id",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_in
      .addField({
        id: "custpage_subsidiary",
        label: "subsidiary",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });
    // END TRANSFER IN

    return sublist_in;
  }

  function createSublistOut(sublistname, form) {
    // TRANSFER OUT
    // Sublist Coloumn
    var sublist_out = form.addSublist({
      id: sublistname,
      type: serverWidget.SublistType.LIST,
      label: "Transfer Out (Max 100 Row)",
    });

    // Ceckbox Sublist
    sublist_out
      .addField({
        id: "sublist_out_select",
        label: "Select",
        type: serverWidget.FieldType.CHECKBOX,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_item_no",
        label: "ITEM NO",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_item_desc",
        label: "ITEM DESCRIPTION",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_transdate",
        label: "DATE",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_payable",
        label: "PAYABLE",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_collected",
        label: "COLLECTED",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_invoice_no",
        label: "INVOICE NO / PROFORMA INVC NO",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_transfer_amount",
        label: "AMOUNT TRANSFER OUT",
        type: serverWidget.FieldType.FLOAT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
      });

    sublist_out
      .addField({
        id: "sublist_out_payment_id",
        label: "payment id",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_out
      .addField({
        id: "sublist_out_trans_type",
        label: "trans type",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_out
      .addField({
        id: "sublist_out_subsidiary",
        label: "subsidiary",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });

    sublist_out
      .addField({
        id: "sublist_out_invcsoid",
        label: "Invoice/SO id",
        type: serverWidget.FieldType.TEXT,
      })
      .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
      });
    // END TRANSFER OUT
    return sublist_out;
  }
});