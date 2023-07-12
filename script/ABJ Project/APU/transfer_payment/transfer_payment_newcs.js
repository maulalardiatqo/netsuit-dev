/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/search",
  "N/currentRecord",
  "N/query",
  "N/record",
  "N/format",
  "N/ui/dialog",
  "N/runtime",
  "N/ui/message",
  "N/url",
], function(search, currentRecord, query, record, format, dialog, runtime, message, url) {
  var exports = {};

  function pageInit(context) {}

  function fieldChanged(context) {
    var vrecord = context.currentRecord;

    if (context.sublistId == "custpage_sublist_out" && context.fieldId == "sublist_out_select") {
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out");
      var selectVal_out = vrecord.getSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_select",
        line: context.line,
      });

      var lastAmountInput = vrecord.getSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
        line: context.line,
      });
      vrecord.setValue({
        fieldId: "custpage_last_amount_out",
        value: lastAmountInput,
        ignoreFieldChange: true,
      });

      if (selectVal_out) {
        var collectedRow = vrecord.getSublistValue({
          sublistId: "custpage_sublist_out",
          fieldId: "sublist_out_trans_collected",
          line: context.line,
        });
      } else {
        var collectedRow = '';
      }

      vrecord.setCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
        value: collectedRow,
        line: context.line,
      });

      if (selectVal_out) {
        transtotalfield_out += Number(
          vrecord.getSublistValue({
            sublistId: "custpage_sublist_out",
            fieldId: "sublist_out_trans_transfer_amount",
            line: context.line,
          })
        );
      } else {
        transtotalfield_out -= Number(lastAmountInput);
      }

      console.log("transtotalfield_out", transtotalfield_out);
      vrecord.setValue({
        fieldId: "custpage_transtotal_out",
        value: transtotalfield_out.toFixed(2),
        ignoreFieldChange: true,
      });
    }

    if (context.sublistId == "custpage_sublist_out" && context.fieldId == "sublist_out_trans_transfer_amount") {
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out");
      var changeVal_out = vrecord.getSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
        line: context.line,
      });
      var collectedNow = vrecord.getSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_collected",
        line: context.line,
      });
      if (changeVal_out) {
        if (parseFloat(changeVal_out) > parseFloat(collectedNow)) {
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_out",
            fieldId: "sublist_out_trans_transfer_amount",
            value: collectedNow,
            line: context.line,
          });
        }
      }
    }

    if (context.sublistId == "custpage_sublist_in" && context.fieldId == "custpage_sublist_in_select") {
      var transtotalfield_in = vrecord.getValue("custpage_transtotal_in") || 0;
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out") || 0;
      console.log("transtotalfield_in", {
        transtotalfield_in: transtotalfield_in,
        transtotalfield_out: transtotalfield_out
      });
      var selectVal_in = vrecord.getSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_in_select",
        line: context.line,
      });

      var lastAmountInput = vrecord.getSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
        line: context.line,
      });
      vrecord.setValue({
        fieldId: "custpage_last_amount_in",
        value: lastAmountInput,
      });

      if (selectVal_in) {
        var payableRow = vrecord.getSublistValue({
          sublistId: "custpage_sublist_in",
          fieldId: "custpage_sublist_in_trans_payable",
          line: context.line,
        });
        var amountLeft = parseFloat(transtotalfield_out) - parseFloat(transtotalfield_in);
      } else {
        var payableRow = '';
        var amountLeft = '';
      }

      vrecord.setCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
        value: amountLeft,
        line: context.line,
      });

      if (selectVal_in) {
        transtotalfield_in += Number(
          vrecord.getSublistValue({
            sublistId: "custpage_sublist_in",
            fieldId: "custpage_sublist_trans_transfer_amount",
            line: context.line,
          })
        );
      } else {
        transtotalfield_in -= Number(lastAmountInput);
      }

      console.log("transtotalfield_in", transtotalfield_in);
      vrecord.setValue({
        fieldId: "custpage_transtotal_in",
        value: transtotalfield_in.toFixed(2),
        ignoreFieldChange: true,
      });
    }

    if (context.sublistId == "custpage_sublist_in" && context.fieldId == "custpage_sublist_trans_transfer_amount") {
      var transtotalfield_in = parseFloat(vrecord.getValue("custpage_transtotal_in") || 0);
      var changeVal_in = vrecord.getSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
        line: context.line,
      });
      var payableNow = vrecord.getSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_in_trans_payable",
        line: context.line,
      });
      if (changeVal_in) {
        if (parseFloat(changeVal_in) > parseFloat(payableNow)) {
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_in",
            fieldId: "custpage_sublist_trans_transfer_amount",
            value: payableNow,
            line: context.line,
          });
        }
      }
    }
  }

  function sublistChanged(context) {
    var vrecord = context.currentRecord;
    var lineTotal = vrecord.getLineCount({
      sublistId: context.sublistId,
    });
    if (context.sublistId == "custpage_sublist_out") {
      var fieldId = "sublist_out_trans_transfer_amount";
      var fieldIdTotal = "custpage_transtotal_out";
    } else {
      var fieldId = "custpage_sublist_trans_transfer_amount";
      var fieldIdTotal = "custpage_transtotal_in";
    }
    var totalIN = 0;
    for (var i = 0; i < lineTotal; i++) {
      var amountTrans = vrecord.getSublistValue({
        sublistId: context.sublistId,
        fieldId: fieldId,
        line: i,
      }) || 0;
      console.log("amountTrans", amountTrans);
      totalIN += parseFloat(amountTrans);
    }
    console.log("totalIN", totalIN);
    vrecord.setValue({
      fieldId: fieldIdTotal,
      value: totalIN.toFixed(2),
      ignoreFieldChange: true,
    });
  }

  function makePaymentNew(context) {
    console.log("makePayment");
    var rec = context.currentRecord;
    var totaltransferout = rec.getValue('custpage_transtotal_out');
    var totaltransferin = rec.getValue('custpage_transtotal_in');
    if (!totaltransferout && !totaltransferin) {
      // window.alert('Please Select Transfer Out or/and Transfer in');
      let failed_dialog = {
        title: 'Error',
        message: "Please Select Transfer Out or/and Transfer in"
      };
      dialog.alert(failed_dialog);
      return false;
    }

    if (totaltransferout != totaltransferin) {
      // window.alert('Transfer Out and Transfer in must same');
      let failed_dialog = {
        title: 'Error',
        message: `Transfer Out and Transfer in must be equal. Now, Transfer Out : ${totaltransferout} and Transfer In : ${totaltransferin} `
      };
      dialog.alert(failed_dialog);
      return false;
    }

    var answer = confirm("Are you sure want to continue?");
    if (answer) {
      let customer = currentRecord.getValue("custpage_customer");
      let startdate = currentRecord.getValue("custpage_transdatefrom");
      let enddate = currentRecord.getValue("custpage_transdateto");
      let postingUrl = url.resolveScript({
        scriptId: 'customscript_sol_itq_rfq_rfp_to_pr',
        deploymentId: 'customdeploy_sol_itq_rfq_rfp_to_pr',
        returnExternalUrl: false
      });
      postingUrl += '&customer=' + customer;
      postingUrl += '&startdate=' + startdate;
      postingUrl += '&enddate=' + enddate;
      window.location.href = postingUrl;
    }
  }

  function makePayment(context) {
    console.log("makePayment");
    var rec = context.currentRecord;
    var totaltransferout = rec.getValue('custpage_transtotal_out');
    var totaltransferin = rec.getValue('custpage_transtotal_in');
    if (!totaltransferout && !totaltransferin) {
      // window.alert('Please Select Transfer Out or/and Transfer in');
      let failed_dialog = {
        title: 'Error',
        message: "Please Select Transfer Out or/and Transfer in"
      };
      dialog.alert(failed_dialog);
      return false;
    }

    if (totaltransferout != totaltransferin) {
      // window.alert('Transfer Out and Transfer in must same');
      let failed_dialog = {
        title: 'Error',
        message: `Transfer Out and Transfer in must be equal. Now, Transfer Out : ${totaltransferout} and Transfer In : ${totaltransferin} `
      };
      dialog.alert(failed_dialog);
      return false;
    }
    var answer = confirm("Are you sure want to continue?");
    if (answer) {
      var save_request = {
        entity: currentRecord.getValue("custpage_customer"),
        apply_out: [],
        apply_in: [],
        payment_list_out: [],
        payment_list_in: [],
      };
      if (save_request.entity) {
        var myMsg = message.create({
          title: "Processing",
          message: "Please Wait",
          type: message.Type.CONFIRMATION, //INFORMATION
        });

        myMsg.show({
          duration: 15000, // will disappear after 5s
        });

        var payment_list_out = [];
        var count_out = currentRecord.getLineCount("custpage_sublist_out");
        for (var i = 0; i < count_out; i++) {
          var transType = currentRecord.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_type',
            line: i
          });
          if (transType == 'CustInvc') {
            var payment_id = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_payment_id',
              line: i
            });
            save_request.payment_list_out.push(payment_id);
          }
        }
        console.log('payment_list_out', payment_list_out);
        for (var i = 0; i < count_out; i++) {
          try {
            var transNumber = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_payment_id',
              line: i
            });
            console.log("transNumber", transNumber);

            var transDocNumber = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_trans_item_no',
              line: i
            });
            console.log("transDocNumber", transDocNumber);

            var transType = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_trans_type',
              line: i
            });
            console.log("transType", transType);

            var subsidiary = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_subsidiary',
              line: i
            });
            console.log("subsidiary", subsidiary);

            var transferoutAmount = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_trans_transfer_amount',
              line: i
            });
            console.log("transferoutAmount", transferoutAmount);

            var InvcSOid = currentRecord.getSublistValue({
              group: 'custpage_sublist_out',
              name: 'sublist_out_invcsoid',
              line: i
            });
            console.log("InvcSOid", InvcSOid);

            save_request.apply_out.push({
              transNumber: transNumber,
              transDocNumber: transDocNumber,
              transType: transType,
              subsidiary: subsidiary,
              transferoutAmount: transferoutAmount,
              InvcSOid: InvcSOid
            })
          } catch (e) {
            console.log("error", e);
          }
        }

        var count_in = currentRecord.getLineCount("custpage_sublist_in");
        for (var i = 0; i < count_in; i++) {
          try {
            var transNumber = currentRecord.getSublistValue({
              group: 'custpage_sublist_in',
              name: 'custpage_trans_internalid',
              line: i
            });
            console.log("transNumber", transNumber);

            var transDocNumber = currentRecord.getSublistValue({
              group: 'custpage_sublist_in',
              name: 'custpage_sublist_in_trans_item_no',
              line: i
            });
            console.log("transDocNumber", transDocNumber);

            var transType = currentRecord.getSublistValue({
              group: 'custpage_sublist_in',
              name: 'custpage_trans_type',
              line: i
            });
            console.log("transType", transType);

            var transferinAmount = currentRecord.getSublistValue({
              group: 'custpage_sublist_in',
              name: 'custpage_sublist_in_trans_balance',
              line: i
            });
            console.log("transferinAmount", transferinAmount);

            var subsidiary = currentRecord.getSublistValue({
              group: 'custpage_sublist_in',
              name: 'custpage_subsidiary',
              line: i
            });
            console.log("subsidiary", subsidiary);

            save_request.apply_in.push({
              transNumber: transNumber,
              transDocNumber: transDocNumber,
              transType: transType,
              subsidiary: subsidiary,
              transferinAmount: transferinAmount
            })
          } catch (e) {
            console.log("error", e);
          }
        }

        postData(
          "/app/site/hosting/restlet.nl?script=928&deploy=1",
          save_request,
          function(res) {
            if (res.success) {
              currentReceiptData = res;

              var myMsg = message.create({
                title: "SUCCESS",
                message: "Message Sucess",
                type: message.Type.CONFIRMATION,
              });

              myMsg.show();

              res.payments.forEach(function(c) {
                var myMsg;
                var invoice = c.source.invoice_text.replace("Invoice ", "");
                if (c.success) {
                  myMsg = message.create({
                    title: "Payment Created for invoice:" + invoice,
                    message: "Payment #REF:" + c.payment,
                    type: message.Type.CONFIRMATION,
                  });
                } else {
                  myMsg = message.create({
                    title: "Error Occurred while creating payment for invoice:" +
                      invoice,
                    message: c.error.name + ":" + c.error.message,
                    type: message.Type.ERROR,
                  });
                }

                myMsg.show();
              });

              // var count = currentRecord.getLineCount("custpage_pay_list");

              // console.log("count", count);
              // var total = 0;
              // for (var i = 0; i < count; i++) {
              //   var check = currentRecord.getSublistValue(
              //     "custpage_pay_list",
              //     "custpage_checkbox",
              //     i
              //   );
              //   if (check) {
              //   }
              // }
            } else {
              var myMsg = message.create({
                title: "Error",
                message: "Please Check console for more information",
                type: message.Type.ERROR,
              });

              myMsg.show();
            }
          }
        );

      }
    }
    return true;
  }

  exports.fieldChanged = fieldChanged;
  exports.pageInit = pageInit;
  // exports.saveRecord = saveRecord;
  exports.sublistChanged = sublistChanged;

  return exports;
});