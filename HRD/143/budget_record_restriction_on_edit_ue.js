/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/ui/serverWidget", "N/record"], (runtime, log, serverWidget, record) => {
  function beforeLoad(context) {
    try {
      if (context.type === context.UserEventType.EDIT) {
        let rec = context.newRecord;
        log.debug("beforeLoad", true);
        let selectedCostCentre = rec.getValue("custrecord_sol_budsub_dep");
        let currentUser = runtime.getCurrentUser().id;
        let ccRec = record.load({
          type: 'department',
          id: selectedCostCentre,
          isDynamic: true
        });
        log.debug("ccRec", ccRec);
        let budgetViewerEmp = ccRec.getValue("custrecord_sol_dep_bud_view");
        log.debug("budgetViewerEmp", {
          budgetViewerEmp: budgetViewerEmp,
          currentUser: currentUser
        });
        if (currentUser == budgetViewerEmp) {
          let form = context.form;
          form.removeButton({
            id: "submitter"
          });
        }
      }
    } catch (error) {
      log.debug("Error in before load", error.name + ' : ' + error.message);
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});