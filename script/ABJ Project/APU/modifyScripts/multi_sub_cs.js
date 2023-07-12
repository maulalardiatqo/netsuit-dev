/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/search", "N/ui/message"], function(search, message) {
  var currentRecord, currentReceiptData;
  var printButton;

  function pageInit(context) {
    console.log(context);
    currentRecord = context.currentRecord;
    printButton = currentRecord.getField({
      fieldId: "custpage_receipt_btn",
    });
    printButton.isDisabled = true;
    setInterval(function() {
      updateQty();
    }, 2000);
  }

  function updateQty() {
    if (currentRecord) {
      var count = currentRecord.getLineCount("custpage_pay_list");

      // console.log("count", count);
      var total = 0;
      for (var i = 0; i < count; i++) {
        var check = currentRecord.getSublistValue(
          "custpage_pay_list",
          "custpage_checkbox",
          i
        );
        if (check)
          total += parseFloat(
            currentRecord.getSublistValue(
              "custpage_pay_list",
              "custpage_pay_amt",
              i
            ) || 0
          );
      }

      currentRecord.setValue({
        fieldId: "custpage_total",
        value: total,
      });
    }
  }

  function fieldChanged(context) {
    if (context.fieldId == "custpage_pay_amt") {
      updateQty();
    }

    if (context.fieldId == "custpage_checkbox") {
      var check_box_ticked =
        currentRecord.getSublistValue({
          sublistId: "custpage_pay_list",
          fieldId: "custpage_checkbox",
          line: context.line,
        }) || 0;

      if (check_box_ticked) {
        var amount =
          currentRecord.getSublistValue({
            sublistId: "custpage_pay_list",
            fieldId: "custpage_tran_unpaid",
            line: context.line,
          }) || 0;
        currentRecord.selectLine({
          sublistId: "custpage_pay_list",
          line: context.line,
        });

        currentRecord.setCurrentSublistValue({
          sublistId: "custpage_pay_list",
          fieldId: "custpage_pay_amt",
          value: amount,
        }) || 0;
      } else {

        currentRecord.setCurrentSublistValue({
          sublistId: "custpage_pay_list",
          fieldId: "custpage_pay_amt",
          value: "",
        }) || 0;

      }
    }
    return true;
  }

  function getTotal() {
    var count = currentRecord.getLineCount("custpage_pay_list");

    console.log("count", count);
    var total = 0;
    for (var i = 0; i < count; i++) {
      var check = currentRecord.getSublistValue(
        "custpage_pay_list",
        "custpage_checkbox",
        i
      );
      if (check) {
        total += parseFloat(
          currentRecord.getSublistValue(
            "custpage_pay_list",
            "custpage_pay_amt",
            i
          ) || 0
        );
      } else {

        total += parseFloat(
          currentRecord.getSublistValue(
            "custpage_pay_list",
            "custpage_pay_amt",
            i
          ) || 0

        );


      }
    }

    return total;
  }

  function createPayment() {
    console.log("createPayment");
    var count = currentRecord.getLineCount("custpage_pay_list");
    var totalNok = 0;
    var bodyAlert = "";
    for (var i = 0; i < count; i++) {
      var check = currentRecord.getSublistValue(
        "custpage_pay_list",
        "custpage_checkbox",
        i
      );
      var paymentMethod = currentRecord.getSublistValue(
        "custpage_pay_list",
        "custpage_pay_method",
        i
      );
      var reference = currentRecord.getSublistValue(
        "custpage_pay_list",
        "custpage_reference",
        i
      );
      var costcenter = currentRecord.getSublistValue(
        "custpage_pay_list",
        "custpage_costcenter",
        i
      );
      var invoiceNumber = currentRecord.getSublistText(
        "custpage_pay_list",
        "custpage_document",
        i
      );
      if (check && (!paymentMethod || !reference || !costcenter)) {
        totalNok++;
        bodyAlert += `\n${invoiceNumber}`;
      }
    }
    if (totalNok <= 0) {
      var answer = confirm("Are you sure want to continue?");

      if (answer) {
        var save_request = {
          entity: currentRecord.getValue("custpage_customer"),
          debit_account: currentRecord.getValue("custpage_account"),
          date: currentRecord.getValue("custpage_date"),
          total: currentRecord.getValue("custpage_total"),
          pay_total: getTotal(),
          apply: [],
        };

        if (save_request.entity && save_request.pay_total > 0) {
          var myMsg = message.create({
            title: "Processing",
            message: "Please Wait",
            type: message.Type.CONFIRMATION, //INFORMATION
          });

          myMsg.show({
            duration: 15000, // will disappear after 5s
          });

          var count = currentRecord.getLineCount("custpage_pay_list");

          for (var i = 0; i < count; i++) {
            var check = currentRecord.getSublistValue(
              "custpage_pay_list",
              "custpage_checkbox",
              i
            );
            if (check) {
              save_request.apply.push({
                subsidiary: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_subsidiary",
                  i
                ),
                total: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_tran_total",
                  i
                ),
                unpaid: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_tran_unpaid",
                  i
                ),
                invoice: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_document",
                  i
                ),
                invoice_text: currentRecord.getSublistText(
                  "custpage_pay_list",
                  "custpage_document",
                  i
                ),
                amount: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_pay_amt",
                  i
                ),
                payment_method: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_pay_method",
                  i
                ),
                reference: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_reference",
                  i
                ),
                costcenter: currentRecord.getSublistValue(
                  "custpage_pay_list",
                  "custpage_costcenter",
                  i
                ),
              });
            }
          }

          console.log("request", save_request);

          postData(
            "/app/site/hosting/restlet.nl?script=928&deploy=1",
            save_request,
            function(res) {
              if (res.success) {
                printButton.isDisabled = false;
                currentReceiptData = res;

                var myMsg = message.create({
                  title: "SUCCESS",
                  message: "Journal Created: #REF:" + res.journal,
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
        } else {
          alert("Error:invalid payment parameters. Please try again");
        }
      }
    } else {
      alert(`Please make sure you have filled in payment method, reference, and cost center for Invoice NO ${bodyAlert}`);
    }
  }

  function printReceipt() {
    try {
      console.log(currentReceiptData);

      if (currentReceiptData) {
        var payments = currentReceiptData.payments.map(function(c) {
          return {
            payment: c.payment,
            invoice: c.source.invoice
          };
        });

        var url = "/app/site/hosting/scriptlet.nl?script=929&deploy=1";
        url += "&journal=" + currentReceiptData.journal;
        url += "&payments=" + JSON.stringify(payments);
        url += "&entity=" + currentRecord.getValue("custpage_customer");

        console.log(url);

        window.open(url);
      } else {
        alert("Please make payment first and print receipt");
      }
    } catch (e) {
      console.error("err", e);

      alert(
        "error occurred while printing receipt. Please see console for more info"
      );
    }
  }

  function gotoPaymentPage() {
    var answer = confirm(
      "Are you sure want to continue? This will navigate to multisubsidiary Payment Page?"
    );

    if (answer) {
      var url = nlapiResolveURL(
        "SUITELET",
        "customscript_multi_subs_pmt_page_sjt",
        "customdeploy_multi_subs_pmt_page_sjt"
      );
      url += "&customer=" + nlapiGetRecordId();
      window.open(url);
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    createPayment: createPayment,
    printReceipt: printReceipt,
    gotoPaymentPage: gotoPaymentPage,
  };
});

// Example POST method implementation:
function postData(url, data, cb) {
  // Default options are marked with *
  const request = fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });

  request.then(function(res) {
    var res_json_req = res.json();

    res_json_req.then(function(data) {
      console.log(data);

      cb(data);
    });
  });
}