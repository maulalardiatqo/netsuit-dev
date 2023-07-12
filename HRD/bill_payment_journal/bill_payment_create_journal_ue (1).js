/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', "N/runtime", "N/search"], function(serverWidget, runtime, search) {

  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      try {
        var rec = context.newRecord;
        var journalBill = rec.getValue("custbody_bill_journal_link");
        var creditAccountParams = runtime.getCurrentScript().getParameter("custscript_credit_account");
        var debitAccountParams = runtime.getCurrentScript().getParameter("custscript_debit_account");
        var form = context.form;
        var status = rec.getValue('status');

        var amountRemainingSearch = search.load({
          id: "customsearch_sol_bill_amount_remaining",
        });
        amountRemainingSearch.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.IS,
          values: rec.id
        }, ));
        var amountRemainingSearchSet = amountRemainingSearch.run();
        amountRemainingSearch = amountRemainingSearchSet.getRange({
          start: 0,
          end: 100
        });
        log.debug("amountRemainingSearch", amountRemainingSearch.length);
        var amountRemaining;
        for (var i in amountRemainingSearch) {
          var py = amountRemainingSearch[i];
          amountRemaining = Number(py.getValue(amountRemainingSearchSet.columns[1]));
        }
        log.debug('status', status);
        // Paid In Full
        log.debug("amountRemaining", amountRemaining);
        // if (amountRemaining > 0) {
        //   form.addButton({
        //     id: 'custpage_create_journal_button',
        //     label: 'Create Journal',
        //     functionName: 'createJournal(' + creditAccountParams + ', ' + debitAccountParams + ')'
        //   });
        // }
         if (status === 'Paid In Full') {
          form.addButton({
            id: 'custpage_create_journal_button',
            label: 'Create Journal',
            functionName: 'createJournal(' + creditAccountParams + ', ' + debitAccountParams + ')'
          });
        }
        context.form.clientScriptModulePath = 'SuiteScripts/bill_payment_create_journal_cs.js';
      } catch (error) {
        log.error({
          title: 'custpage_create_journal_button',
          details: error.message
        });
      }
    }
  }

  return {
    beforeLoad: beforeLoad
  };
});