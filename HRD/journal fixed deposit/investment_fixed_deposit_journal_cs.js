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
      var button = currRecord.getField({
        fieldId: 'custpage_button_maturity_posting'
      });
      if (button) {
        button.isHidden = true;
      }
    }

    function saveRecord(context) {
      try {
        console.log("start", "oke");

        // var transid = currRecord.id;

        // console.log("transid", transid);

        var depoRec = currRecord;

        var depoStatus = depoRec.getValue(
          "custrecord_sol_fd_app_sts"
        );
        console.log("depoStatus", depoStatus);
        
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

          if (!bankGl) {
            var failed_dialog = {
              title: 'Error BANK GL',
              message: "Please specify G/L Account for Bank: " + bankName + " before create deposit journal"
            };
            dialog.alert(failed_dialog);
            return false;
          }

          if (!bankFD) {
            var failed_dialog = {
              title: 'Error BANK FD',
              message: "Please specify FD Account for Bank: " + bankName + " before create deposit journal"
            };
            dialog.alert(failed_dialog);
            return false;
          }

          return true;
        return true;
      } catch (e) {
        console.log("Error", e.name + ' : ' + e.message);
      }

    }

    return {
      pageInit: pageInit,
      saveRecord: saveRecord,
    };
  });