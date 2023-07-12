/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/log', "N/ui/dialog", 'N/error'], (log, dialog, error) => {
  function beforeSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.CREATE) {
      let rec = scriptContext.newRecord;
      let total = rec.getValue('total');
      log.debug("beforeSubmit", "beforeSubmit");
      log.debug("total", total);
      if (total != 0) {
        var update_process_error = error.create({
          name: 'Bill Payments Process',
          message: 'Unable to submit manual submission on this page',
          notifyOff: true
        });
        throw update_process_error.name + '\n\n' + update_process_error.message + "\n";
      }
    }
  }
  return {
    beforeSubmit: beforeSubmit
  };
});