/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */
define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/search", "N/format"],
  function(error, dialog, url, record, currentRecord, search, format) {
    var currRecord = currentRecord.get();

    function pageInit(context) {
      //console.log("test in");
    }

    function withdrawalPosting(creditAccountParams) {
      try {
        console.log("creditAccountParams", creditAccountParams);
        var transid = currRecord.id;
        console.log("transid", transid);

        var depoRec = record.load({
          type: "customrecord_sol_invst_fixed_deposits",
          id: transid,
          isDynamic: true
        });

        var invstBank = depoRec.getValue("custrecord_sol_invtr_fd_bank_fin_insti");
        console.log("invstBank", invstBank);
        // Load Record Bank
        var recBank = record.load({
          type: "customrecord_sol_invst_bank_master_data",
          id: invstBank,
          isDynamic: true
        });
        var bankGl = recBank.getValue("custrecord_sol_bank_master_bankgl");
        var bankName = recBank.getValue("custrecord_sol_invst_bmd_name");
        var bankFD = recBank.getValue("custrecord_sol_bank_master_fd");

        console.log("after bank record");

        if (!bankGl) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Bank: " + bankName + " before create deposit journal"
          };
          dialog.alert(failed_dialog);
          return;
        }

        if (!bankFD) {
          var failed_dialog = {
            title: 'Error BANK FD',
            message: "Please specify FD Account for Bank: " + bankName + " before create deposit journal"
          };
          dialog.alert(failed_dialog);
          return;
        }

        var rec_JE = record.create({
          type: record.Type.JOURNAL_ENTRY,
          isDynamic: true,
        });

        var invstAmountWithdraw = depoRec.getValue("custrecord_sol_fd_withdraw") || 0;
        var invstAmountTotalInterest = depoRec.getValue("custrecord_sol_invtr_fd_proft_maturty_dt") || 0;
        var invstAmountDebit = parseFloat(invstAmountWithdraw) + parseFloat(invstAmountTotalInterest);

        console.log("amount");

        if (!invstAmountWithdraw) {
          var failed_dialog = {
            title: 'Error Withdrawal',
            message: "Please specify the WITHDRAWAL amount"
          };
          dialog.alert(failed_dialog);
          return;
        }

        if (!invstAmountTotalInterest) {
          var failed_dialog = {
            title: 'Error Total',
            message: "Please specify the TOTAL INTEREST/ PROFIT ON MATURITY DATE amount"
          };
          dialog.alert(failed_dialog);
          return;
        }

        //credit 1
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        // var creditAccnt = creditAccountParams;
        // console.log("creditAccnt", creditAccnt);
        // var srcAccount = search.create({
        //   type: 'account',
        //   columns: ['internalid'],
        //   filters: [{
        //     name: 'number',
        //     operator: 'is',
        //     values: creditAccnt
        //   }, ]
        // }).run().getRange({
        //   start: 0,
        //   end: 1
        // });
        var creditAccnt_id = creditAccountParams;

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: creditAccnt_id,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: invstAmountTotalInterest,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end credit 1

        //credit 2
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: bankFD,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: invstAmountWithdraw,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end credit 2

        //debit
        rec_JE.selectNewLine({
          sublistId: 'line',
        });
        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: bankFD,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: invstAmountDebit.toFixed(2),
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

        if (jeID) {
          depoRec.setValue({
            fieldId: "custrecord_sol_invtr_fd_journal_link2",
            value: jeID,
          });

          depoRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var jeURL = url.resolveRecord({
            isEditMode: true,
            recordId: jeID,
            recordType: record.Type.JOURNAL_ENTRY
          });
          console.log("jeURL", jeURL)
          window.location.replace(jeURL);
        }
      } catch (e) {
        console.log("Error when generating Journal", e.name + ' : ' + e.message);
        var failed_dialog = {
          title: 'Process Result',
          message: "Error generating Journal, " + e.name + ' : ' + e.message
        };
        dialog.alert(failed_dialog);
      }
    }

    function renewalPosting(creditAccountParams) {
      try {
        var transid = currRecord.id;
        console.log("creditAccountParams", creditAccountParams)

        var depoRec = record.load({
          type: "customrecord_sol_invst_fixed_deposits",
          id: transid,
          isDynamic: true
        });

        var invstBank = depoRec.getValue("custrecord_sol_invtr_fd_bank_fin_insti");
        // console.log("invstBank", invstBank);
        // Load Record Bank
        var recBank = record.load({
          type: "customrecord_sol_invst_bank_master_data",
          id: invstBank,
          isDynamic: true
        });
        var bankGl = recBank.getValue("custrecord_sol_bank_master_bankgl");
        var bankName = recBank.getValue("custrecord_sol_invst_bmd_name");

        if (!bankGl) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Bank: " + bankName + " before create deposit journal"
          };
          dialog.alert(failed_dialog);
          return;
        }

        var rec_JE = record.create({
          type: record.Type.JOURNAL_ENTRY,
          isDynamic: true,
        });

        var invstAmountRenewal = depoRec.getValue("custrecord_sol_fd_revewal");

        if (!invstAmountRenewal) {
          var failed_dialog = {
            title: 'Error Renewal',
            message: "Please specify the RENEWAL amount"
          };
          dialog.alert(failed_dialog);
          return;
        }

        //credit 1
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        // var creditAccnt = creditAccountParams;
        // var srcAccount = search.create({
        //   type: 'account',
        //   columns: ['internalid'],
        //   filters: [{
        //     name: 'number',
        //     operator: 'is',
        //     values: creditAccnt
        //   }, ]
        // }).run().getRange({
        //   start: 0,
        //   end: 1
        // });
        // var creditAccnt_id = srcAccount[0].getValue('internalid')
        var creditAccnt_id = creditAccountParams;

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: creditAccnt_id,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: invstAmountRenewal,
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
          value: bankGl,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: invstAmountRenewal,
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

        if (jeID) {
          depoRec.setValue({
            fieldId: "custrecord_sol_invtr_fd_journal_link3",
            value: jeID,
          });

          depoRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var jeURL = url.resolveRecord({
            isEditMode: true,
            recordId: jeID,
            recordType: record.Type.JOURNAL_ENTRY
          });
          console.log("jeURL", jeURL)
          window.location.replace(jeURL);
        }
      } catch (e) {
        console.log("Error when generating Journal", e.name + ' : ' + e.message);
        var failed_dialog = {
          title: 'Process Result',
          message: "Error generating Journal, " + e.name + ' : ' + e.message
        };
        dialog.alert(failed_dialog);
      }
    }

    function maturityPosting(creditAccountParams) {
      try {
        console.log("creditAccountParams", creditAccountParams);
        var transid = currRecord.id;
        console.log("transid", transid);

        var depoRec = record.load({
          type: "customrecord_sol_invst_fixed_deposits",
          id: transid,
          isDynamic: true
        });

        var invstBank = depoRec.getValue("custrecord_sol_invtr_fd_bank_fin_insti");
        console.log("invstBank", invstBank);
        // Load Record Bank
        var recBank = record.load({
          type: "customrecord_sol_invst_bank_master_data",
          id: invstBank,
          isDynamic: true
        });
        var bankGl = recBank.getValue("custrecord_sol_bank_master_bankgl");
        var bankName = recBank.getValue("custrecord_sol_invst_bmd_name");
        var bankFD = recBank.getValue("custrecord_sol_bank_master_fd");

        console.log("after bank record");

        if (!bankGl) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Bank: " + bankName + " before create deposit journal"
          };
          dialog.alert(failed_dialog);
          return;
        }

        if (!bankFD) {
          var failed_dialog = {
            title: 'Error BANK FD',
            message: "Please specify FD Account for Bank: " + bankName + " before create deposit journal"
          };
          dialog.alert(failed_dialog);
          return;
        }

        var rec_JE = record.create({
          type: "customtransaction_sol_investment_journal",
          isDynamic: true,
        });

        var invstAmountWithdraw = depoRec.getValue("custrecord_sol_fd_withdraw") || 0;
        var invstAmountTotalInterest = depoRec.getValue("custrecord_sol_invtr_fd_proft_maturty_dt") || 0;
        var invstAmountCurrent = depoRec.getValue("custrecord_sol_invtr_fd_invst_amt_lastyr") || 0; //change from Muralii on 22/2/23 from current to last
        var invstAmountDebit = parseFloat(invstAmountWithdraw) + parseFloat(invstAmountTotalInterest);

        console.log("amount");

        if (!invstAmountCurrent) {
          var failed_dialog = {
            title: 'Error',
            message: "Please specify the INVESTMENT AMOUNT PREVIOUS FY amount"
          };
          dialog.alert(failed_dialog);
          return;
        }

        if (!invstAmountTotalInterest) {
          var failed_dialog = {
            title: 'Error Total',
            message: "Please specify the TOTAL INTEREST/ PROFIT ON MATURITY DATE amount"
          };
          dialog.alert(failed_dialog);
          return;
        }

        //credit 1
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        var creditAccnt_id = creditAccountParams;

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: creditAccnt_id,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: invstAmountTotalInterest,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end credit 1

        //credit 2
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: bankFD,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: invstAmountCurrent,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end credit 2

        //debit 1
        rec_JE.selectNewLine({
          sublistId: 'line',
        });
        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: bankFD,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: invstAmountTotalInterest,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end debit

        //debit 2
        rec_JE.selectNewLine({
          sublistId: 'line',
        });
        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: bankGl,
          ignoreFieldChange: true,
        });

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: invstAmountCurrent,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });
        // end debit 2

        var jeID = rec_JE.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        if (jeID) {
          depoRec.setValue({
            fieldId: "custrecord_sol_invtr_fd_journal_link2",
            value: jeID,
          });

          depoRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var jeURL = url.resolveRecord({
            isEditMode: true,
            recordId: jeID,
            recordType: "customtransaction_sol_investment_journal"
          });
          console.log("jeURL", jeURL)
          window.location.replace(jeURL);
        }
      } catch (e) {
        console.log("Error when generating Journal", e.name + ' : ' + e.message);
        var failed_dialog = {
          title: 'Process Result',
          message: "Error generating Journal, " + e.name + ' : ' + e.message
        };
        dialog.alert(failed_dialog);
      }
    }

    return {
        pageInit: pageInit,
        maturityPosting: maturityPosting
    };
  });