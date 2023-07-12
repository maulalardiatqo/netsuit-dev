/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/search", "N/currentRecord", "N/record", "N/ui/dialog"], function(
    runtime,
    log,
    search,
    currentRecord,
    record,
    dialog
  ) {
    
    function pageInit(context) {}
     
    function bTickUntick() {
      var currRecord = currentRecord.get();
      try {
        
        var id = currRecord.id;

        var checklist = record.load({
          type: "vendorbill",
          id: id,
          isDynamic: true
        });
        var chek = checklist.getValue({fieldId:'paymenthold'});
        checklist.setValue({fieldId:'paymenthold', value : !chek, ignoreFieldChange: true});
        log.debug(typeof chek)
          checklist.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
      } catch (e) {
        console.log("Error when generating po", e.name + ' : ' + e.message);
        var failed_dialog = {
          title: 'Process Result',
          message: "Error create purchase Order, " + e.name + ' : ' + e.message
        };
        dialog.alert(failed_dialog);
      }
    }
  
    return {
      pageInit: pageInit,
      bTickUntick: bTickUntick
    };
  });