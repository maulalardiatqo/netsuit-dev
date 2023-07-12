/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/url', 'N/log', 'N/search', 'N/runtime'],
  function(record, url, log, search, runtime) {
    //User Event -- Adds the button for populate quote list
    function beforeLoad(context) {
      var form = context.form;
      var rec = context.newRecord;
      var recId = rec.id;
      log.debug("Internal ID", recId);

      if (context.type == 'view') {
        try {

          var approval_status = rec.getText("custrecord_abj_rfq_status");
          const status_to_show_btn = ["Bid Closed", "Under Technical Evaluation", "Under Commercial Evaluation", "Rejected"];

          if (status_to_show_btn.includes(approval_status)) {

            log.debug("approval_status", approval_status);
            log.debug("status_to_show_btn", status_to_show_btn);
            form.addButton({
              id: 'custpage_pplt_quote_list',
              label: 'Populate Quotation List',
              functionName: "PopulateQuoteList"
            });
            context.form.clientScriptModulePath = "SuiteScripts/afc_rfq_populate_quote_cs.js";
          }
        } catch (e) {
          log.debug("error in before load", e.name + ': ' + e.message);
        }
      }
    }
    return {
      beforeLoad: beforeLoad
    }
  });