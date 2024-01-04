/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/ui/dialog", "N/url"], (runtime, log, record, dialog, url) => {
  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      var rec = context.newRecord;
      var form = context.form;
      // var journalRenewal = rec.getValue("custrecord_sol_invtr_fd_journal_link3");
      var journalMaturity = rec.getValue("custrecord_sol_invtr_fd_journal_link2");
      var depoStatus = rec.getValue("custrecord_sol_fd_app_sts");
      var creditAccountParams = runtime.getCurrentScript().getParameter("custscriptcredit_account");

      // if (!journalRenewal) {
      //   form.addButton({
      //     id: 'custpage_button_renewal_posting',
      //     label: "Renewal",
      //     functionName: "renewalPosting(" + creditAccountParams + ")"
      //   });
      // }
      //
      // if (!journalWithdrawal) {
      //   form.addButton({
      //     id: 'custpage_button_withdrawal_posting',
      //     label: "Withdrawal",
      //     functionName: "withdrawalPosting(" + creditAccountParams + ")"
      //   });
      // }

      if (!journalMaturity && depoStatus == 2) {
        form.addButton({
          id: "custpage_button_maturity_posting",
          label: "Maturity Posting",
          functionName: "maturityPosting(" + creditAccountParams + ")",
        });
      }
      context.form.clientScriptModulePath = "SuiteScripts/investment_fixed_deposit_journal_post_cs.js";
    }
  }

  function afterSubmit(context) {
    try {
      log.debug("afterSubmit", "afterSubmit");
      if (context.type == "create" || context.type == "edit") {
        let recid = context.newRecord.id;
        let depoRec = record.load({
          type: context.newRecord.type,
          id: recid,
        });
        var depoStatus = depoRec.getValue("custrecord_sol_fd_app_sts");
        log.debug("depoStatus", depoStatus);
        var journalApproved = depoRec.getValue("custrecord_sol_fd_journal_approved");
        log.debug("journalApproved", journalApproved);
        // set value revewal
        if (context.type == "create") {
          var revewal = depoRec.getValue("custrecord_sol_invtr_fd_invst_amt_thisyr");
        } else if (context.type == "edit") {
          var revewal = parseFloat(depoRec.getValue("custrecord_sol_invtr_fd_invst_amt_thisyr")) + parseFloat(depoRec.getValue("custrecord_sol_invtr_fd_proft_maturty_dt") || 0) - parseFloat(depoRec.getValue("custrecord_sol_fd_withdraw") || 0);
        } else {
          var revewal = depoRec.getValue("custrecord_sol_fd_revewal");
        }

        depoRec.setValue({
          fieldId: "custrecord_sol_fd_revewal",
          value: revewal,
        });
        // end set value revewal

        // log.debug("approved", true);
        if (!journalApproved) {
          var invstBank = depoRec.getValue("custrecord_sol_invtr_fd_bank_fin_insti");
          log.debug("invstBank", invstBank);

          var journalID = depoRec.getValue("custrecord_sol_invtr_fd_journal_link");
          if (!journalID) {
            var rec_JE = record.create({
              type: "customtransaction_sol_investment_journal",
              isDynamic: true,
            });
            log.debug("do create journal", true);
          } else {
            var rec_JE = record.load({
              type: "customtransaction_sol_investment_journal",
              id: journalID,
              isDynamic: true,
            });
            log.debug("do update journal", true);
          }

          // Load Record Bank
          var recBank = record.load({
            type: "customrecord_sol_invst_bank_master_data",
            id: invstBank,
            isDynamic: true,
          });
          var bankGl = recBank.getValue("custrecord_sol_bank_master_bankgl");
          var bankName = recBank.getValue("custrecord_sol_invst_bmd_name");
          var bankFD = recBank.getValue("custrecord_sol_bank_master_fd");
          log.debug("bankGl Master", bankGl);

          //debit
          if (!journalID) {
            rec_JE.selectNewLine({
              sublistId: "line",
            });
          } else {
            rec_JE.selectLine({
              sublistId: "line",
              line: 0,
            });
          }

          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "account",
            value: bankFD,
            ignoreFieldChange: true,
          });

          var invstAmountThisYear = depoRec.getValue("custrecord_sol_invtr_fd_invst_amt_thisyr");
          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "debit",
            value: invstAmountThisYear,
            ignoreFieldChange: true,
          });
          log.debug("invstAmountThisYear", invstAmountThisYear);
          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "department",
            value: 811,
            ignoreFieldChange: true,
          });
          rec_JE.commitLine({
            sublistId: "line",
          });
          // end debit

          //credit
          if (!journalID) {
            rec_JE.selectNewLine({
              sublistId: "line",
            });
          } else {
            rec_JE.selectLine({
              sublistId: "line",
              line: 1,
            });
          }

          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "account",
            value: bankGl,
            ignoreFieldChange: true,
          });
          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "credit",
            value: invstAmountThisYear,
            ignoreFieldChange: true,
          });
          rec_JE.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "department",
            value: 811,
            ignoreFieldChange: true,
          });
          rec_JE.commitLine({
            sublistId: "line",
          });
          // end credit

          rec_JE.setValue({
            fieldId: "custbody_sol_fixed_deposit",
            value: recid,
          });

          if (depoStatus == 2) {
            rec_JE.setValue({
              fieldId: "transtatus",
              value: "A",
            });
            depoRec.setValue({
              fieldId: "custrecord_sol_fd_journal_approved",
              value: true,
            });
          } else {
            rec_JE.setValue({
              fieldId: "transtatus",
              value: "B",
            });
          }

          var jeID = rec_JE.save({
            enableSourcing: true,
            ignoreMandatoryFields: true,
          });

          if (jeID) {
            depoRec.setValue({
              fieldId: "custrecord_sol_invtr_fd_journal_link",
              value: jeID,
            });
            log.debug("jeID", jeID);

            var jeURL = url.resolveRecord({
              isEditMode: true,
              recordId: jeID,
              recordType: "customtransaction_sol_investment_journal",
            });
            log.debug("jeURL", jeURL);
          }
        }

        depoRec.save({
          enableSourcing: true,
          ignoreMandatoryFields: true,
        });
      }
    } catch (e) {
      log.error(e.name, e);
    }
  }
  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});
