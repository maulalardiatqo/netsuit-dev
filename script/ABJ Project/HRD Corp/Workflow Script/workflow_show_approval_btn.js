/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/search', 'N/runtime', 'N/record', 'N/currentRecord'],
  function(search, runtime, record, currentRecord) {
    function onAction(scriptContext) {
      try {
        let rec = scriptContext.currentRecord;
        let type = rec.type;
        var modul;
        if (type.includes("itq")) {
          modul = "itq";
        } else if (type.includes("rfq")) {
          modul = "rfq";
        } else {
          modul = "rfp";
        }
        let getBidEndDate = rec.getValue('custrecord_sol_' + modul + '_bid_end_date');
        let auctionType = rec.getValue('custrecord_sol_' + modul + '_auction_type');
        let getAuctionEndTime = rec.getValue('custrecord_sol_' + modul + '_auction_end_time');
        let showButton = false;
        if (auctionType == 2) {
          let bidEndDate = new Date(getBidEndDate);
          let currentDate = new Date();
          if (currentDate.getTime() > bidEndDate.getTime()) {
            showButton = 'T';
          } else {
            showButton = 'F';
          }
        } else {
          let bidEndDate = new Date(getBidEndDate);
          let currentDate = new Date();
          if (currentDate.getTime() > bidEndDate.getTime() || currentDate.getTime() == bidEndDate.getTime()) {
            showButton = 'T';
          } else {
            showButton = 'F';
          }
        }

        return showButton;

      } catch (ex) {
        log.error(ex.name, ex);
        return 'F';
      }
    }
    return {
      onAction: onAction
    }
  });