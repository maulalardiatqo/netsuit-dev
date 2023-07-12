/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        var jeBank = search.load({
          id: "customsearch_sol_je_bank_lines",
        });
        jeBank.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.IS,
            values: context.newRecord.id,
          })
        );
        var jeBankSet = jeBank.run();
        jeBank = jeBankSet.getRange(0, 100);
        log.debug("jeBankSet", jeBank);
        jeBank.forEach(function(row0) {
          var account = row0.getValue({
            name: jeBankSet.columns[1]
          });
          log.debug("account", account);
          if (account) {
            var amountBank = search.load({
              id: "customsearch878",
            });
            amountBank.filters.push(
              search.createFilter({
                name: "account",
                operator: search.Operator.IS,
                values: account,
              })
            );
            var amountBankSet = amountBank.run();
            amountBank = amountBankSet.getRange(0, 100);
            log.debug("amountBank", amountBank);

            var amountDebit = 0;
            var amountCredit = 0;
            var amountBalance = 0;
            var bankAccount;
            amountBank.forEach(function(row) {
              bankAccount = row.getValue({
                name: amountBankSet.columns[1]
              }) || 0;

              amountDebit = row.getValue({
                name: amountBankSet.columns[2]
              }) || 0;

              amountCredit = row.getValue({
                name: amountBankSet.columns[3]
              }) || 0;

              amountBalance = row.getValue({
                name: amountBankSet.columns[4]
              }) || 0;
            });

            log.debug("amountDebit", amountDebit);
            log.debug("amountCredit", amountCredit);
            log.debug("amountBalance", amountBalance);
            log.debug("bankAccount", bankAccount);

            var bankBalanceSearch = search.create({
              type: 'customrecord_sol_bank_balances',
              columns: [{
                name: 'internalid'
              }, {
                name: 'custrecord_sol_bb',
                sort: search.Sort.DESC
              }],
              filters: [{
                name: 'custrecord_sol_bb_bank_name',
                operator: 'is',
                values: account
              }, ]
            }).run().getRange({
              start: 0,
              end: 1
            });

            log.debug("bankBalanceSearch", bankBalanceSearch);

            bankBalanceSearch.forEach(function(bankBalance) {

              var internalIDBankBalance = bankBalance.getValue({
                name: 'internalid'
              })
              let bankBalanceRec = record.load({
                type: "customrecord_sol_bank_balances",
                id: internalIDBankBalance,
                isDynamic: true,
              });

              bankBalanceRec.setValue({
                fieldId: "custrecord_sol_bb_ns_bnk_bal",
                value: amountBalance,
                ignoreFieldChange: true,
              });

              bankBalanceRec.setValue({
                fieldId: "custrecord_sol_bb_amt_paid",
                value: amountCredit,
                ignoreFieldChange: true,
              });

              bankBalanceRec.setValue({
                fieldId: "custrecord_sol_bb_amt_rcvd",
                value: amountDebit,
                ignoreFieldChange: true,
              });

              let bankBalanceRecID = bankBalanceRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
              });
              log.debug("Sucess update bank balance", bankBalanceRecID);
            });
          }
        });
      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }
  return {
    afterSubmit: afterSubmit
  };
});