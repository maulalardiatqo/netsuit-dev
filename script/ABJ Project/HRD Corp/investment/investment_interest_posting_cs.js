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

    function interestPosting(context) {
      try {

        var transid = currRecord.id;

        var recInvstReval = record.load({
          type: "customrecord_sol_invst_cash_sweeping",
          id: transid,
          isDynamic: true
        });

        var invstBank = recInvstReval.getValue("custrecord_sol_invst_cw_bank");
        console.log("invstBank", invstBank);

        var rec_JE = record.create({
          type: record.Type.JOURNAL_ENTRY,
          isDynamic: true,
        });
        // console.log("transid", transid);

        // Load Record Bank
        var recBank = record.load({
          type: "customrecord_sol_invst_bank_master_data",
          id: invstBank,
          isDynamic: true
        });
        var bankGl = recBank.getValue("custrecord_sol_bank_master_bankgl");
        var bankName = recBank.getValue("custrecord_sol_invst_bmd_name");
        // console.log("recBank", recBank);
        console.log("bankGl Master", bankGl);

        if (!bankGl) {
          var failed_dialog = {
            title: 'Error BANK GL',
            message: "Please specify G/L Account for Bank: " + bankName + " before create interest posting"
          };
          dialog.alert(failed_dialog);
          return;
        }

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
        // console.log("bankGl", bankGl);

        var transamount = recInvstReval.getValue("custrecord_sol_invtr_cw_interest_income");
        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: transamount,
          ignoreFieldChange: true,
        });
        // console.log("transamount", transamount);

        rec_JE.commitLine({
          sublistId: 'line'
        });

        //credit
        console.log("commit line", '0');
        rec_JE.selectNewLine({
          sublistId: 'line',
        });

        var creditAccnt = 'RV1004001';
        var srcAccount = search.create({
          type: 'account',
          columns: ['internalid'],
          filters: [{
            name: 'number',
            operator: 'is',
            values: creditAccnt
          }, ]
        }).run().getRange({
          start: 0,
          end: 1
        });
        var creditAccnt_id = srcAccount[0].getValue('internalid')
        // console.log("CreditAccnt_id", creditAccnt_id);

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: creditAccnt_id,
          ignoreFieldChange: true,
        });
        console.log("creditAccnt", creditAccnt);

        rec_JE.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: transamount,
          ignoreFieldChange: true,
        });

        rec_JE.commitLine({
          sublistId: 'line'
        });

        var JE_id = rec_JE.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        if (JE_id) {
          recInvstReval.setValue({
            fieldId: "custrecord_sol_invst_journal_link",
            value: JE_id,
          });
          console.log("JE_id", JE_id);

          recInvstReval.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          var JE_Url = url.resolveRecord({
            isEditMode: true,
            recordId: JE_id,
            recordType: record.Type.JOURNAL_ENTRY
          });
          console.log("JE_Url", JE_Url)
          window.location.replace(JE_Url);
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
      interestPosting: interestPosting,
    };
  });