/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', 'N/record', 'N/search', 'N/error'], (runtime, log, record, search, error) => {
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.EDIT) {
      try {
        let rec = scriptContext.newRecord;
        let accountID = rec.getValue("account");
        log.debug("accountID", accountID);
        log.debug('test', rec);
        let accountSearch = search.create({
          type: "account",
          filters: [
            ["internalid", "is", accountID],
          ],
          columns: [
            search.createColumn({
              name: "balance",
            }),
          ]
        }).run().getRange(0, 1);
        log.debug("accountSearch", accountSearch);
        if (accountSearch.length > 0) {
          let balanceAccount = accountSearch[0].getValue('balance');
          log.debug("balanceAccount", balanceAccount);
          rec.setValue({
            fieldId: "custbody_sol_rpv_cur_bal",
            value: balanceAccount,
          });
        } else {
          log.debug("Account not found", true);
        }
      } catch (error) {
        log.error({
          title: 'beforeLoad',
          details: error.message
        });
      }
    }
  }

  function beforeSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE) {
      let rec = scriptContext.newRecord;
      let accountID = rec.getValue("account");
      log.debug("accountID", accountID);
      let totalItems = rec.getLineCount({
        sublistId: "item",
      });
      let totalExpense = rec.getLineCount({
        sublistId: "expense",
      });
      let totalAmountItems = 0;
      let totalAmountExpenses = 0;
      for (var i = 0; i < totalItems; i++) {
        let amountItem = rec.getSublistValue({
          sublistId: "item",
          fieldId: "amount",
          line: i,
        });
        totalAmountItems += amountItem;
      }

      for (var i = 0; i < totalExpense; i++) {
        let amountExpense = rec.getSublistValue({
          sublistId: "expense",
          fieldId: "amount",
          line: i,
        });
        totalAmountExpenses += amountExpense;
      }

      let sumTotalTrans = totalAmountItems + totalAmountExpenses;
      log.debug("sumTotalTrans", sumTotalTrans);

      let accountSearch = search.create({
        type: "account",
        filters: [
          ["internalid", "is", accountID],
        ],
        columns: [
          search.createColumn({
            name: "balance",
          }),
        ]
      }).run().getRange(0, 1);
      log.debug("accountSearch", accountSearch);
      if (accountSearch.length > 0) {
        let balanceAccount = accountSearch[0].getValue('balance');
        log.debug("balanceAccount", balanceAccount);
        let validateBalance = parseFloat(balanceAccount) - parseFloat(sumTotalTrans);
        log.debug("validateBalance", validateBalance);
        if (validateBalance < 0) {
          log.debug("create error", true);
          var update_process_error = error.create({
            name: 'Recoup Petty Cash Error : ',
            message: 'You have insufficient petty cash balance',
            notifyOff: true
          });
          throw update_process_error.name + '\n\n' + update_process_error.message + "\n";
        } else {
          rec.setValue({
            fieldId: "custbody_sol_rpv_cur_bal",
            value: balanceAccount,
          });
        }
      } else {
        log.debug("Account not found", true);
      }
    }
  }

  function afterSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE) {
      let rec = scriptContext.newRecord;
      let accountID = rec.getValue("account");
      log.debug("accountID", accountID);
      let accountSearch = search.create({
        type: "account",
        filters: [
          ["internalid", "is", accountID],
        ],
        columns: [
          search.createColumn({
            name: "balance",
          }),
        ]
      }).run().getRange(0, 1);
      log.debug("accountSearch", accountSearch);
      if (accountSearch.length > 0) {
        let balanceAccount = accountSearch[0].getValue('balance');
        log.debug("balanceAccount", balanceAccount);
        rec.setValue({
          fieldId: "custbody_sol_rpv_cur_bal",
          value: balanceAccount,
        });
        rec.save({
          enableSourcing: false,
          ignoreMandatoryFields: true
        });
      } else {
        log.debug("Account not found", true);
      }
    }
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    // afterSubmit: afterSubmit
  };
});