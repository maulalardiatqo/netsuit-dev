/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@NModuleScope SameAccount
 */
 define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/search", "N/format", "N/ui/message", "N/log", "N/ui/serverWidget"],
 function(error, dialog, url, record, search, format, message, log, serverWidget) {

   function onRequest(context) {
    try{
        var request = context.request;
        var response = context.response;

     var internalIdBill = request.parameters.internalIdBill;
     var debitAccountParams = request.parameters.debitAccountParams;
     var creditAccountParams = request.parameters.creditAccountParams;
     log.debug('internalIdBill', internalIdBill);

     var transid = internalIdBill;
     var depoRec = record.load({
       type: "vendorbill",
       id: internalIdBill,
       isDynamic: true
     });
     var costCenter = depoRec.getValue("department");
     var entityName = depoRec.getValue("entity");
     var acountBill = depoRec.getValue("account");
     var APaccount = acountBill;
     var typeOfAc = typeof APaccount;

     if (typeOfAc === 'number') {
       log.debug('My Log', 'Nilai adalah angka.');
     } else if (typeOfAc === 'string') {
       log.debug('My Log', 'Nilai adalah string.');
     } else {
       log.debug('My Log', 'Nilai bukan angka atau string.');
     }
     log.debug('My Log', 'APacoount: ' + APaccount);

     if (!APaccount) {
       var failed_dialog = {
         title: 'Error',
         message: "Please specify AP Account for Credit"
       };
       dialog.alert(failed_dialog).then(function(result) {
         response.write(JSON.stringify(result));
       }).catch(function(reason) {
         log.debug('Failure', reason);
       });
       return;
     }

     if (!debitAccountParams) {
       var failed_dialog = {
         title: 'Error BANK GL',
         message: "Please specify G/L Account for Debit"
       };
       dialog.alert(failed_dialog).then(function(result) {
         response.write(JSON.stringify(result));
       }).catch(function(reason) {
         log.debug('Failure', reason);
       });
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
     }));
     var amountRemainingSearchSet = amountRemainingSearch.run();
     amountRemainingSearch = amountRemainingSearchSet.getRange({
       start: 0,
       end: 100
     });
     log.debug('My Log', 'amountRemainingSearch: ' + amountRemainingSearch.length);
     var amountRemaining;
     for (var i in amountRemainingSearch) {
       var py = amountRemainingSearch[i];
       amountRemaining = Number(py.getValue(amountRemainingSearchSet.columns[1]));
     }
     log.debug('My Log', 'amountRemaining: ' + amountRemaining);

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
     log.debug('My Log', 'jeID: ' + jeID);
     if (jeID) {
       var rec_JE2 = record.load({
         type: record.Type.JOURNAL_ENTRY,
         id: jeID,
         isDynamic: true,
       });
       log.debug('My Log', 'c');
       rec_JE2.setValue({
         fieldId: 'approvalstatus',
         value: 2,
       });
       log.debug('My Log', 'c1');
       rec_JE2.save({
         enableSourcing: true,
         ignoreMandatoryFields: true
       });
       log.debug('My Log', 'c2');
       depoRec.setValue({
         fieldId: "custbody_bill_journal_link",
         value: jeID,
       });
       log.debug('My Log', 'c3');
       var saveBill = depoRec.save({
         enableSourcing: true,
         ignoreMandatoryFields: true
       });
       log.debug('My Log', 'savebill: ' + saveBill);
       if (saveBill) {
         log.debug('My Log', 'in con');
         var vendorPayRec = record.create({
           type: record.Type.VENDOR_PAYMENT,
           isDynamic: true,
         });
         log.debug('My Log', 's1');
         vendorPayRec.setValue({
           fieldId: 'department',
           value: costCenter
         });
         log.debug('My Log', 's2');
         vendorPayRec.setValue({
           fieldId: 'entity',
           value: entityName
         });
         log.debug('My Log', 's3');
         vendorPayRec.setValue({
           fieldId: 'apacct',
           value: APaccount
         });
         vendorPayRec.setValue({
           fieldId: 'custbody_bill_journal_link',
           value: jeID
         });
         log.debug('My Log', 'finish setvalue if sve bill');
         let lineCount = vendorPayRec.getLineCount({
           sublistId: 'apply'
         });
         log.debug('lineCount', lineCount)
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

         var vendid = vendorPayRec.save({
           enableSourcing: false,
           ignoreMandatoryFields: true
         });
         log.debug('vendid', vendid);
         if (vendid) {
            log.debug('masuk', vendid)
           var jeURL = url.resolveRecord({
             isEditMode: true,
             recordId: jeID,
             recordType: record.Type.JOURNAL_ENTRY
           });
           
           var billPaymentURL = url.resolveRecord({
             isEditMode: true,
             recordId: vendid,
             recordType: record.Type.VENDOR_PAYMENT
           });
           log.debug('My Log', 'billPaymentURL: ' + billPaymentURL);

            var myMessage = message.create({
                title: 'Process Result',
                message: `Successfully created Journal <a href="${jeURL}" target="_blank">${jeID}</a><br/>created Bill Payment <a href="${billPaymentURL}" target="_blank">${vendid}</a>`,
                type: message.Type.CONFIRMATION 
            });

            var form = serverWidget.createForm({
                title: 'Result Process'
            });

            form.addPageInitMessage({
                message: myMessage
            });

            context.response.writePage(form);
         }
        }
      }

    }catch(error){
        var errorMessage = message.create({
            title: "Process Result",
            message: 'Error when create Journal Couse '+error+'',
            type: message.Type.ERROR
          });
          var form = serverWidget.createForm({
            title: 'Result Process'
        });

        form.addPageInitMessage({
            message: errorMessage
        });

        context.response.writePage(form);
    }
     
   }

   return {
     onRequest: onRequest
   };
 });
