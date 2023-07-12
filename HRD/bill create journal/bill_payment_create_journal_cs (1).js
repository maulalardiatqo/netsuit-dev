/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */
define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/search", "N/format", "N/ui/message"],
  function(error, dialog, url, record, currentRecord, search, format, message) {
    var currRecord = currentRecord.get();

    function pageInit(context) {
      //console.log("test in");
    }

    function createJournal(creditAccountParams, debitAccountParams, internalIdBill) {
      var loadingMessage = message.create({
        title: 'Please wait...',
        message: 'Processing your request...',
        type: message.Type.CONFIRMATION
      });
      loadingMessage.show();

      setTimeout(function() {
        // Execute your custom process or function here
        createJournalProcess(creditAccountParams, debitAccountParams, internalIdBill).then(function() {
          // Remove the loading message
          loadingMessage.hide();
        });
      }, 1000); // Change the delay time as needed
    }

    function createJournalProcess(creditAccountParams, debitAccountParams, internalIdBill) {
      return new Promise(function(resolve, reject) {
        try {
          console.log("creditAccountParams", creditAccountParams);
          console.log("debitAccountParams", debitAccountParams);
          var transid = currRecord.id;
          console.log("transid", transid);

          var depoRec = record.load({
            type: "vendorbill",
            id: internalIdBill,
            isDynamic: true
          });
          var costCenter = depoRec.getValue("department");
          var entityName = depoRec.getValue("entity");
          var acountBill = depoRec.getValue("account");
          var APaccount = acountBill
          // var APaccount = parseInt(acountBill);
          var typeOfAc = typeof APaccount;

          if (typeOfAc === 'number') {
            console.log('Nilai adalah angka.');
          } else if (typeOfAc === 'string') {
            console.log('Nilai adalah string.');
          } else {
            console.log('Nilai bukan angka atau string.');
          }
          console.log('APacoount', APaccount);

          if (!APaccount) {
            var failed_dialog = {
              title: 'Error',
              message: "Please specify AP Account for Credit"
            };
            dialog.alert(failed_dialog);
            return;
          }

          if (!debitAccountParams) {
            var failed_dialog = {
              title: 'Error BANK GL',
              message: "Please specify G/L Account for Debit"
            };
            dialog.alert(failed_dialog);
            return;
          }

          var rec_JE = record.create({
            type: record.Type.JOURNAL_ENTRY,
            isDynamic: true,
          });

          var amountRemainingSearch = search.load({
            id: "customsearch_sol_bill_amount_remaining",
          });
          amountRemainingSearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: internalIdBill
          }, ));
          var amountRemainingSearchSet = amountRemainingSearch.run();
          amountRemainingSearch = amountRemainingSearchSet.getRange({
            start: 0,
            end: 100
          });
          console.log("amountRemainingSearch", amountRemainingSearch.length);
          var amountRemaining;
          for (var i in amountRemainingSearch) {
            var py = amountRemainingSearch[i];
            amountRemaining = Number(py.getValue(amountRemainingSearchSet.columns[1]));
          }
          console.log("amountRemaining", amountRemaining);

          //credit 1
          rec_JE.selectNewLine({
            sublistId: 'line',
          });

          rec_JE.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            value: APaccount,
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
              value: amountRemaining,
              ignoreFieldChange: true,
            });

          rec_JE.commitLine({
            sublistId: 'line'
          });
          // end credit 1

          //debit
          rec_JE.selectNewLine({
            sublistId: 'line',
          });
          rec_JE.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            value: debitAccountParams,
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
            value: amountRemaining,
            ignoreFieldChange: true,
          });

          rec_JE.commitLine({
            sublistId: 'line'
          });
          // end debit

          var jeID = rec_JE.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          console.log('jeID', jeID);
          if (jeID) {
            var rec_JE2 = record.load({
              type: record.Type.JOURNAL_ENTRY,
              id: jeID,
              isDynamic: true,
            });
            console.log('c');
            rec_JE2.setValue({
              fieldId: 'approvalstatus',
              value: 2,
            });
            console.log('c1');
            rec_JE2.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            console.log('c2');
            depoRec.setValue({
              fieldId: "custbody_bill_journal_link",
              value: jeID,
            });
            console.log('c3');
            var saveBill = depoRec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            console.log('savebill', saveBill);
            if (saveBill) {
              console.log('in con')
              var vendorPayRec = record.create({
                type: record.Type.VENDOR_PAYMENT,
                isDynamic: true,
              });
              console.log('s1');
              vendorPayRec.setValue({
                fieldId: 'department',
                value: costCenter
              });
              console.log('s2');
              vendorPayRec.setValue({
                fieldId: 'entity',
                value: entityName
              });
              console.log('s3');
              // vendorPayRec.setValue({
              //   fieldId: 'account',
              //   value: APaccount
              // });
              vendorPayRec.setValue({
                fieldId: 'apacct',
                value: APaccount
              });
              vendorPayRec.setValue({
                fieldId: 'custbody_bill_journal_link',
                value: jeID
              });
              console.log('finish setvalue if sve bill')
              let lineCount = vendorPayRec.getLineCount({
                sublistId: 'apply'
              });

              for (let i = 0; i < lineCount; i++) {
                vendorPayRec.selectLine({
                  sublistId: 'apply',
                  line: i
                });
                let billid = vendorPayRec.getCurrentSublistValue({
                  sublistId: 'apply',
                  fieldId: 'internalid'
                });

                if (billid == transid || billid == jeID) {
                  console.log('billid', billid)
                  vendorPayRec.setCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    value: true
                  });
                } else {
                  vendorPayRec.setCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    value: false
                  });
                }

              }

              let vendid = vendorPayRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
              });

              if (vendid) {
                var jeURL = url.resolveRecord({
                  isEditMode: true,
                  recordId: jeID,
                  recordType: record.Type.JOURNAL_ENTRY
                });
                console.log(jeURL);
                console.log(jeID);
                var billPaymentURL = url.resolveRecord({
                  isEditMode: true,
                  recordId: vendid,
                  recordType: record.Type.VENDOR_PAYMENT
                });
                console.log('billPaymentURL', billPaymentURL)

                var success_dialog = {
                  title: "Process Result",
                  message: `Successfully created Journal <a href="${jeURL}" target="_blank">${jeID}</a><br/>created Bill Payment <a href="${billPaymentURL}" target="_blank">${vendid}</a>`,
                };

                function success(result) {
                  window.location.reload();
                }

                function failure(reason) {
                  console.log('Failure: ' + reason);
                }
                dialog.alert(success_dialog).then(success).catch(failure);
              }
            }
          }
          resolve();
        } catch (e) {
          console.log("Error when generating Journal", e.name + ' : ' + e.message);
          var failed_dialog = {
            title: 'Process Result',
            message: "Error generating Journal, " + e.name + ' : ' + e.message
          };
          dialog.alert(failed_dialog);
          reject();
        }
      });
    }

    return {
      pageInit: pageInit,
      createJournal: createJournal
    };
  });