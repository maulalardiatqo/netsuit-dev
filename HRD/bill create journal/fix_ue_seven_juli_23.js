/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/search', 'N/record', 'N/task'], function (serverWidget, runtime, search, record, task) {

  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      try {
        var rec = context.newRecord;
        var journalBill = rec.getValue('custbody_bill_journal_link');
        var creditAccountParams = runtime.getCurrentScript().getParameter('custscript_credit_account');
        var debitAccountParams = runtime.getCurrentScript().getParameter('custscript_debit_account');
        var form = context.form;

        var applyCount = rec.getLineCount({
          sublistId: 'apply'
        });
        log.debug('applyCount', applyCount);
        if (applyCount > 0) {
          for (var index = 0; index < applyCount; index++) {
            var isApply = rec.getSublistValue({
              sublistId: 'apply',
              fieldId: 'apply',
              line: index
            });
            log.debug('isApply', isApply);
            if (isApply === true) {
              var typeSublist = rec.getSublistValue({
                sublistId: 'apply',
                fieldId: 'trantype',
                line: index
              });
              log.debug('typeSublist', typeSublist);
              if (typeSublist === 'VendBill') {
                var internalIdBill = rec.getSublistValue({
                  sublistId: 'apply',
                  fieldId: 'internalid',
                  line: index
                });
                var amountPayment = rec.getSublistValue({
                  sublistId: 'apply',
                  fieldId: 'amount',
                  line: index
                });
                log.debug('internalId', internalIdBill);
                if (internalIdBill) {
                  var recordBill = record.load({
                    type: 'vendorbill',
                    id: internalIdBill,
                    isDynamic: false,
                  });
                  var statusBill = recordBill.getValue('status');

                  var itemCount = recordBill.getLineCount({
                    sublistId: 'item'
                  });

                  log.debug('itemCount', itemCount);
                  var totalAmountBill = 0;
                  if (itemCount > 0) {
                    for (var indexBill = 0; indexBill < itemCount; indexBill++) {
                      var amountBill = recordBill.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: indexBill
                      });
                      log.debug('amountBill', amountBill);
                      totalAmountBill += amountBill;
                    }
                    log.debug('totalAmountBill', totalAmountBill);
                  }
                  log.debug('totalAmountBill', totalAmountBill);
                  log.debug('statusBill', statusBill);

                  // form.addButton({
                  //   id: 'custpage_create_journal_button',
                  //   label: 'Create Journal',
                  //   functionName: 'createJournal(' + internalIdBill + ','+creditAccountParams+', '+debitAccountParams+')'
                  // });

                  // context.form.clientScriptModulePath = 'SuiteScripts/abj_call_sl_payment_journal.js';
                  
                  if (statusBill === 'Open' && amountPayment !== totalAmountBill) {
                    form.addButton({
                      id: 'custpage_create_journal_button',
                      label: 'Create Journal',
                      functionName: 'createJournal(' + internalIdBill + ','+creditAccountParams+', '+debitAccountParams+')'
                    });

                    context.form.clientScriptModulePath = 'SuiteScripts/abj_call_sl_payment_journal.js';
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        log.error({
          title: 'Error in beforeLoad',
          details: error.message
        });
      }
    }
  }

  
  return {
    beforeLoad: beforeLoad,
  };
});
