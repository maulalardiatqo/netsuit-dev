/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', 'N/record', 'N/search', 'N/error'], (runtime, log, record, search, error) => {
  function beforeLoad(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.VIEW ) {
      try {
        let rec = scriptContext.newRecord;
        let selectedBranch = rec.getValue("custbody_sol_rpv_branch");
        let suppRec = record.load({
          type: 'vendor',
          id: selectedBranch,
          isDynamic: true
        });
        var pettyCasAccount = suppRec.getValue("custentity_sol_pc_acc");
        let accountID = rec.getValue("account");
        log.debug("pettyCasAccount", pettyCasAccount);
        rec.setValue({
          fieldId: "custbody_account_branch",
          value: pettyCasAccount,
        });
        var cek = rec.getValue('custbody_account_branch_balance');
        log.debug('cek', cek)
       
        // SET Current Petty Cash Balance
        let accountSearch = search.create({
          type: "account",
          filters: [
            ["internalid", "is", pettyCasAccount],
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
          rec.setValue({
            fieldId: "custbody_account_branch_balance",
            value: balanceAccount,
          });
          if(scriptContext.type === scriptContext.UserEventType.VIEW && !cek ){
            log.debug('script', rec.id)
            var curRecord = record.load({
              type: 'custompurchase_sol_pc_recoup',
              id: rec.id
            })
            log.debug('in')
            curRecord.setValue({
              fieldId: "custbody_account_branch_balance",
              value: balanceAccount,
            });
            curRecord.save({
              enableSourcing: false,
              ignoreMandatoryFields: true
            })
          }
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
      // let accountID = rec.getValue("account");
      let accountIDGet = rec.getValue("custbody_account_branch");
      let balanceGet = rec.getValue("custbody_account_branch_balance");
      log.debug("cekBalance", balanceGet);
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
        rec.setSublistValue({
          sublistId: "expense",
          fieldId: "taxcode",
          line: i,
          value: 5
        });
        totalAmountExpenses += amountExpense;
      }

      let sumTotalTrans = totalAmountItems + totalAmountExpenses;
      log.debug("sumTotalTrans", sumTotalTrans);

      // let accountSearch = search.create({
      //   type: "account",
      //   filters: [
      //     ["internalid", "is", accountID],
      //   ],
      //   columns: [
      //     search.createColumn({
      //       name: "balance",
      //     }),
      //   ]
      // }).run().getRange(0, 1);
      // log.debug("accountSearch", accountSearch);
      if (accountIDGet) {
        // let balanceAccount = accountSearch[0].getValue('balance');
        // log.debug("balanceAccount", balanceAccount);
        let validateBalance = parseFloat(balanceGet) - parseFloat(sumTotalTrans);
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
            value: balanceGet,
          });
          rec.setValue({
            fieldId: "custbody_account_branch",
            value: accountIDGet,
          });
        }
      } else {
        log.debug("Account not found", true);
      }
    }
  }

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
  };
});