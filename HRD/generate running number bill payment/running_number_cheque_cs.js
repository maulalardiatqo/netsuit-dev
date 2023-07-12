/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/ui/message', 'N/currentRecord', 'N/record', 'N/ui/dialog', 'N/url', 'N/format'], function(search, message, currentRecord, record, dialog, url, format) {

  var currRecord = currentRecord.get();

  function pageInit(context) {}

  function generateNumber() {
    console.log("execute");
    var numberSearch = search.load({
      id: "customsearch_sol_runnumber_cheque",
    });
    var numberSearchSet = numberSearch.run();
    numberSearch = numberSearchSet.getRange({
      start: 0,
      end: 1
    });
    console.log("numberSearch", numberSearch.length);
    for (var i in numberSearch) {
      var py = numberSearch[i];
      var lastNumber = py.getValue(numberSearchSet.columns[0]);
      console.log("lastNumber", lastNumber);
      var newNumber = parseInt(lastNumber) + 1;
      var paddedNumber = String(newNumber).padStart(lastNumber.length, '0');
      console.log("newNumber", paddedNumber);
      var rec = currentRecord.get();
      var idRec = rec.id;
      console.log('idRec', idRec)
      var numberRecord = record.load({
        type: "vendorpayment",
        id: idRec
      });
      var cekGenerate = numberRecord.getValue('custbody_sol_etris_cheque');
      console.log('cekGenerate', cekGenerate);
      if(cekGenerate){
        console.log('masuk kondisi cek generate')
        var runningNumer = {
          title: "Alert",
          message: 'Running number cheque already exist'
        };
        dialog.alert(runningNumer);
        return;
      }
      console.log('rectoEx', numberRecord);
      numberRecord.setValue({
        fieldId: 'custbody_sol_etris_cheque',
        value: paddedNumber
      });
    }

    var recordID = numberRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: true
    });

    if (recordID) {
      console.log(recordID);

      function success() {
        window.location.reload();
      }

      function failure(reason) {
        console.log("Failure: " + reason);
      }
      var success_dialog = {
        title: "Runing Number Cheque",
        message: 'Running number ' + paddedNumber + ' generated successfully',
      };
      dialog.alert(success_dialog).then(success).catch(failure);

    }
  }

  function voidCustomJournal() {
    console.log("voidCustomJournal");
    var loadingMessage = message.create({
      title: 'Please wait...',
      message: 'Processing your request...',
      type: message.Type.CONFIRMATION
    });
    loadingMessage.show();

    setTimeout(function() {
      voidProcess().then(function() {
        // Remove the loading message
        loadingMessage.hide();
      });
    }, 1000); // Change the delay time as needed
  }

  function voidProcess() {
    return new Promise(function(resolve, reject) {
      try {
        var transid = currRecord.id;
        var depoRec = record.load({
          type: "vendorpayment",
          id: transid,
          isDynamic: true
        });
        var costCenter = depoRec.getValue("department");
        var entityName = depoRec.getValue("entity");
        var accountBill = depoRec.getValue("account");
        var tranID = depoRec.getValue("tranid");
        function sysDate() {
          var date = new Date();
          var tdate = date.getUTCDate();
          var month = date.getUTCMonth() + 1; // jan = 0
          var year = date.getUTCFullYear();
          log.debug("tdate month year", tdate + '/' + month + '/' + year);
          
          return tdate + '/' + month + '/' + year;
        }
        let today = sysDate();
        today = format.parse({value:today, type: format.Type.DATE});
        console.log('today', today);

        var glBillPaymentSearch = search.load({
          id: "customsearch_sol_gl_bill_payment",
        });
        glBillPaymentSearch.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.IS,
          values: transid
        }, ));
        var glBillPaymentSearchSet = glBillPaymentSearch.run();
        glBillPaymentSearch = glBillPaymentSearchSet.getRange({
          start: 0,
          end: 2
        });
        console.log("glBillPaymentSearch", glBillPaymentSearch);
        var amountCredit;
        var amountDebit;
        var accountCredit;
        var accountDebit;
        for (var i in glBillPaymentSearch) {
          var py = glBillPaymentSearch[i];
          if (i == 0) {
            amountCredit = Number(py.getValue(glBillPaymentSearchSet.columns[2]));
            accountCredit = Number(py.getValue(glBillPaymentSearchSet.columns[4]));
          } else {
            amountDebit = Number(py.getValue(glBillPaymentSearchSet.columns[3]));
            accountDebit = Number(py.getValue(glBillPaymentSearchSet.columns[4]));
          }
        }

        console.log("dataa", {
          amountCredit: amountCredit,
          amountDebit: amountDebit,
          accountCredit: accountCredit,
          accountDebit: accountDebit
        });

        if (!accountCredit) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Credit"
          };
          dialog.alert(failed_dialog);
          return;
        }

        if (!accountDebit) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Debit"
          };
          dialog.alert(failed_dialog);
          return;
        }

        var rec_JE = record.create({
          type: "customtransaction_sol_custom_journal",
          isDynamic: true,
        });

        rec_JE.setValue({
          fieldId: 'memo',
          value: 'Void on ' + format.format({value:today, type: format.Type.DATE}),
          ignoreFieldChange: true
        });

        console.log("after set memo");

        //credit 1
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: accountCredit,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'department',
          value: costCenter,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'entity',
          value: entityName,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: amountDebit,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end credit 1
        console.log("after credit 1");

        //debit
        rec_JE.selectNewLine({
          sublistId: 'line',
        });
        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: accountDebit,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'department',
          value: costCenter,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'entity',
          value: entityName,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: amountCredit,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end debit

        console.log("after debit 1");

        var jeID = rec_JE.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        console.log("save JE");
        if (jeID) {
          var rec_JE2 = record.load({
            type: 'customtransaction_sol_custom_journal',
            id: jeID,
            isDynamic: true,
          });
          rec_JE2.setValue({
            fieldId: 'transtatus',
            value: 'B',
          });
          rec_JE2.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var newDepoRec = record.load({
            type: "vendorpayment",
            id: transid,
            isDynamic: true
          });
          newDepoRec.setValue({
            fieldId: "custbody_void_custom_journal",
            value: jeID,
          });

          let lineCount = newDepoRec.getLineCount({
            sublistId: 'apply'
          });
          console.log("lineCount", lineCount);

          for (let i = 0; i < lineCount; i++) {
            newDepoRec.selectLine({
              sublistId: 'apply',
              line: i
            });
            let billid = newDepoRec.getCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'internalid'
            });
            console.log("billid", {
              billid: billid,
              jeID: jeID
            });

            if (billid == jeID) {
              newDepoRec.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                value: true
              });
            } else {
              newDepoRec.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                value: false
              });
            }

          }
          var saveBill = newDepoRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var jeURL = url.resolveRecord({
            isEditMode: true,
            recordId: jeID,
            recordType: 'customtransaction_sol_custom_journal'
          });

          var success_dialog = {
            title: "Process Result",
            message: `Successfully created Custom Journal Void <a href="${jeURL}" target="_blank">${jeID}</a>`,
          };

          function success(result) {
            window.location.reload();
          }

          function failure(reason) {
            console.log('Failure: ' + reason);
          }
          dialog.alert(success_dialog).then(success).catch(failure);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  return {
    pageInit: pageInit,
    generateNumber: generateNumber,
    voidCustomJournal: voidCustomJournal
  };

});