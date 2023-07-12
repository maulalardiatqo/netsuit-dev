/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/currentRecord",
  "N/ui/dialog",
], function(currentRecord, dialog) {
  var exports = {};

  function pageInit(context) {
    let rec = context.currentRecord;
    log.debug("type", rec.type);
    let type = rec.type;
    var modul;
    if (type.includes("itq")) {
      modul = "itq";
    } else if (type.includes("rfq")) {
      modul = "rfq";
    } else {
      modul = "rfp";
    }
    let auctionType = rec.getValue('custrecord_sol_' + modul + '_auction_type');
    let bidEndDate = rec.getValue('custrecord_sol_' + modul + '_bid_end_date');
    let getAuctionEndTime = rec.getValue('custrecord_sol_' + modul + '_auction_end_time');
    log.debug("getAuctionEndTime", getAuctionEndTime);
    if (auctionType == 2) {
      let startTime = rec.getField({
        fieldId: 'custrecord_sol_' + modul + '_auction_start_time'
      });
      let endTime = rec.getField({
        fieldId: 'custrecord_sol_' + modul + '_auction_end_time'
      });
      startTime.isDisabled = true;
      endTime.isDisabled = true;
    }
  }

  function fieldChanged(context) {
    let rec = context.currentRecord;
    log.debug("type", rec.type);
    let type = rec.type;
    var modul;
    if (type.includes("itq")) {
      modul = "itq";
    } else if (type.includes("rfq")) {
      modul = "rfq";
    } else {
      modul = "rfp";
    }
    if (context.fieldId == 'custrecord_sol_' + modul + '_auction_type') {
      let auctionType = rec.getValue('custrecord_sol_' + modul + '_auction_type');
      let startTime = rec.getField({
        fieldId: 'custrecord_sol_' + modul + '_auction_start_time'
      });
      let endTime = rec.getField({
        fieldId: 'custrecord_sol_' + modul + '_auction_end_time'
      });
      if (auctionType == 2) {
        startTime.isDisabled = true;
        endTime.isDisabled = true;
      } else {
        startTime.isDisabled = false;
        endTime.isDisabled = false;
      }
    }
  }

  function saveRecord(context) {
    let rec = context.currentRecord;
    log.debug("type", rec.type);
    let type = rec.type;
    var modul;
    if (type.includes("itq")) {
      modul = "itq";
    } else if (type.includes("rfq")) {
      modul = "rfq";
    } else {
      modul = "rfp";
    }

    let auctionType = rec.getValue('custrecord_sol_' + modul + '_auction_type');
    if (auctionType == 1) {
      let startTime = rec.getValue('custrecord_sol_' + modul + '_auction_start_time');
      let endTime = rec.getValue('custrecord_sol_' + modul + '_auction_end_time');
      if (!startTime) {
        alert("AUCTION START TIME is required");
        return false;
      }
      if (!endTime) {
        alert("AUCTION END TIME is required");
        return false;
      }
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;
  exports.fieldChanged = fieldChanged;

  return exports;
});