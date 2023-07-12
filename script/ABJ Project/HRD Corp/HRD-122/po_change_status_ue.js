/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        let rec = context.newRecord;
        let createdfrom = rec.getValue('createdfrom');
        let vendor = rec.getValue('entity');
        let supplierFeedback = search.create({
          type: 'customrecord_sol_supplier_feedback_form',
          columns: ['internalid', 'custrecord_sol_sfbf_polink'],
          filters: [{
            name: 'custrecord_sol_sfbf_polink',
            operator: 'is',
            values: createdfrom
          }, ]
        }).run().getRange(0, 1);

        function saveFeedback(feedBackData) {
          feedBackData.setValue({
            fieldId: "custrecord_sol_sfbf_polink",
            value: createdfrom,
          });
          feedBackData.setValue({
            fieldId: "custrecord_sol_sfbf_supname",
            value: vendor,
          });
          return feedBackData.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        }

        if (supplierFeedback.length <= 0) {
          let feedBackData = record.create({
            type: 'customrecord_sol_supplier_feedback_form',
          });
          let createdID = saveFeedback(feedBackData);
        }
      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }
  return {
    afterSubmit: afterSubmit
  };
});