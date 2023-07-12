/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
  record,
  search,
) {
  function beforeLoad(context) {
    try {
      var isEdit = context.type == context.UserEventType.EDIT;
      if (context.type == context.UserEventType.CREATE || isEdit) {
        let rec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id
        })
        var autoname = rec.getValue('autoname');
        log.debug("autoname", autoname);
        if (autoname) {
          rec.setValue('F')
        }
      }
    } catch (e) {
      err_messages = 'error in before load ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  return {
    beforeLoad: beforeLoad,
  };
});