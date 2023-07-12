/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/ui/message', 'N/currentRecord', 'N/record', 'N/ui/dialog', 'N/url', 'N/format'], function(search, message, currentRecord, record, dialog, url, format) {
    function pageInit(context) {}

    function generateNumber(subsidiary , dateBill) {
        console.log("execute");
        console.log('subsidiary', subsidiary)
        var searchBPNumber =  search.create({
            type: 'customrecord_bp_numbering',
            columns: ['internalid', 'custrecord_fcn_bpn_subsidiary', 'custrecord_fcn_bpn_last_run', 'custrecord_fcn_bpn_minimum_digit'],
            filters: [{
              name: 'custrecord_fcn_bpn_subsidiary',
              operator: 'is',
              values: subsidiary
            },]
          });
        var searchBPNumberSet = searchBPNumber.run()
        searchBPNumber = searchBPNumberSet.getRange({
            start: 0,
            end: 100
        });
        
      console.log('searchBPNumber', searchBPNumber)
      }
    return {
        pageInit: pageInit,
        generateNumber: generateNumber,
      };
    
    });