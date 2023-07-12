/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/search", "N/record", "N/ui/serverWidget"], function(search, record, serverWidget) {

  function onRequest(context) {
    try {
      var customer_param = context.request.parameters.customer;

      var form = serverWidget.createForm({
        title: "Multi Subsidiary Payment Page",
      });

      form.addFieldGroup({
        id: "custpage_filters",
        label: "Filters",
      });

      var total_fld = form.addField({
        id: "custpage_total",
        type: serverWidget.FieldType.TEXT,
        label: "Total",
        container: "custpage_filters",
      });

      total_fld.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
      });

      var customer_fld = form.addField({
        id: "custpage_customer",
        type: serverWidget.FieldType.SELECT,
        label: "Customer",
        container: "custpage_filters",
        source: "customer"
      });

      customer_fld.isMandatory = true

      var date_fld = form.addField({
        id: "custpage_date",
        type: serverWidget.FieldType.DATE,
        label: "Date",
        container: "custpage_filters"
      });

      date_fld.isMandatory = false;


      var account_fld = form.addField({
        id: "custpage_account",
        type: serverWidget.FieldType.SELECT,
        label: "Account",
        container: "custpage_filters"
      });


      var acc = search.create({
        type: "account",
        filters: [
          ["type", "anyof", "Bank"]
        ],
        columns: ["displayname"]
      })

      var acc_res = acc.run().getRange({
        start: 0,
        end: 999
      });

      for (var i = 0; i < acc_res.length; i++) {
        account_fld.addSelectOption({
          text: acc_res[i].getValue("displayname"),
          value: acc_res[i].id
        })
      }

      account_fld.isMandatory = false;



      form.addButton({
        label: "Make Payment",
        id: "custpage_create_btn",
        functionName: "createPayment"
      });


      form.addButton({
        label: "Print Receipt",
        id: "custpage_receipt_btn",
        functionName: "printReceipt"
      });




      // Please search https://system.netsuite.com/app/help/helpcenter.nl?search=Form.clientScriptFileId for more information.
      form.clientScriptFileId = "190220";

      // var currentRecord = createSublist('custpage_pay_list', form);

      form.addSubmitButton({
        label: "Query"
      })

      if (context.request.method == "GET" && !customer_param) {

        context.response.writePage(form)

      } else {
        //update
        var customer, account, trandate;
        total_fld.defaultValue = 0;
        customer = context.request.parameters.custpage_customer;
        account = context.request.parameters.custpage_account;
        trandate = context.request.parameters.custpage_date;

        if (customer_param) {
          customer = customer_param
        }

        if (!customer) {


        } else {

          customer_fld.defaultValue = customer
          account_fld.defaultValue = account

          var accountRec = record.load({
            type: "account",
            id: account,
            isDynamic: true,
          });
          var accountName = accountRec.getText("acctname");
          var defaultPaymentMethod = accountRec.getValue("custrecord154");
          var paymentMethodContain, paymentMethodNotContain_1, paymentMethodNotContain_2;
          log.debug("accountName", accountName);
          if (accountName.includes("APU")) {
            paymentMethodContain = "APU";
            paymentMethodNotContain_1 = "APIIT";
            paymentMethodNotContain_2 = "APLC";
          } else if (accountName.includes("APIIT")) {
            paymentMethodContain = "APIIT";
            paymentMethodNotContain_1 = "APU";
            paymentMethodNotContain_2 = "APLC";
          } else if (accountName.includes("APLC")) {
            paymentMethodContain = "APLC";
            paymentMethodNotContain_1 = "APU";
            paymentMethodNotContain_2 = "APIIT";
          }

          log.debug("accountName2", {
            paymentMethodContain: paymentMethodContain,
            paymentMethodNotContain_1: paymentMethodNotContain_1,
            paymentMethodNotContain_2: paymentMethodNotContain_2
          });

          if (paymentMethodContain) {
            var filterPayMethod = search.create({
              type: "customlist_abj_std_payment_method",
              filters: [
                ["name", "contains", paymentMethodContain],
                "OR",
                [
                  ["name", "doesnotcontain", paymentMethodNotContain_1],
                  "AND",
                  ["name", "doesnotcontain", paymentMethodNotContain_2]
                ]
              ],
              columns: ["name"]
            });
          } else {
            var filterPayMethod = search.create({
              type: "customlist_abj_std_payment_method",
              columns: ["name"]
            });
          }

          var filterPayMethodData = filterPayMethod.run().getRange({
            start: 0,
            end: 999
          });
          log.debug("filterPayMethodData", filterPayMethodData.length);

          var currentRecord = createSublist('custpage_pay_list', form, filterPayMethodData, defaultPaymentMethod);

          var filters = [
            ["mainline", "is", true],
            "AND",
            ["amountremaining", "greaterthan", "0.00"],
            "AND",
            ["type", "noneof", "Journal"],
            "AND",
            ["posting", "is", "T"]
          ]

          if (customer) {
            filters.push("AND");
            filters.push(["entity", "anyof", customer]);
          }

          if (trandate) {
            filters.push("AND");
            filters.push(["trandate", "within", trandate]);

            date_fld.defaultValue = trandate
          }

          var ser = search.create({
            type: "transaction",
            filters: filters,
            columns: ["internalid", "memo", "tranid", "trandate", "account", "total", "amountremaining", "entity", "subsidiary"]
          })
          var res = ser.run().getRange({
            start: 0,
            end: 999
          });

          for (var i = 0; i < res.length; i++) {
            // currentRecord.selectNewLine({
            //     sublistId: "custpage_pay_list"
            // })

            currentRecord.setSublistValue({
              sublistId: "custpage_pay_list",
              id: "custpage_document",
              line: i,
              value: res[i].id
            })

            currentRecord.setSublistValue({
              sublistId: "custpage_pay_list",
              id: "custpage_memo",
              line: i,
              value: res[i].getValue("memo") || ""
            })

            currentRecord.setSublistValue({
              sublistId: "custpage_pay_list",
              id: "custpage_subsidiary",
              line: i,
              value: res[i].getValue("subsidiary")
            })

            currentRecord.setSublistValue({
              sublistId: "custpage_pay_list",
              id: "custpage_tran_total",
              line: i,
              value: res[i].getValue("total")
            })

            currentRecord.setSublistValue({
              sublistId: "custpage_pay_list",
              id: "custpage_tran_unpaid",
              line: i,
              value: res[i].getValue("amountremaining")
            })

            // currentRecord.commitLine({
            //     sublistId:"custpage_pay_list"
            // })

          }


        }

        context.response.writePage(form)

      }


    } catch (e) {
      log.error("error", e);
    }
  }


  return {
    onRequest: onRequest
  }

  function createSublist(sublistname, form, filterPayMethodData, defaultPaymentMethod) {
    sublist = form.addSublist({
      id: sublistname,
      type: serverWidget.SublistType.LIST,
      label: "Results",
    });


    sublist.addField({
      id: "custpage_checkbox",
      type: serverWidget.FieldType.CHECKBOX,
      label: "Mark",
    });



    var doc = sublist.addField({
      id: "custpage_document",
      type: serverWidget.FieldType.SELECT,
      label: "Invoice No",
      source: "invoice"
    });

    var memo = sublist.addField({
      id: "custpage_memo",
      type: serverWidget.FieldType.TEXT,
      label: "Memo",
    });

    memo.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.DISABLED
    });

    var doc = sublist.addField({
      id: "custpage_subsidiary",
      type: serverWidget.FieldType.SELECT,
      label: "Subsidiary",
      source: "subsidiary"
    });



    doc.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.DISABLED
    });


    sublist.addField({
      id: "custpage_tran_total",
      type: serverWidget.FieldType.TEXT,
      label: "Amount",
    });


    sublist.addField({
      id: "custpage_tran_unpaid",
      type: serverWidget.FieldType.TEXT,
      label: "UnPaid",
    });

    var paid = sublist.addField({
      id: "custpage_pay_amt",
      type: serverWidget.FieldType.CURRENCY,
      label: "Amount to be paid",
    });

    //sublist.addButton('custpage_markmark','Mark all','markall();');

    sublist.addButton({
      label: "Mark All",
      id: "custpage_markmark",
      functionName: "markall();"
    });

    sublist.addButton({
      label: "Unmark All",
      id: "custpage_markmark",
      functionName: "unmarkall();"
    });

    paid.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.ENTRY
    });

    paid.isMandatory = true;

    var payment_method = sublist.addField({
      id: "custpage_pay_method",
      type: serverWidget.FieldType.SELECT,
      label: "Payment Method",
      // source: "customlist_abj_std_payment_method"
    });

    payment_method.addSelectOption({
      value: '',
      text: ''
    });
    for (var i = 0; i < filterPayMethodData.length; i++) {
      payment_method.addSelectOption({
        text: filterPayMethodData[i].getValue("name"),
        value: filterPayMethodData[i].id
      })
    }

    payment_method.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.ENTRY
    });

    payment_method.isMandatory = true;
    if (defaultPaymentMethod) {
      payment_method.defaultValue = defaultPaymentMethod;
    }


    // sublist.addField({
    //   id: "custpage_pmt_txn_id",
    //   type: serverWidget.FieldType.SELECT,
    //   label: "TXN",
    //   source:"customerpayment"
    // });

    //sublist.addMarkAllButtons()

    return sublist;



  }




  function addData(sublist, data) {
    for (var i = 0; i < data.length; i++) {

      var row = data[i];

      sublist.setSublistValue({
        id: "custpage_payu_id",
        line: i,
        value: row.payu.custrecord_payuid || "-"
      });

      sublist.setSublistValue({
        id: "custpage_payu_txn_id",
        line: i,
        value: row.payu.custrecord_transaction_no || "-"
      });

      sublist.setSublistValue({
        id: "custpage_service_tax",
        line: i,
        value: row.payu.custrecord_servicetax || "-"
      });

      sublist.setSublistValue({
        id: "custpage_process_fee",
        line: i,
        value: row.payu.custrecord_paymentprocessfee || "-"
      });


      sublist.setSublistValue({
        id: "custpage_payu_total",
        line: i,
        value: row.payu.custrecord_payuamount || "-"
      });


      sublist.setSublistValue({
        id: "custpage_difference",
        line: i,
        value: row.diff || "-"
      });


    }

  }

  function getSearch(type, filters, columns) {
    try {
      var dynamic_search = search.create({
        type: type,
        filters: filters,
        columns: columns
      });
      var result_out = [];

      var myPagedData = dynamic_search.runPaged({
        pageSize: 1000
      });

      myPagedData.pageRanges.forEach(function(pageRange) {


        var myPage = myPagedData.fetch({
          index: pageRange.index
        });
        myPage.data.forEach(function(res) {
          var values = {};
          //iterate over the collection of columns for the value
          columns.forEach(function(c, i, a) {

            var key_name = "";

            if (c.join)
              key_name = c.join + "_" + c.name
            else
              key_name = c.name;

            var value = res.getText(c);

            if (value == null) {
              values[key_name] = res.getValue({
                name: c
              });
            } else {
              values[key_name] = {
                text: res.getText(c),
                value: res.getValue(c)
              };
            }
          });
          result_out.push(values);
        });
      });
      return result_out;
    } catch (e) {
      log.error("getSearch failed due to an exception", e);
    }
  }
});